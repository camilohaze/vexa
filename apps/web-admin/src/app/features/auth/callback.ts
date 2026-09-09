import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User } from '@vexa/shared';
import { ApiService } from '../../core/api/api.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'vexa-auth-callback',
  template: `<div class="callback"><p>Iniciando sesión…</p></div>`,
  styles: `.callback { min-height: 100vh; display: grid; place-items: center; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
  readonly access_token = input<string>();
  readonly refresh_token = input<string>();
  readonly expires_in = input<string>();

  private readonly auth = inject(AuthStore);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  async ngOnInit() {
    this.auth.handleCallback({
      access_token: this.access_token(),
      refresh_token: this.refresh_token(),
      expires_in: this.expires_in(),
    });
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/auth/login']);
      return;
    }
    try {
      const user = await firstValueFrom(this.api.get<User>('users/me'));
      this.auth.setUser(user);
    } catch {
      // el interceptor reintentará en la próxima petición
    }
    await this.router.navigate(['/dashboard']);
  }
}
