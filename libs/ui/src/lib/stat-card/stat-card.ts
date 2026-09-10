import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'vexa-stat-card',
  imports: [MatIconModule],
  template: `
    <div class="stat vexa-card">
      <div class="stat__main">
        <span class="vexa-overline">{{ label() }}</span>
        <span class="stat__value">{{ value() }}</span>
        @if (delta(); as d) {
          <span class="stat__delta" [class.stat__delta--neg]="d.startsWith('-')">
            {{ d }} <span class="stat__hint">{{ hint() }}</span>
          </span>
        }
      </div>
      @if (icon(); as i) {
        <div class="stat__icon" [class]="'stat__icon--' + tone()"><mat-icon>{{ i }}</mat-icon></div>
      }
    </div>
  `,
  styles: `
    .stat { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .stat__main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .stat__value { font-size: 30px; font-weight: 700; line-height: 1.15; color: var(--vexa-gray-900); }
    .stat__delta { font-size: 12px; font-weight: 600; color: var(--vexa-success-700); }
    .stat__delta--neg { color: var(--vexa-error-700); }
    .stat__hint { font-weight: 400; color: var(--vexa-gray-500); }
    .stat__icon {
      flex: none; width: 36px; height: 36px; border-radius: 8px;
      display: grid; place-items: center;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .stat__icon--primary { background: var(--vexa-primary-100); color: var(--vexa-primary-700); }
    .stat__icon--success { background: var(--vexa-success-100); color: var(--vexa-success-700); }
    .stat__icon--warning { background: var(--vexa-warning-100); color: var(--vexa-warning-700); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input<string>();
  readonly hint = input<string>();
  readonly icon = input<string>();
  readonly tone = input<'primary' | 'success' | 'warning'>('primary');
}
