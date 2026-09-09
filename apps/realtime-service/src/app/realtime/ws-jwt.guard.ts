import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TokenService } from '@vexa/auth';

export const WS_USER = 'user';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const socket = context.switchToWs().getClient<Socket>();
    try {
      const token =
        (socket.handshake.auth?.['token'] as string | undefined) ??
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) throw new WsException('Missing token');
      const payload = this.tokens.verifyAccess(token);
      socket.data[WS_USER] = { ...payload, id: payload.sub };
      return true;
    } catch (error) {
      throw error instanceof WsException ? error : new WsException('Invalid token');
    }
  }
}
