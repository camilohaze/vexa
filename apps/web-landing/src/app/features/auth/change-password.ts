import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: 'Minimum 8 characters', test: (v) => v.length >= 8 },
  { label: 'At least one uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'At least one number', test: (v) => /\d/.test(v) },
  { label: 'At least one special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const a = group.get('password')?.value;
  const b = group.get('confirm')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'vexa-change-password',
  imports: [ReactiveFormsModule, AuthShell],
  template: `
    <vexa-auth-shell
      subtitle="Keep your credentials secure. We recommend changing your password regularly to protect your freight manifests, dispatch logs, and carrier accounts."
      [bullets]="['End-to-end security compliance', 'Automatic session recovery block']"
    >
      <form class="af" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="af__head">
          <h2 class="af__title">Change Password</h2>
          <p class="af__subtitle">Update your account password to ensure your security</p>
        </div>

        <div class="af__fields">
          <div class="af__field">
            <label class="af__label" for="cp-new">New Password</label>
            <div class="af__control af__control--r16" [class.is-invalid]="invalid('password')">
              <input id="cp-new" class="af__input" [type]="showNew() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="Enter new password" />
              <button type="button" class="af__toggle af__toggle--13" (click)="showNew.set(!showNew())">{{ showNew() ? 'Hide' : 'Show' }}</button>
            </div>
          </div>

          <div class="strength">
            <div class="strength__bars">
              @for (i of [0, 1, 2]; track i) {
                <span class="strength__bar" [class]="'strength__bar ' + barClass(i)"></span>
              }
            </div>
            <p class="strength__label" [class]="'strength__label ' + labelClass()">{{ strengthLabel() }}</p>
          </div>

          <ul class="rules">
            @for (rule of rules; track rule.label) {
              <li class="rules__item" [class.rules__item--met]="met()[$index]">
                <span class="rules__icon"><img src="/auth/check-green.svg" alt="" /></span>
                <span>{{ rule.label }}</span>
              </li>
            }
          </ul>

          <div class="af__field">
            <label class="af__label" for="cp-confirm">Confirm New Password</label>
            <div class="af__control af__control--r16" [class.is-invalid]="mismatch()">
              <input id="cp-confirm" class="af__input" [type]="showConfirm() ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password" placeholder="Re-enter new password" />
              <button type="button" class="af__toggle af__toggle--13" (click)="showConfirm.set(!showConfirm())">{{ showConfirm() ? 'Hide' : 'Show' }}</button>
            </div>
            @if (mismatch()) { <span class="af__hint">Passwords do not match</span> }
          </div>
        </div>

        <div class="actions">
          @if (error()) { <div class="af__alert af__alert--error">{{ error() }}</div> }
          <button type="submit" class="af__btn af__btn--r16" [disabled]="loading()">
            @if (loading()) { <span class="af__spinner"></span> } @else { Update Password }
          </button>
          <button type="button" class="af__btn af__btn--r16 af__btn--ghost" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </vexa-auth-shell>
  `,
  styles: `
    :host { display: block; }
    .strength { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .strength__bars { display: flex; gap: 4px; width: 100%; }
    .strength__bar { flex: 1 0 0; min-width: 1px; height: 4px; border-radius: 2px; background: #e5e7eb; }
    .strength__bar--weak { background: #ef4444; }
    .strength__bar--medium { background: #f59e0b; }
    .strength__bar--strong { background: #10b981; }
    .strength__label { margin: 0; font-size: 12px; font-weight: 600; color: #9ca3af; line-height: normal; white-space: nowrap; }
    .strength__label--weak { color: #ef4444; }
    .strength__label--medium { color: #f59e0b; }
    .strength__label--strong { color: #10b981; }
    .rules { display: flex; flex-direction: column; gap: 10px; width: 100%; margin: 0; padding: 2px 0; list-style: none; }
    .rules__item { display: flex; align-items: center; gap: 8px; width: 100%; font-size: 13px; font-weight: 400; color: #9ca3af; line-height: normal; }
    .rules__item--met { color: #1f2937; }
    .rules__icon { width: 16px; height: 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #f3f4f6; }
    .rules__icon img { width: 10px; height: 10px; display: block; opacity: 0.35; }
    .rules__item--met .rules__icon { background: rgba(16, 185, 129, 0.08); }
    .rules__item--met .rules__icon img { opacity: 1; }
    .actions { display: flex; flex-direction: column; gap: 12px; width: 100%; padding-top: 10px; }
  `,
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
  private readonly code = this.route.snapshot.queryParamMap.get('code') ?? '';

  protected readonly rules = RULES;
  protected readonly showNew = signal(false);
  protected readonly showConfirm = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });
  protected readonly met = computed(() => RULES.map((r) => r.test(this.password())));
  protected readonly score = computed(() => this.met().filter(Boolean).length);
  protected readonly strengthLabel = computed(() => {
    if (!this.password()) return 'Enter a password';
    const s = this.score();
    return s <= 1 ? 'Weak password' : s <= 3 ? 'Medium password' : 'Strong password';
  });

  constructor() {
    if (!this.email || !/^\d{6}$/.test(this.code)) void this.router.navigate(['/auth/forgot-password']);
  }

  protected invalid(name: 'password' | 'confirm'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected mismatch(): boolean {
    const c = this.form.controls.confirm;
    return this.form.hasError('mismatch') && (c.touched || c.dirty);
  }

  protected barClass(i: number): string {
    const s = this.score();
    if (!this.password() || s === 0) return '';
    const level = s <= 1 ? 1 : s <= 3 ? 2 : 3;
    if (i >= level) return '';
    return level === 1 ? 'strength__bar--weak' : level === 2 ? 'strength__bar--medium' : 'strength__bar--strong';
  }

  protected labelClass(): string {
    if (!this.password()) return '';
    const s = this.score();
    return s <= 1 ? 'strength__label--weak' : s <= 3 ? 'strength__label--medium' : 'strength__label--strong';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.score() < 4 || this.loading()) {
      if (this.score() < 4) this.error.set('Your password must meet all the requirements above.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.resetPassword(this.email, this.code, this.form.getRawValue().password);
      await this.router.navigate(['/auth/login'], { queryParams: { reset: '1' } });
    } catch (e) {
      const err = e as HttpErrorResponse;
      this.error.set(err.status === 400 ? 'The verification code is invalid or expired. Request a new one.' : 'We could not update your password. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/auth/login']);
  }
}
