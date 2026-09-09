import { Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { AuthenticatedUser, TokenService } from '@vexa/auth';
import { RedisService } from '@vexa/core';
import {
  CourierLocationEvent,
  JobAcceptedEvent,
  JobCancelledEvent,
  JobCompletedEvent,
  JobMessageEvent,
  NewJobEvent,
  RedisChannels,
  RedisKeys,
  SocketEventPayloads,
  SocketEvents,
  SocketRooms,
  UserRole,
} from '@vexa/shared';
import { WsJwtGuard, WS_USER } from './ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  data: { user: AuthenticatedUser };
}

@WebSocketGateway({
  path: '/socket.io',
  namespace: 'realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly redis: RedisService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService
  ) {}

  afterInit(server: Server) {
    server.adapter(createAdapter(this.redis.duplicate(), this.redis.duplicate()));
    server.use((socket, next) => {
      try {
        const token =
          (socket.handshake.auth?.['token'] as string | undefined) ??
          socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (!token) return next(new Error('Missing token'));
        const payload = this.tokens.verifyAccess(token);
        socket.data.user = { ...payload, id: payload.sub };
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
    this.logger.log('Socket.IO Redis adapter attached');
  }

  async onModuleInit() {
    await this.redis.subscribe<NewJobEvent>(RedisChannels.JOB_OFFERED, (payload) =>
      this.emitJobEvent(SocketEvents.NEW_JOB, payload)
    );
    await this.redis.subscribe<JobAcceptedEvent>(RedisChannels.JOB_ACCEPTED, (payload) =>
      this.emitJobEvent(SocketEvents.JOB_ACCEPTED, payload)
    );
    await this.redis.subscribe<JobCancelledEvent>(RedisChannels.JOB_CANCELLED, (payload) =>
      this.emitJobEvent(SocketEvents.JOB_CANCELLED, payload)
    );
    await this.redis.subscribe<JobCompletedEvent>(RedisChannels.JOB_COMPLETED, (payload) =>
      this.emitJobEvent(SocketEvents.JOB_COMPLETED, payload)
    );
    await this.redis.subscribe<CourierLocationEvent>(RedisChannels.COURIER_LOCATION, (payload) =>
      this.relayLocation(payload)
    );
    await this.redis.subscribe<JobMessageEvent>(RedisChannels.JOB_MESSAGE, (payload) =>
      this.emitJobEvent(SocketEvents.JOB_MESSAGE, payload)
    );
  }

  async handleConnection(socket: AuthenticatedSocket) {
    const user = socket.data?.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }
    const rooms: string[] = [SocketRooms.admins()].filter(() => user.role === UserRole.ADMIN);
    if (user.companyId) rooms.push(SocketRooms.company(user.companyId));
    if (user.courierId) rooms.push(SocketRooms.courier(user.courierId));
    await socket.join(rooms);
    this.logger.log(`Socket connected: ${socket.id} user=${user.sub} rooms=${rooms.join(',')}`);
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    this.logger.log(`Socket disconnected: ${socket.id}`);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SocketEvents.COURIER_LOCATION)
  async onCourierLocation(
    socket: AuthenticatedSocket,
    payload: Omit<CourierLocationEvent, 'courierId' | 'recordedAt'>
  ) {
    const user = socket.data.user;
    if (user.role !== UserRole.COURIER || !user.courierId) return;
    const event: CourierLocationEvent = {
      ...payload,
      courierId: user.courierId,
      recordedAt: new Date().toISOString(),
    };
    await this.redis.setCourierLocation(user.courierId, event);
    await this.redis.publish(RedisChannels.COURIER_LOCATION, event);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('JOB_SUBSCRIBE')
  async subscribeToJob(socket: AuthenticatedSocket, payload: { jobId: string }) {
    if (!payload?.jobId) return;
    await socket.join(SocketRooms.job(payload.jobId));
  }

  private emitJobEvent<E extends keyof SocketEventPayloads>(
    event: E,
    payload: SocketEventPayloads[E]
  ) {
    if (!this.server) return;
    this.server.to(SocketRooms.admins()).emit(event, payload);
    const jobId = (payload as { jobId?: string }).jobId ?? (payload as { job?: { id?: string } }).job?.id;
    if (jobId) this.server.to(SocketRooms.job(jobId)).emit(event, payload);
    const companyId = (payload as { job?: { companyId?: string } }).job?.companyId;
    if (companyId) this.server.to(SocketRooms.company(companyId)).emit(event, payload);
    if (event === SocketEvents.NEW_JOB) {
      (payload as NewJobEvent).offeredTo?.forEach((courierId) =>
        this.server.to(SocketRooms.courier(courierId)).emit(event, payload)
      );
    }
    const courierId = (payload as { courierId?: string }).courierId;
    if (courierId) this.server.to(SocketRooms.courier(courierId)).emit(event, payload);
  }

  private relayLocation(event: CourierLocationEvent) {
    if (!this.server) return;
    this.server.to(SocketRooms.admins()).emit(SocketEvents.COURIER_LOCATION, event);
    if (event.jobId) {
      this.server.to(SocketRooms.job(event.jobId)).emit(SocketEvents.COURIER_LOCATION, event);
    }
  }
}
