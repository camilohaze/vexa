import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserRole } from '@vexa/shared';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

type RegisterRole = UserRole.COMPANY | UserRole.COURIER;

@Component({
  selector: 'vexa-register',
  imports: [ReactiveFormsModule, AuthShell, RouterLink],
  template: `
    <vexa-auth-shell>
      <form class="af af--tight" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="af__head">
          <h2 class="af__title">Create your account</h2>
          <p class="af__subtitle">Join Vexa logistics network in minutes.</p>
        </div>

        <div class="tabs" role="tablist">
          <button type="button" role="tab" class="tabs__tab" [class.tabs__tab--active]="role() === Role.COMPANY" [attr.aria-selected]="role() === Role.COMPANY" (click)="role.set(Role.COMPANY)">Company</button>
          <button type="button" role="tab" class="tabs__tab" [class.tabs__tab--active]="role() === Role.COURIER" [attr.aria-selected]="role() === Role.COURIER" (click)="role.set(Role.COURIER)">Courier</button>
        </div>

        <div class="af__fields af__fields--16">
          <div class="af__field">
            <label class="af__label" for="reg-name">Full Name</label>
            <div class="af__control" [class.is-invalid]="invalid('fullName')">
              <input id="reg-name" class="af__input" type="text" formControlName="fullName" autocomplete="name" placeholder="Sarah Jenkins" />
            </div>
            @if (invalid('fullName')) { <span class="af__hint">Enter your full name</span> }
          </div>

          <div class="af__field">
            <label class="af__label" for="reg-email">Email Address</label>
            <div class="af__control" [class.is-invalid]="invalid('email')">
              <input id="reg-email" class="af__input" type="email" formControlName="email" autocomplete="email" placeholder="sarah@example.com" />
            </div>
            @if (invalid('email')) { <span class="af__hint">Enter a valid email address</span> }
          </div>

          <div class="af__field">
            <label class="af__label" for="reg-phone">Phone Number</label>
            <div class="af__control" [class.is-invalid]="invalid('phone')">
              <input id="reg-phone" class="af__input" type="tel" formControlName="phone" autocomplete="tel" placeholder="+1 (555) 000-0000" />
            </div>
            @if (invalid('phone')) { <span class="af__hint">Enter a valid phone number</span> }
          </div>

          <div class="af__field">
            <label class="af__label" for="reg-password">Password</label>
            <div class="af__control" [class.is-invalid]="invalid('password')">
              <input
                id="reg-password"
                class="af__input"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="new-password"
                placeholder="Create a secure password"
              />
              <button type="button" class="af__toggle" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? 'Hide' : 'Show' }}
              </button>
            </div>
            @if (invalid('password')) { <span class="af__hint">At least 8 characters with letters and digits</span> }
          </div>

          <label class="af__check af__check--top">
            <input type="checkbox" formControlName="acceptTerms" />
            <span class="af__box"><img src="/auth/check-circle.svg" alt="" /></span>
            <span>I agree to the <a class="terms" routerLink="/resources" fragment="terms-of-service">Terms of Service</a> and <a class="terms" routerLink="/resources" fragment="privacy-policy">Privacy Policy</a>.</span>
          </label>
          @if (invalid('acceptTerms')) { <span class="af__hint">You must accept the terms to continue</span> }

          @if (error()) { <div class="af__alert af__alert--error">{{ error() }}</div> }

          <button type="submit" class="af__btn" [disabled]="loading()">
            @if (loading()) { <span class="af__spinner"></span> } @else { Create Account }
          </button>
        </div>

        <p class="af__footer">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
      </form>
    </vexa-auth-shell>
  `,
  styles: `
    :host { display: block; }
    .tabs { display: flex; gap: 4px; align-items: flex-start; width: 100%; padding: 4px; border-radius: 8px; background: #f9fafb; box-sizing: border-box; }
    .tabs__tab { flex: 1 0 0; min-width: 1px; display: flex; align-items: center; justify-content: center; padding: 8px 16px; border: 0; border-radius: 6px; background: transparent; font-family: inherit; font-size: 13px; font-weight: 500; color: #4b5563; line-height: normal; white-space: nowrap; cursor: pointer; }
    .tabs__tab--active { background: #fff; color: #1f2937; font-weight: 600; box-shadow: 0 2px 2px rgba(31, 41, 55, 0.04); }
    .terms { color: #2563eb; font-weight: 600; text-decoration: none; }
    .terms:hover { text-decoration: underline; }
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly Role = UserRole;
  protected readonly role = signal<RegisterRole>(UserRole.COMPANY);
  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s().-]{7,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*[A-Za-z])(?=.*\d)/)]],
    acceptTerms: [false, [Validators.requiredTrue]],
  });

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const { fullName, email, phone, password, acceptTerms } = this.form.getRawValue();
    try {
      await this.auth.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/[\s().-]/g, ''),
        password,
        role: this.role(),
        acceptTerms,
      });
      await this.router.navigate(['/auth/verify-email'], { queryParams: { email: email.trim(), purpose: 'verify' } });
    } catch (e) {
      const err = e as HttpErrorResponse;
      const msg = err.error?.message;
      this.error.set(
        err.status === 409
          ? 'An account with this email already exists.'
          : Array.isArray(msg) ? msg.join(' ') : typeof msg === 'string' ? msg : 'We could not create your account. Please try again.'
      );
    } finally {
      this.loading.set(false);
    }
  }
}
