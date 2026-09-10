import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobStatus } from '@vexa/shared';
import { JobsService } from './jobs.service';

const PRIORITY: JobStatus[] = [
  JobStatus.IN_TRANSIT,
  JobStatus.PICKED_UP,
  JobStatus.ACCEPTED,
  JobStatus.OFFERED,
  JobStatus.PENDING,
];

/** Figma: web-delivery-tracking — resuelve el envío activo más relevante y reusa la vista de seguimiento por pedido. */
@Component({
  selector: 'vexa-tracking-overview',
  imports: [],
  template: `
    @if (empty()) {
      <div class="vexa-card empty">
        <p>No tienes envíos activos para seguir en este momento.</p>
      </div>
    }
  `,
  styles: `.empty { color: var(--vexa-gray-500); text-align: center; padding: 48px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingOverview {
  private readonly jobs = inject(JobsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly empty = signal(false);

  constructor() {
    this.jobs.list({ pageSize: 50 }).subscribe((page) => {
      const active = PRIORITY.map((status) => page.items.find((j) => j.status === status)).find(Boolean);
      if (active) {
        this.router.navigate(['..', 'jobs', active.id], { relativeTo: this.route, replaceUrl: true });
      } else {
        this.empty.set(true);
      }
    });
  }
}
