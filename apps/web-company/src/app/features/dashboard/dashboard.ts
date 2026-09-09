import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Map as VexaMap, MapMarker } from '@vexa/maps';
import { CourierLocationEvent, Job, JobStatus, SocketEvents } from '@vexa/shared';
import { PageHeader, StatCard, StatusChip } from '@vexa/ui';
import { Subscription } from 'rxjs';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { JobsService } from '../jobs/jobs.service';

@Component({
  selector: 'vexa-dashboard',
  imports: [MatCardModule, MatIconModule, PageHeader, RouterLink, StatCard, StatusChip, VexaMap],
  template: `
    <vexa-page-header title="Panel" subtitle="Gestiona tus despachos y el seguimiento de rutas" />

    <section class="kpis">
      @for (kpi of kpis(); track kpi.label) {
        <vexa-stat-card [label]="kpi.label" [value]="kpi.value" [icon]="kpi.icon" />
      }
    </section>

    <h2 class="vexa-overline section-title">Acciones rápidas</h2>
    <section class="quick">
      @for (a of actions; track a.route) {
        <a [routerLink]="a.route" class="quick__card vexa-card">
          <mat-icon>{{ a.icon }}</mat-icon>
          <span>{{ a.label }}</span>
        </a>
      }
    </section>

    <div class="dashboard__grid">
      <mat-card>
        <mat-card-header><mat-card-title>Repartidores activos</mat-card-title></mat-card-header>
        <mat-card-content>
          <vexa-map [markers]="courierMarkers()" />
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-header><mat-card-title>Pedidos recientes</mat-card-title></mat-card-header>
        <mat-card-content>
          @for (job of recentJobs(); track job.id) {
            <div class="job-row">
              <span class="job-row__id">#{{ job.id.slice(0, 8) }}</span>
              <span class="job-row__route">{{ job.pickup.line1 }} → {{ job.dropoff.line1 }}</span>
              <vexa-status-chip [status]="job.status" />
            </div>
          } @empty {
            <p>Sin pedidos todavía.</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .section-title { margin: 0 0 10px; }
    .quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .quick__card {
      display: flex; align-items: center; gap: 12px; padding: 18px;
      text-decoration: none; color: var(--vexa-gray-800); font-weight: 600; font-size: 14px;
      mat-icon { color: var(--vexa-primary-600); }
    }
    @media (max-width: 640px) { .quick { grid-template-columns: 1fr; } }
    .dashboard__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 960px) { .dashboard__grid { grid-template-columns: 1fr; } }
    .job-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .job-row__route { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly jobs = inject(JobsService);
  private readonly realtime = inject(RealtimeService);
  private readonly subs = new Subscription();

  protected readonly all = signal<Job[]>([]);
  protected readonly courierLocations = signal(new Map<string, CourierLocationEvent>());

  protected readonly recentJobs = computed(() => this.all().slice(0, 8));
  protected readonly courierMarkers = computed<MapMarker[]>(() =>
    [...this.courierLocations().values()].map((loc) => ({
      id: loc.courierId,
      lat: loc.lat,
      lng: loc.lng,
      label: `Repartidor ${loc.courierId.slice(0, 8)}`,
    }))
  );

  protected readonly actions = [
    { icon: 'add_circle', label: 'Nuevo pedido', route: '/jobs/new' },
    { icon: 'explore', label: 'Seguimiento', route: '/jobs' },
    { icon: 'account_balance_wallet', label: 'Billetera', route: '/wallet' },
  ];

  protected readonly kpis = computed(() => {
    const jobs = this.all();
    const count = (status: JobStatus) => jobs.filter((j) => j.status === status).length;
    const active =
      count(JobStatus.IN_TRANSIT) + count(JobStatus.PICKED_UP) +
      count(JobStatus.ACCEPTED) + count(JobStatus.OFFERED);
    return [
      { label: 'Activos', value: active, icon: 'local_shipping' },
      { label: 'Completados', value: count(JobStatus.DELIVERED), icon: 'task_alt' },
      { label: 'Pendientes', value: count(JobStatus.PENDING), icon: 'schedule' },
      { label: 'Repartidores en línea', value: this.courierLocations().size, icon: 'pedal_bike' },
    ];
  });

  constructor() {
    this.jobs.list({ pageSize: 50 }).subscribe((page) => this.all.set(page.items));
    this.subs.add(
      this.realtime.on(SocketEvents.COURIER_LOCATION).subscribe((loc) => {
        this.courierLocations.update((map) => {
          const next = new Map(map);
          next.set(loc.courierId, loc);
          return next;
        });
      })
    );
  }
}
