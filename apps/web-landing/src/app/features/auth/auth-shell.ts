import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'vexa-auth-shell',
  imports: [RouterLink],
  template: `
    <div class="auth">
      <aside class="panel">
        <a class="panel__logo" routerLink="/">
          <span class="panel__logo-mark"><img src="/auth/truck.svg" alt="" /></span>
          <span class="panel__logo-text">Vexa</span>
        </a>
        <div class="panel__copy">
          <h1 class="panel__title">{{ title() }}</h1>
          <p class="panel__text">{{ subtitle() }}</p>
        </div>
        <ul class="panel__list">
          @for (item of bullets(); track item) {
            <li>
              <span class="panel__check"><img src="/auth/check-white.svg" alt="" /></span>
              <span>{{ item }}</span>
            </li>
          }
        </ul>
      </aside>
      <main class="form-panel">
        <div class="form-panel__inner">
          <ng-content></ng-content>
        </div>
      </main>
    </div>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; }
    a { text-decoration: none; }
    h1, p { margin: 0; }
    ul { margin: 0; padding: 0; list-style: none; }

    .auth { display: flex; align-items: stretch; min-height: 100vh; background: #fff; }
    .panel { display: none; flex-direction: column; justify-content: space-between; align-items: flex-start; width: 540px; flex-shrink: 0; padding: 48px; background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%); }
    .panel__logo { display: flex; align-items: center; gap: 10px; }
    .panel__logo-mark { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%); border: 1px solid #fff; }
    .panel__logo-mark img { width: 18px; height: 18px; display: block; }
    .panel__logo-text { font-size: 22px; font-weight: 800; color: #fff; line-height: normal; white-space: nowrap; }
    .panel__copy { display: flex; flex-direction: column; gap: 24px; width: 100%; }
    .panel__title { font-size: 40px; font-weight: 800; color: #fff; line-height: 48px; }
    .panel__text { font-size: 16px; font-weight: 400; color: #dbeafe; line-height: 24px; }
    .panel__list { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .panel__list li { display: flex; align-items: center; gap: 12px; width: 100%; font-size: 14px; font-weight: 500; color: #fff; line-height: normal; }
    .panel__check { width: 24px; height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: rgba(255, 255, 255, 0.2); }
    .panel__check img { width: 14px; height: 14px; display: block; }
    .form-panel { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px; }
    .form-panel__inner { width: 400px; max-width: 100%; }
    @media (min-width: 960px) { .panel { display: flex; } }
    @media (max-width: 960px) { .form-panel { padding: 48px 24px; } }
  `,
})
export class AuthShell {
  readonly title = input('Logistics, Simplified.');
  readonly subtitle = input(
    'Empowering modern commerce with instant dispatching, reliable independent courier matches, and bulletproof tracking pipeline.'
  );
  readonly bullets = input<string[]>(['Real-time automated routing', 'Instant courier marketplace verification']);
}
