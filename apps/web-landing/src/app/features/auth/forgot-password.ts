import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'vexa-forgot-password',
  imports: [ReactiveFormsModule, AuthShell, RouterLink],
  template: `
    <vexa-auth-shell>
      <form class="af" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="af__head">
          <h2 class="af__title">Reset your password</h2>
          <p class="af__subtitle">Enter your registered email address and we'll send you a secure link to configure a new password.</p>
        </div>

        <div class="af__fields">
          <div class="af__field">
            <label class="af__label" for="forgot-email">Email Address</label>
            <div class="af__control" [class.is-invalid]="invalid()">
              <input id="forgot-email" class="af__input" type="email" formControlName="email" autocomplete="email" placeholder="sarah@example.com" />
            </div>
            @if (invalid()) { <span class="af__hint">Enter a valid email address</span> }
          </div>

          @if (error()) { <div class="af__alert af__alert--error">{{ error() }}</div> }

          <button type="submit" class="af__btn" [disabled]="loading()">
            @if (loading()) { <span class="af__spinner"></span> } @else { Send Reset Link }
          </button>
        </div>

        <a class="back" routerLink="/auth/login">
          <img src="/auth/arrow-left.svg" alt="" />
          <span>Back to sign in</span>
        </a>
      </form>
    </vexa-auth-shell>
  `,
  styles: `
    :host { display: block; }
    .back { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; text-decoration: none; font-size: 14px; font-weight: 600; color: #2563eb; line-height: normal; white-space: nowrap; }
    .back:hover { text-decoration: underline; }
    .back img { width: 16px; height: 16px; display: block; }
  `,
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected invalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && (c.touched || c.dirty);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const email = this.form.getRawValue().email.trim();
    try {
      await this.auth.forgotPassword(email);
      await this.router.navigate(['/auth/verify-email'], { queryParams: { email, purpose: 'reset' } });
    } catch {
      this.error.set('We could not process your request. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
