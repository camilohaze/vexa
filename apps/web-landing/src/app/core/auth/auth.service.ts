import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AuthTokens, User, UserRole } from '@vexa/shared';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResult {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole.COMPANY | UserRole.COURIER;
  acceptTerms: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  async login(email: string, password: string): Promise<LoginResult> {
    const tokens = await firstValueFrom(
      this.http.post<AuthTokens>(`${this.api}/auth/login`, { email: email.trim(), password })
    );
    return { user: await this.me(tokens), tokens };
  }

  register(payload: RegisterPayload) {
    return firstValueFrom(this.http.post<{ message: string }>(`${this.api}/auth/register`, payload));
  }

  async verifyEmail(email: string, code: string): Promise<LoginResult> {
    const tokens = await firstValueFrom(
      this.http.post<AuthTokens>(`${this.api}/auth/verify-email`, { email: email.trim(), code })
    );
    return { user: await this.me(tokens), tokens };
  }

  resendVerification(email: string) {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${this.api}/auth/resend-verification`, { email: email.trim() })
    );
  }

  forgotPassword(email: string) {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${this.api}/auth/forgot-password`, { email: email.trim() })
    );
  }

  resetPassword(email: string, code: string, password: string) {
    return firstValueFrom(
      this.http.post<{ message: string }>(`${this.api}/auth/reset-password`, { email: email.trim(), code, password })
    );
  }

  /** Persists a session under the same localStorage keys every federated remote's AuthStore reads. */
  persistSession(user: User, tokens: AuthTokens): void {
    localStorage.setItem('vexa.tokens', JSON.stringify(tokens));
    localStorage.setItem('vexa.user', JSON.stringify(user));
  }

  /** Where the shell should route to after a successful login, based on role. */
  roleToPath(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.COURIER:
        return '/courier';
      default:
        return '/company';
    }
  }

  /** Fetches the current user for a raw access token (e.g. tokens arriving via OAuth callback query params). */
  fetchUser(accessToken: string): Promise<User> {
    return firstValueFrom(
      this.http.get<User>(`${this.api}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    );
  }

  private me(tokens: AuthTokens): Promise<User> {
    return this.fetchUser(tokens.accessToken);
  }
}
