import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'vexa-login',
  imports: [ReactiveFormsModule, AuthShell, RouterLink],
  template: `
    <vexa-auth-shell>
      <form class="af" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="af__head">
          <h2 class="af__title">Welcome back</h2>
          <p class="af__subtitle">Enter your credentials below to access Vexa</p>
        </div>

        <div class="af__fields">
          <div class="af__field">
            <label class="af__label" for="login-email">Email Address</label>
            <div class="af__control" [class.is-invalid]="invalid('email')">
              <input id="login-email" class="af__input" type="email" formControlName="email" autocomplete="email" placeholder="you@company.com" />
            </div>
            @if (invalid('email')) {
              <span class="af__hint">Enter a valid email address</span>
            }
          </div>

          <div class="af__field">
            <label class="af__label" for="login-password">Password</label>
            <div class="af__control" [class.is-invalid]="invalid('password')">
              <input
                id="login-password"
                class="af__input"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Enter your password"
              />
              <button type="button" class="af__toggle" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
            @if (invalid('password')) {
              <span class="af__hint">Password is required</span>
            }
          </div>

          <div class="af__row">
            <label class="af__check">
              <input type="checkbox" formControlName="remember" />
              <span class="af__box"><img src="/auth/check-circle.svg" alt="" /></span>
              <span>Remember me</span>
            </label>
            <a class="af__link" routerLink="/auth/forgot-password">Forgot password?</a>
          </div>

          @if (error()) {
            <div class="af__alert af__alert--error">{{ error() }}</div>
          }
          @if (resetDone()) {
            <div class="af__alert af__alert--success">Your password was updated. Sign in with your new password.</div>
          }

          <button type="submit" class="af__btn" [disabled]="loading()">
            @if (loading()) { <span class="af__spinner"></span> } @else { Sign In }
          </button>
        </div>

        <div class="social">
          <p class="social__label">or continue with</p>
          <div class="social__row">
            <a class="social__btn" [href]="oauth('google')">
              <img src="/auth/google.svg" alt="" />
              <span>Google</span>
            </a>
            <a class="social__btn" [href]="oauth('apple')">
              <img src="/auth/apple.svg" alt="" />
              <span>Apple</span>
            </a>
          </div>
        </div>

        <p class="af__footer">Don't have an account? <a routerLink="/auth/register">Sign up</a></p>
      </form>
    </vexa-auth-shell>
  `,
  styles: `
    :host { display: block; }
    .social { display: flex; flex-direction: column; gap: 16px; align-items: center; width: 100%; }
    .social__label { margin: 0; font-size: 12px; font-weight: 400; color: #9ca3af; line-height: normal; white-space: nowrap; }
    .social__row { display: flex; gap: 12px; align-items: flex-start; width: 100%; }
    .social__btn { flex: 1 0 0; min-width: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; text-decoration: none; font-size: 14px; font-weight: 600; color: #1f2937; line-height: normal; white-space: nowrap; }
    .social__btn:hover { background: #f9fafb; }
    .social__btn img { width: 16px; height: 16px; display: block; }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly resetDone = signal(this.route.snapshot.queryParamMap.get('reset') === '1');
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true],
  });

  protected invalid(name: 'email' | 'password'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected oauth(provider: 'google' | 'apple'): string {
    return `${environment.apiUrl}/auth/${provider}?client=company`;
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    try {
      const { user, tokens } = await this.auth.login(email, password);
      this.auth.persistSession(user, tokens);
      await this.router.navigateByUrl(this.auth.roleToPath(user.role));
    } catch (e) {
      const err = e as HttpErrorResponse;
      if (err.status === 403 && err.error?.message === 'EMAIL_NOT_VERIFIED') {
        await this.router.navigate(['/auth/verify-email'], { queryParams: { email, purpose: 'verify' } });
        return;
      }
      this.error.set(err.status === 401 ? 'Invalid email or password.' : 'We could not sign you in. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
