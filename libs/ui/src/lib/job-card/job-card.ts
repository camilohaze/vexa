import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Job } from '@vexa/shared';
import { StatusChip } from '../status-chip/status-chip';

@Component({
  selector: 'vexa-job-card',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, StatusChip],
  template: `
    <div class="job vexa-card">
      <header class="job__head">
        <span class="job__icon"><mat-icon>inventory_2</mat-icon></span>
        <span class="job__id">#{{ job().id.slice(0, 6).toUpperCase() }}</span>
        <vexa-status-chip [status]="job().status" />
      </header>
      <div class="job__route">
        <p><mat-icon class="dot dot--pickup">trip_origin</mat-icon> {{ job().pickup.line1 }}</p>
        <p><mat-icon class="dot dot--dropoff">location_on</mat-icon> {{ job().dropoff.line1 }}</p>
      </div>
      <footer class="job__foot">
        <div>
          <strong class="job__price">{{ job().price | number:'1.0-0' }} COP</strong>
          @if (job().distanceMeters; as dist) {
            <span class="job__meta">{{ dist / 1000 | number:'1.1-1' }} km</span>
          }
        </div>
        <ng-content select="[actions]" />
      </footer>
    </div>
  `,
  styles: `
    .job { display: flex; flex-direction: column; gap: 12px; }
    .job__head { display: flex; align-items: center; gap: 10px; }
    .job__id { font-weight: 600; font-size: 14px; color: var(--vexa-gray-800); }
    .job__icon {
      width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center;
      background: var(--vexa-primary-100); color: var(--vexa-primary-700);
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .job__route { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--vexa-gray-700); }
    .job__route p { margin: 0; display: flex; align-items: center; gap: 8px; }
    .dot { font-size: 16px; width: 16px; height: 16px; }
    .dot--pickup { color: var(--vexa-success-500); }
    .dot--dropoff { color: var(--vexa-error-500); }
    .job__foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .job__price { font-size: 16px; font-weight: 700; color: var(--vexa-gray-900); }
    .job__meta { margin-left: 8px; font-size: 12px; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobCard {
  readonly job = input.required<Job>();
  readonly selected = output<Job>();
}
