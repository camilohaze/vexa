import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthShell } from './auth-shell';
import { AuthService } from '../../core/auth/auth.service';

type Purpose = 'verify' | 'reset';
const RESEND_SECONDS = 59;

@Component({
  selector: 'vexa-verify-email',
  imports: [AuthShell],
  template: `
    <vexa-auth-shell>
      <form class="af" (submit)="$event.preventDefault(); submit()" novalidate>
        <div class="af__head">
          <h2 class="af__title">Verify your email</h2>
          <p class="af__subtitle">
            We sent a 6-digit confirmation code to <strong class="email">{{ email() }}</strong>.
            {{ purpose() === 'reset' ? 'Enter it below to continue resetting your password.' : 'Enter it below to secure your Vexa profile.' }}
          </p>
        </div>

        <div class="otp" (paste)="onPaste($event)">
          @for (d of digits(); track $index) {
            <input
              #cell
              class="otp__cell"
              [class.otp__cell--filled]="d !== ''"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="1"
              [value]="d"
              [attr.aria-label]="'Digit ' + ($index + 1)"
              (input)="onInput($event, $index)"
              (keydown)="onKeydown($event, $index)"
            />
          }
        </div>

        <div class="af__fields">
          @if (error()) { <div class="af__alert af__alert--error">{{ error() }}</div> }
          @if (info()) { <div class="af__alert af__alert--success">{{ info() }}</div> }

          <button type="submit" class="af__btn" [disabled]="!complete() || loading()">
            @if (loading()) { <span class="af__spinner"></span> } @else { Verify }
          </button>

          <div class="resend">
            <p class="resend__timer">
              @if (seconds() > 0) {
                Resend code in <strong>{{ timer() }}</strong>
              } @else {
                Didn't get the code?
              }
            </p>
            <button type="button" class="resend__btn" [disabled]="seconds() > 0 || resending()" (click)="resend()">Resend code</button>
          </div>
        </div>
      </form>
    </vexa-auth-shell>
  `,
  styles: `
    :host { display: block; }
    .email { font-weight: 600; color: #1f2937; }
    .otp { display: flex; gap: 12px; align-items: flex-start; justify-content: center; width: 100%; }
    .otp__cell { width: 52px; height: 56px; flex-shrink: 0; text-align: center; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; font-family: inherit; font-size: 20px; font-weight: 700; color: #1f2937; line-height: normal; outline: 0; box-sizing: border-box; }
    .otp__cell--filled, .otp__cell:focus { border: 2px solid #2563eb; }
    .resend { display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 13px; line-height: normal; white-space: nowrap; }
    .resend__timer { margin: 0; font-weight: 400; color: #4b5563; }
    .resend__timer strong { font-weight: 600; color: #1f2937; }
    .resend__btn { border: 0; padding: 0; background: transparent; font-family: inherit; font-size: 13px; font-weight: 600; color: #2563eb; cursor: pointer; }
    .resend__btn:disabled { color: #9ca3af; cursor: default; }
    @media (max-width: 420px) { .otp { gap: 8px; } .otp__cell { width: 44px; height: 50px; } }
  `,
})
export class VerifyEmail {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>('cell');

  protected readonly email = signal(this.route.snapshot.queryParamMap.get('email')?.trim() ?? '');
  protected readonly purpose = signal<Purpose>(this.route.snapshot.queryParamMap.get('purpose') === 'reset' ? 'reset' : 'verify');
  protected readonly digits = signal<string[]>(Array(6).fill(''));
  protected readonly complete = computed(() => this.digits().every((d) => /^\d$/.test(d)));
  protected readonly loading = signal(false);
  protected readonly resending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  protected readonly seconds = signal(RESEND_SECONDS);
  protected readonly timer = computed(() => `0:${String(this.seconds()).padStart(2, '0')}`);

  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (!this.email()) {
      void this.router.navigate(['/auth/login']);
      return;
    }
    this.startTimer();
    this.destroyRef.onDestroy(() => this.stopTimer());
  }

  protected onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');
    if (value.length > 1) {
      this.fill(value, index);
      return;
    }
    this.setDigit(index, value);
    input.value = value;
    if (value && index < 5) this.focus(index + 1);
    this.error.set(null);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      this.setDigit(index - 1, '');
      this.focus(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focus(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focus(index + 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (!/\d/.test(text)) return;
    event.preventDefault();
    this.fill(text, 0);
  }

  async submit(): Promise<void> {
    if (!this.complete() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const code = this.digits().join('');
    try {
      if (this.purpose() === 'reset') {
        await this.router.navigate(['/auth/change-password'], { queryParams: { email: this.email(), code } });
        return;
      }
      const { user, tokens } = await this.auth.verifyEmail(this.email(), code);
      this.auth.persistSession(user, tokens);
      await this.router.navigateByUrl(this.auth.roleToPath(user.role));
    } catch (e) {
      const err = e as HttpErrorResponse;
      this.error.set(err.status === 400 ? 'Invalid or expired code. Please try again.' : 'Verification failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async resend(): Promise<void> {
    if (this.seconds() > 0 || this.resending()) return;
    this.resending.set(true);
    this.error.set(null);
    this.info.set(null);
    try {
      if (this.purpose() === 'reset') await this.auth.forgotPassword(this.email());
      else await this.auth.resendVerification(this.email());
      this.info.set('A new code has been sent to your email.');
      this.digits.set(Array(6).fill(''));
      this.focus(0);
      this.startTimer();
    } catch {
      this.error.set('We could not resend the code. Please try again.');
    } finally {
      this.resending.set(false);
    }
  }

  private fill(text: string, from: number): void {
    const chars = text.replace(/\D/g, '').split('');
    const next = [...this.digits()];
    let i = from;
    for (const ch of chars) {
      if (i > 5) break;
      next[i++] = ch;
    }
    this.digits.set(next);
    this.focus(Math.min(i, 5));
    this.error.set(null);
  }

  private setDigit(index: number, value: string): void {
    const next = [...this.digits()];
    next[index] = value;
    this.digits.set(next);
  }

  private focus(index: number): void {
    queueMicrotask(() => this.cells()[index]?.nativeElement.focus());
  }

  private startTimer(): void {
    this.stopTimer();
    this.seconds.set(RESEND_SECONDS);
    this.interval = setInterval(() => {
      if (this.seconds() <= 1) {
        this.seconds.set(0);
        this.stopTimer();
      } else {
        this.seconds.set(this.seconds() - 1);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }
}
