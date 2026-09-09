import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Map as VexaMap, MapMarker } from '@vexa/maps';
import { Job, JobStatus, SocketEvents } from '@vexa/shared';
import { PageHeader, StatusChip, Timeline, TimelineStep } from '@vexa/ui';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { JobsService } from './jobs.service';

@Component({
  selector: 'vexa-job-tracking',
  imports: [DecimalPipe, MatCardModule, MatIconModule, PageHeader, StatusChip, Timeline, VexaMap],
  template: `
    <vexa-page-header [title]="'Pedido #' + id().slice(0, 8)">
      <vexa-status-chip actions [status]="job()?.status ?? JobStatus.PENDING" />
    </vexa-page-header>

    <div class="tracking">
      <mat-card class="tracking__map">
        <mat-card-content>
          <vexa-map [markers]="markers()" [center]="center()" />
        </mat-card-content>
      </mat-card>
      <div class="tracking__side">
        <mat-card>
          <mat-card-header><mat-card-title>Línea de tiempo</mat-card-title></mat-card-header>
          <mat-card-content>
            <vexa-timeline [steps]="timeline()" />
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Detalle del paquete</mat-card-title></mat-card-header>
          <mat-card-content>
            @if (job(); as j) {
              <p><mat-icon>trip_origin</mat-icon> {{ j.pickup.line1 }}, {{ j.pickup.city }}</p>
              <p><mat-icon>location_on</mat-icon> {{ j.dropoff.line1 }}, {{ j.dropoff.city }}</p>
              <p><mat-icon>payments</mat-icon> {{ j.price | number:'1.0-0':'es-CO' }} COP</p>
              @if (j.distanceMeters) {
                <p><mat-icon>route</mat-icon> {{ j.distanceMeters / 1000 | number:'1.1-1' }} km</p>
              }
              @if (j.notes) { <p><mat-icon>notes</mat-icon> {{ j.notes }}</p> }
              @if (courierAt(); as loc) {
                <p><mat-icon>pedal_bike</mat-icon> Repartidor a
                  {{ loc.lat | number:'1.4-4' }}, {{ loc.lng | number:'1.4-4' }}</p>
              }
            } @else {
              <p>Cargando…</p>
            }
          </mat-card-content>
        </mat-card>

        @if (job()?.status === 'DELIVERED') {
          <mat-card>
            <mat-card-header><mat-card-title>Prueba de entrega</mat-card-title></mat-card-header>
            <mat-card-content>
              @if (job()?.proofOfDeliveryUrl; as pod) {
                <img class="pod" [src]="pod" alt="Prueba de entrega" />
              } @else {
                <p class="muted">Sin evidencia cargada.</p>
              }
            </mat-card-content>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Desglose de facturación</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="cost"><span>Tarifa base</span><span>{{ (job()?.price ?? 0) * 0.7 | number:'1.0-0':'es-CO' }} COP</span></div>
              <div class="cost"><span>Recargo por distancia</span><span>{{ (job()?.price ?? 0) * 0.2 | number:'1.0-0':'es-CO' }} COP</span></div>
              <div class="cost"><span>Ajuste</span><span>{{ (job()?.price ?? 0) * 0.1 | number:'1.0-0':'es-CO' }} COP</span></div>
              <div class="cost cost--total"><span>Total</span><span>{{ job()?.price | number:'1.0-0':'es-CO' }} COP</span></div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: `
    .tracking { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
    .tracking__side { display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 960px) { .tracking { grid-template-columns: 1fr; } }
    p { display: flex; align-items: center; gap: 8px; }
    .muted { color: var(--vexa-gray-500); }
    .pod { width: 100%; border-radius: 12px; }
    .cost { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .cost--total { font-weight: 700; border-top: 1px solid var(--vexa-gray-200); margin-top: 8px; padding-top: 10px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobTracking implements OnInit {
  readonly id = input.required<string>();
  protected readonly JobStatus = JobStatus;

  protected readonly job = signal<Job | null>(null);
  protected readonly courierAt = signal<{ lat: number; lng: number } | null>(null);

  private readonly jobs = inject(JobsService);
  private readonly realtime = inject(RealtimeService);

  protected readonly center = computed(() => this.courierAt() ?? this.job()?.pickup ?? { lat: 4.711, lng: -74.0721 });
  protected readonly markers = computed<MapMarker[]>(() => {
    const job = this.job();
    const courier = this.courierAt();
    if (!job) return [];
    const markers: MapMarker[] = [
      { id: 'pickup', lat: job.pickup.lat, lng: job.pickup.lng, label: 'Recogida', color: '#1b5e20' },
      { id: 'dropoff', lat: job.dropoff.lat, lng: job.dropoff.lng, label: 'Entrega', color: '#9c1b1b' },
    ];
    if (courier) markers.push({ id: 'courier', ...courier, label: 'Repartidor', color: '#0b4f9e' });
    return markers;
  });

  protected readonly timeline = computed<TimelineStep[]>(() => {
    const j = this.job();
    if (!j) return [];
    const order = [
      JobStatus.ACCEPTED,
      JobStatus.PICKED_UP,
      JobStatus.IN_TRANSIT,
      JobStatus.DELIVERED,
    ];
    const idx = order.indexOf(j.status);
    const labels = ['Aceptado', 'Recogido', 'En tránsito', 'Entregado'];
    const times = [j.acceptedAt, null, null, j.completedAt];
    return labels.map((label, i) => ({
      title: label,
      state: (j.status === JobStatus.CANCELLED || j.status === JobStatus.DELIVERED || i < idx
          ? 'done'
          : i === idx
            ? 'active'
            : 'pending') as TimelineStep['state'],
      timestamp: times[i] ? new Date(times[i] as string).toLocaleString('es-CO') : undefined,
    }));
  });

  ngOnInit() {
    this.jobs.getById(this.id()).subscribe((job) => this.job.set(job));
    this.realtime.subscribeToJob(this.id());
    this.realtime
      .on(SocketEvents.COURIER_LOCATION)
      .subscribe((loc) => {
        if (loc.jobId === this.id()) this.courierAt.set({ lat: loc.lat, lng: loc.lng });
      });
    this.realtime.on(SocketEvents.JOB_ACCEPTED).subscribe(() => this.refresh());
    this.realtime.on(SocketEvents.JOB_COMPLETED).subscribe(() => this.refresh());
    this.realtime.on(SocketEvents.JOB_CANCELLED).subscribe(() => this.refresh());
  }

  private refresh() {
    this.jobs.getById(this.id()).subscribe((job) => this.job.set(job));
  }
}
