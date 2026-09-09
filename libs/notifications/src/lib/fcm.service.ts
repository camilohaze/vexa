import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApp, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private messaging?: Messaging;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set; push notifications disabled');
      return;
    }
    const credential = cert(JSON.parse(raw) as ServiceAccount);
    const app = getApps().length ? getApp() : initializeApp({ credential });
    this.messaging = getMessaging(app);
  }

  get enabled(): boolean {
    return !!this.messaging;
  }

  async sendToToken(token: string, message: PushMessage): Promise<string | undefined> {
    if (!this.messaging) return undefined;
    return this.messaging.send({
      token,
      notification: { title: message.title, body: message.body },
      data: message.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', contentAvailable: true } } },
    });
  }

  async sendToTokens(tokens: string[], message: PushMessage) {
    if (!this.messaging || !tokens.length) return undefined;
    return this.messaging.sendEachForMulticast({
      tokens,
      notification: { title: message.title, body: message.body },
      data: message.data,
    });
  }
}
