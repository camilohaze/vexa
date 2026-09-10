import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthTokens } from '@vexa/shared';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'vexa-landing-auth-callback',
  template: `
    <div class="callback">
      @if (error()) {
        <p>{{ error() }}</p>
      } @else {
        <p>Signing you in…</p>
      }
    </div>
  `,
  styles: `.callback { min-height: 100vh; display: grid; place-items: center; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
  readonly access_token = input<string>();
  readonly refresh_token = input<string>();
  readonly expires_in = input<string>();

  protected error = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    const accessToken = this.access_token();
    const refreshToken = this.refresh_token();
    if (!accessToken || !refreshToken) {
      await this.router.navigateByUrl('/auth/login');
      return;
    }
    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: Number(this.expires_in() ?? 900),
    };
    try {
      const user = await this.auth.fetchUser(accessToken);
      this.auth.persistSession(user, tokens);
      await this.router.navigateByUrl(this.auth.roleToPath(user.role));
    } catch {
      await this.router.navigateByUrl('/auth/login');
    }
  }
}
