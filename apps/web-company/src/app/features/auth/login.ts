import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthProvider } from '@vexa/shared';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'vexa-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  template: `
    <div class="login">
      <section class="login__brand" aria-label="Vexa">
        <div class="login__brand-content">
          <img class="login__logo" src="/favicon.ico" alt="Vexa" />
          <h1 class="login__brand-title">Logistics, Simplified.</h1>
          <p class="login__brand-text">
            Conecta, envía y entrega con la red logística más inteligente del mercado.
          </p>
          <ul class="login__brand-list">
            <li><mat-icon>check_circle</mat-icon> Gestión de envíos en tiempo real</li>
            <li><mat-icon>check_circle</mat-icon> Matching automático de couriers</li>
            <li><mat-icon>check_circle</mat-icon> Pagos y facturación integrados</li>
          </ul>
        </div>
      </section>

      <section class="login__form-section" aria-label="Iniciar sesión">
        <div class="login__form-card">
          <h2 class="login__title">Bienvenido de nuevo</h2>
          <p class="login__subtitle">Inicia sesión para gestionar tus envíos</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="login__fields">
            <mat-form-field appearance="outline" class="login__field">
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="email" type="email" placeholder="nombre@empresa.com" />
              @if (form.get('email')?.hasError('required')) {
                <mat-error>El correo es obligatorio</mat-error>
              } @else if (form.get('email')?.hasError('email')) {
                <mat-error>Ingresa un correo válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="login__field">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="Ingresa tu contraseña"
              />
              <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword" [attr.aria-label]="'Mostrar contraseña'">
                <mat-icon>{{ showPassword ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required')) {
                <mat-error>La contraseña es obligatoria</mat-error>
              }
            </mat-form-field>

            <a class="login__forgot" routerLink="/auth/reset">¿Olvidaste tu contraseña?</a>

            @if (error()) {
              <div class="login__error">{{ error() }}</div>
            }

            <button
              mat-flat-button
              type="submit"
              class="login__submit"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" class="login__spinner"></mat-spinner>
              } @else {
                Iniciar sesión
              }
            </button>
          </form>

          <div class="login__divider">
            <span>o continúa con</span>
          </div>

          <div class="login__social">
            <button mat-stroked-button type="button" (click)="auth.loginWithProvider(AuthProvider.GOOGLE)">
              <mat-icon>account_circle</mat-icon>
              Google
            </button>
            <button mat-stroked-button type="button" (click)="auth.loginWithProvider(AuthProvider.APPLE)">
              <mat-icon>phone_iphone</mat-icon>
              Apple
            </button>
          </div>

          <p class="login__footer">
            ¿No tienes una cuenta?
            <a routerLink="/auth/register">Crear cuenta</a>
          </p>
        </div>
      </section>
    </div>
  `,
  styles: `
    :host { display: block; }
    .login { display: flex; min-height: 100vh; }
    .login__brand {
      display: none;
      flex: 1;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }
    .login__brand-content { max-width: 420px; }
    .login__logo { width: 40px; height: 40px; margin-bottom: 24px; }
    .login__brand-title { font-size: 2.25rem; font-weight: 700; margin: 0 0 16px; }
    .login__brand-text { font-size: 1.05rem; line-height: 1.6; opacity: 0.9; margin: 0 0 32px; }
    .login__brand-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
    .login__brand-list li { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; }
    .login__brand-list mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .login__form-section { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; background: #fff; }
    .login__form-card { width: 100%; max-width: 420px; }
    .login__title { font-size: 1.75rem; font-weight: 700; margin: 0 0 6px; color: #111827; }
    .login__subtitle { color: #6b7280; margin: 0 0 28px; }
    .login__fields { display: flex; flex-direction: column; gap: 8px; }
    .login__field { width: 100%; }
    .login__forgot { align-self: flex-end; font-size: 0.875rem; color: #2563eb; text-decoration: none; margin: 4px 0 12px; }
    .login__forgot:hover { text-decoration: underline; }
    .login__error { color: #dc2626; font-size: 0.875rem; margin-bottom: 8px; }
    .login__submit { height: 48px; font-weight: 600; }
    .login__spinner { display: inline-block; margin: 0 auto; }
    .login__divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; color: #9ca3af; font-size: 0.85rem; }
    .login__divider::before,
    .login__divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .login__social { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .login__social button { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .login__footer { text-align: center; margin-top: 24px; color: #6b7280; }
    .login__footer a { color: #2563eb; text-decoration: none; font-weight: 500; }
    .login__footer a:hover { text-decoration: underline; }
    @media (min-width: 960px) {
      .login__brand { display: flex; }
    }
  `,
})
export class Login {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  protected readonly AuthProvider = AuthProvider;

  protected showPassword = false;
  protected loading = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.value;
      await this.auth.loginWithPassword(email!, password!);
      await this.router.navigate(['/dashboard']);
    } catch (e) {
      this.error.set('Credenciales inválidas. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}
