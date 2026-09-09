import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { SocketEvent, SocketEventPayloads } from '@vexa/shared';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../auth/auth.store';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthStore);
  private socket?: Socket;

  readonly connected = signal(false);

  connect() {
    const token = this.auth.tokens()?.accessToken;
    if (!token || this.socket?.connected) return;
    this.socket = io(`${environment.realtimeUrl}/realtime`, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: false,
    });
    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.connect();
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.connected.set(false);
  }

  on<E extends SocketEvent>(event: E): Observable<SocketEventPayloads[E]> {
    return new Observable((subscriber) => {
      const socket = this.socket as unknown as {
        on(ev: string, cb: (p: SocketEventPayloads[E]) => void): void;
        off(ev: string, cb: (p: SocketEventPayloads[E]) => void): void;
      } | undefined;
      const handler = (payload: SocketEventPayloads[E]) => subscriber.next(payload);
      socket?.on(event, handler);
      return () => socket?.off(event, handler);
    });
  }

  emit(event: string, payload: unknown) {
    this.socket?.emit(event, payload);
  }

  subscribeToJob(jobId: string) {
    this.socket?.emit('JOB_SUBSCRIBE', { jobId });
  }
}
