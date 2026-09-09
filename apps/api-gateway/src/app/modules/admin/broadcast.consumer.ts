import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '@vexa/core';
import { FcmService } from '@vexa/notifications';
import { RedisChannels } from '@vexa/shared';

interface BroadcastPayload {
  segment: 'couriers' | 'companies' | 'all';
  title: string;
  body: string;
  tokens: string[];
  scheduledAt?: string | null;
}

/** Escucha `notifications.broadcast` y envía el push multicast vía FCM. */
@Injectable()
export class BroadcastConsumer implements OnModuleInit {
  private readonly logger = new Logger(BroadcastConsumer.name);

  constructor(
    private readonly redis: RedisService,
    private readonly fcm: FcmService
  ) {}

  async onModuleInit() {
    await this.redis.subscribe<BroadcastPayload>(
      RedisChannels.NOTIFICATION_BROADCAST,
      async (payload) => {
        if (payload.scheduledAt && new Date(payload.scheduledAt) > new Date()) {
          // Envío diferido simple: se reprograma para la hora indicada.
          const delay = new Date(payload.scheduledAt).getTime() - Date.now();
          setTimeout(() => this.deliver(payload), Math.min(delay, 86_400_000));
          this.logger.log(`Broadcast programado en ${Math.round(delay / 60000)} min`);
          return;
        }
        await this.deliver(payload);
      }
    );
  }

  private async deliver(payload: BroadcastPayload) {
    if (!payload.tokens.length) {
      this.logger.warn(`Broadcast ${payload.segment}: sin tokens FCM destino`);
      return;
    }
    const result = await this.fcm.sendToTokens(payload.tokens, {
      title: payload.title,
      body: payload.body,
      data: { type: 'BROADCAST', segment: payload.segment },
    });
    this.logger.log(
      `Broadcast ${payload.segment}: ${result?.successCount ?? 0}/${payload.tokens.length} enviados`
    );
  }
}
