import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthProvider, AuthTokens, User } from '@vexa/shared';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../api/api.service';

const STORAGE_KEY = 'vexa.tokens';
const USER_KEY = 'vexa.user';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiService);

  readonly tokens = signal<AuthTokens | null>(this.read<AuthTokens>(STORAGE_KEY));
  readonly user = signal<User | null>(this.read<User>(USER_KEY));
  readonly isAuthenticated = computed(() => !!this.tokens()?.accessToken);

  async loginWithPassword(email: string, password: string): Promise<void> {
    const tokens = await firstValueFrom(this.api.post<AuthTokens>('auth/login', { email: email.trim(), password }));
    this.handleCallback({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: String(tokens.expiresIn),
    });
    const user = await firstValueFrom(this.api.get<User>('users/me'));
    this.setUser(user);
  }

  loginWithProvider(provider: AuthProvider) {
    const url = `${environment.apiUrl}/auth/${provider.toLowerCase()}?client=${environment.authClient}`;
    window.location.href = url;
  }

  handleCallback(params: Record<string, string | undefined>) {
    const { access_token, refresh_token, expires_in } = params;
    if (!access_token || !refresh_token) return;
    const tokens: AuthTokens = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: Number(expires_in ?? 900),
    };
    this.tokens.set(tokens);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }

  setUser(user: User) {
    this.user.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  logout() {
    this.tokens.set(null);
    this.user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
