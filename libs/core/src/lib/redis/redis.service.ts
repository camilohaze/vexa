import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { GeoPoint, RedisKeys } from '@vexa/shared';

export interface NearbyCourier {
  courierId: string;
  distanceMeters: number;
  location: GeoPoint;
}

type MessageHandler<T> = (payload: T, channel: string) => void | Promise<void>;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly handlers = new Map<string, Set<MessageHandler<unknown>>>();
  readonly client: Redis;
  readonly subscriber: Redis;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });
    this.subscriber = new Redis(url, { lazyConnect: true });
  }

  async onModuleInit() {
    await Promise.all([this.client.connect(), this.subscriber.connect()]);
    this.subscriber.on('message', (channel, raw) => this.dispatch(channel, raw));
    this.logger.log('Redis connected');
  }

  async onModuleDestroy() {
    await Promise.all([this.client.quit(), this.subscriber.quit()]);
  }

  duplicate(): Redis {
    return this.client.duplicate();
  }

  async publish<T>(channel: string, payload: T): Promise<number> {
    return this.client.publish(channel, JSON.stringify(payload));
  }

  async subscribe<T>(channel: string, handler: MessageHandler<T>): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.handlers.get(channel)?.add(handler as MessageHandler<unknown>);
  }

  async setCourierLocation(courierId: string, point: GeoPoint, ttlSeconds = 120) {
    await this.client
      .multi()
      .geoadd(RedisKeys.COURIERS_GEO, point.lng, point.lat, courierId)
      .set(RedisKeys.COURIER_LAST_SEEN(courierId), Date.now(), 'EX', ttlSeconds)
      .exec();
  }

  async removeCourierLocation(courierId: string) {
    await this.client.zrem(RedisKeys.COURIERS_GEO, courierId);
  }

  async findNearbyCouriers(
    center: GeoPoint,
    radiusMeters: number,
    limit: number
  ): Promise<NearbyCourier[]> {
    const raw = (await this.client.geosearch(
      RedisKeys.COURIERS_GEO,
      'FROMLONLAT',
      center.lng,
      center.lat,
      'BYRADIUS',
      radiusMeters,
      'm',
      'ASC',
      'COUNT',
      limit,
      'WITHDIST',
      'WITHCOORD'
    )) as [string, string, [string, string]][];

    return raw.map(([courierId, dist, [lng, lat]]) => ({
      courierId,
      distanceMeters: Number(dist),
      location: { lat: Number(lat), lng: Number(lng) },
    }));
  }

  private dispatch(channel: string, raw: string) {
    const handlers = this.handlers.get(channel);
    if (!handlers?.size) return;
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      this.logger.warn(`Invalid JSON on channel ${channel}`);
      return;
    }
    handlers.forEach((handler) => {
      Promise.resolve(handler(payload, channel)).catch((err) =>
        this.logger.error(`Handler failed for ${channel}`, err?.stack ?? err)
      );
    });
  }
}
