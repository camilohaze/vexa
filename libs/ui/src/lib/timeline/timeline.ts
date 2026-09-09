import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineStep {
  title: string;
  description?: string;
  timestamp?: string;
  state: 'done' | 'active' | 'pending';
  badge?: string;
}

@Component({
  selector: 'vexa-timeline',
  imports: [MatIconModule],
  template: `
    <ol class="tl">
      @for (step of steps(); track step.title; let last = $last) {
        <li class="tl__step" [class.tl__step--done]="step.state === 'done'"
            [class.tl__step--active]="step.state === 'active'">
          <div class="tl__marker">
            <div class="tl__dot">
              @if (step.state === 'done') { <mat-icon>check</mat-icon> }
              @else if (step.state === 'active') { <mat-icon>radio_button_checked</mat-icon> }
            </div>
            @if (!last) { <div class="tl__line"></div> }
          </div>
          <div class="tl__body">
            <div class="tl__title">
              <strong>{{ step.title }}</strong>
              @if (step.badge) { <span class="vexa-pill vexa-pill--info">{{ step.badge }}</span> }
            </div>
            @if (step.description) { <p class="tl__desc">{{ step.description }}</p> }
            @if (step.timestamp) { <p class="tl__time">{{ step.timestamp }}</p> }
          </div>
        </li>
      }
    </ol>
  `,
  styles: `
    .tl { list-style: none; margin: 0; padding: 0; }
    .tl__step { display: flex; gap: 12px; }
    .tl__marker { display: flex; flex-direction: column; align-items: center; width: 24px; }
    .tl__dot {
      width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
      background: var(--vexa-gray-200); color: var(--vexa-gray-400); flex: none;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .tl__step--done .tl__dot { background: var(--vexa-success-500); color: #fff; }
    .tl__step--active .tl__dot { background: var(--vexa-primary-600); color: #fff; }
    .tl__line { flex: 1; width: 2px; background: var(--vexa-gray-200); margin: 4px 0; }
    .tl__step--done .tl__line { background: var(--vexa-success-300); }
    .tl__body { padding-bottom: 20px; min-width: 0; }
    .tl__title { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--vexa-gray-900); }
    .tl__desc { margin: 4px 0 0; font-size: 12px; color: var(--vexa-gray-600); }
    .tl__time { margin: 4px 0 0; font-size: 11px; color: var(--vexa-gray-400); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Timeline {
  readonly steps = input.required<TimelineStep[]>();
}
