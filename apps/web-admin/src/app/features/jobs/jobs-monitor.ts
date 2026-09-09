import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Map as VexaMap, MapMarker } from '@vexa/maps';
import { CourierLocationEvent, Job, JobStatus, Paginated, SocketEvents } from '@vexa/shared';
import { PageHeader, StatusChip } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';
import { RealtimeService } from '../../core/realtime/realtime.service';

/** Figma: delivery-monitoring — "Live Dispatch Monitor": despachos activos,
 * mapa en vivo y detalle del pedido con timeline. */
@Component({
  selector: 'vexa-jobs-monitor',
  imports: [DatePipe, MatCardModule, MatIconModule, PageHeader, StatusChip, VexaMap],
  template: `
    <vexa-page-header title="Monitor de despachos en vivo" subtitle="Tracking en tiempo real" />

    <div class="monitor">
      <mat-card class="list">
        <mat-card-header>
          <mat-card-title>Despachos activos</mat-card-title>
          <span class="vexa-pill vexa-pill--info">En tránsito ({{ activeJobs().length }})</span>
        </mat-card-header>
        <mat-card-content>
          @for (j of activeJobs(); track j.id) {
            <button type="button" class="dispatch" [class.dispatch--on]="selected()?.id === j.id"
                (click)="selected.set(j)">
              <div class="dispatch__head">
                <strong>VX-{{ j.id.slice(0, 6).toUpperCase() }} · {{ j.notes || 'Carga' }}</strong>
                <vexa-status-chip [status]="j.status" />
              </div>
              <small>{{ j.pickup.line1 }} → {{ j.dropoff.line1 }}</small>
              <small class="muted">Repartidor: {{ j.courierId ? 'ID #' + j.courierId.slice(0, 6) : 'Sin asignar' }}</small>
            </button>
          } @empty {
            <p class="muted">No hay despachos activos.</p>
          }
        </mat-card-content>
      </mat-card>

      <div class="right">
        <mat-card class="map-card">
          <vexa-map [markers]="markers()" />
        </mat-card>
        @if (selected(); as j) {
          <mat-card class="detail">
            <mat-card-header>
              <mat-card-title>Pedido activo #VX-{{ j.id.slice(0, 6).toUpperCase() }}</mat-card-title>
              <button class="flag">Marcar para intervención</button>
            </mat-card-header>
            <mat-card-content>
              <p>Empresa #{{ j.companyId.slice(0, 6) }} · gestionado por repartidor
                {{ j.courierId ? '#' + j.courierId.slice(0, 6) : '—' }}</p>
              <ul class="tl">
                <li [class.on]="!!j.acceptedAt"><mat-icon>check_circle</mat-icon> Recogida {{ j.acceptedAt ? ('· ' + (j.acceptedAt | date:'shortTime')) : 'pendiente' }}</li>
                <li [class.on]="j.status === JobStatus.IN_TRANSIT || j.status === JobStatus.DELIVERED"><mat-icon>local_shipping</mat-icon> En tránsito</li>
                <li [class.on]="j.status === JobStatus.DELIVERED"><mat-icon>flag</mat-icon> Entrega {{ j.completedAt ? ('· ' + (j.completedAt | date:'shortTime')) : 'estimada' }}</li>
              </ul>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .monitor { display: grid; grid-template-columns: 380px 1fr; gap: 16px; align-items: start; }
    @media (max-width: 1100px) { .monitor { grid-template-columns: 1fr; } }
    .dispatch {
      display: block; width: 100%; text-align: left; padding: 12px; margin-bottom: 8px;
      border: 1px solid var(--vexa-gray-200); border-radius: 12px; background: #fff;
      cursor: pointer; font: inherit;
      small { display: block; }
    }
    .dispatch--on { border-color: var(--vexa-primary-600); background: var(--vexa-primary-50); }
    .dispatch__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .right { display: flex; flex-direction: column; gap: 16px; }
    .map-card { height: 340px; overflow: hidden; }
    .map-card vexa-map { height: 100%; }
    .detail p { margin: 0 0 12px; font-size: 13px; color: var(--vexa-gray-600); }
    .flag { background: none; border: 0; color: var(--vexa-error-600); font-size: 12px; cursor: pointer; margin-left: auto; }
    .tl { list-style: none; margin: 0; padding: 0; }
    .tl li { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; color: var(--vexa-gray-400); }
    .tl li.on { color: var(--vexa-gray-800); font-weight: 600; }
    .tl li.on mat-icon { color: var(--vexa-success-500); }
    .tl mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .muted { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsMonitor {
  private readonly api = inject(ApiService);
  private readonly realtime = inject(RealtimeService);

  protected readonly JobStatus = JobStatus;
  protected readonly jobs = signal<Job[]>([]);
  protected readonly locations = signal(new Map<string, CourierLocationEvent>());
  protected readonly selected = signal<Job | null>(null);

  protected readonly activeJobs = computed(() =>
    this.jobs().filter((j) =>
      [JobStatus.ACCEPTED, JobStatus.PICKED_UP, JobStatus.IN_TRANSIT].includes(j.status),
    ),
  );

  protected readonly markers = computed<MapMarker[]>(() =>
    [...this.locations().values()].map((loc) => ({
      id: loc.courierId,
      lat: loc.lat,
      lng: loc.lng,
      label: `Repartidor ${loc.courierId.slice(0, 8)}`,
    })),
  );

  constructor() {
    this.api.get<Paginated<Job>>('jobs', { pageSize: 50 }).subscribe((p) => this.jobs.set(p.items));
    this.realtime.on(SocketEvents.COURIER_LOCATION).subscribe((loc) =>
      this.locations.update((m) => new Map(m).set(loc.courierId, loc)),
    );
    this.realtime.on(SocketEvents.JOB_ACCEPTED).subscribe((e) => this.patchStatus(e.jobId, JobStatus.ACCEPTED));
    this.realtime.on(SocketEvents.JOB_CANCELLED).subscribe((e) => this.patchStatus(e.jobId, JobStatus.CANCELLED));
    this.realtime.on(SocketEvents.JOB_COMPLETED).subscribe((e) => this.patchStatus(e.jobId, JobStatus.DELIVERED));
    this.realtime.on(SocketEvents.NEW_JOB).subscribe((e) => this.jobs.update((j) => [e.job, ...j]));
  }

  private patchStatus(jobId: string, status: Job['status']) {
    this.jobs.update((jobs) => jobs.map((j) => (j.id === jobId ? { ...j, status } : j)));
    const sel = this.selected();
    if (sel?.id === jobId) this.selected.set({ ...sel, status });
  }
}
