import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthProvider } from '@vexa/shared';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'vexa-login',
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="login">
      <mat-card class="login__card">
        <mat-card-header>
          <mat-card-title>Vexa Admin</mat-card-title>
          <mat-card-subtitle>Acceso restringido a administradores</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @for (provider of providers; track provider.id) {
            <button
              mat-stroked-button
              class="login__provider"
              (click)="auth.loginWithProvider(provider.id)"
            >
              <mat-icon>{{ provider.icon }}</mat-icon>
              Continuar con {{ provider.label }}
            </button>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .login { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .login__card { width: 380px; padding: 16px; }
    .login__provider {
      width: 100%; margin-top: 12px; display: flex;
      align-items: center; justify-content: center; gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly auth = inject(AuthStore);
  protected readonly providers = [
    { id: AuthProvider.GOOGLE, label: 'Google', icon: 'account_circle' },
    { id: AuthProvider.APPLE, label: 'Apple', icon: 'phone_iphone' },
  ];
}
