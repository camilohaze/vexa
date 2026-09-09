import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LineChart, PageHeader } from '@vexa/ui';

import { ApiService } from '../../core/api/api.service';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { SocketEvents } from '@vexa/shared';

interface AdminStats {
  users: number;
  companies: number;
  couriers: number;
  jobs: number;
  activeDeliveries: number;
  delivered: number;
  revenue: number;
  disputesPending: number;
  volume: number[];
  revenueSeries: number[];
  health: { name: string; status: string; color: string }[];
}

/** Figma: admin-dashboard — KPIs con tendencia, volumen/ingresos,
 * salud de la plataforma y log de sistema en tiempo real. */
@Component({
  selector: 'vexa-admin-dashboard',
  imports: [LineChart, MatButtonModule, MatCardModule, MatIconModule, PageHeader],
  template: `
    <vexa-page-header title="Rendimiento del sistema" subtitle="Vista general de la plataforma">
      <div actions class="actions">
        <button mat-stroked-button><mat-icon>download</mat-icon> Exportar reportes</button>
        <button mat-flat-button><mat-icon>build</mat-icon> Desplegar hotfix</button>
      </div>
    </vexa-page-header>

    <section class="kpis">
      @for (kpi of kpis(); track kpi.label) {
        <div class="kpi vexa-card">
          <span class="kpi__label">{{ kpi.label }}</span>
          <div class="kpi__row">
            <strong class="kpi__value">{{ kpi.value }}</strong>
            <span class="trend" [class.trend--down]="kpi.down">
              <mat-icon>{{ kpi.down ? 'trending_down' : 'trending_up' }}</mat-icon>
              {{ kpi.trend }}
            </span>
          </div>
        </div>
      }
    </section>

    <div class="charts">
      <mat-card class="chart-card">
        <h3>Volumen de entregas (últimos 7 días)</h3>
        <vexa-line-chart [values]="volume()" />
      </mat-card>
      <mat-card class="chart-card">
        <h3>Línea de ingresos (7 días)</h3>
        <vexa-line-chart [values]="revenue()" color="#0e9f6e" />
      </mat-card>
    </div>

    <div class="bottom">
      <mat-card class="chart-card">
        <h3>Estado de la plataforma</h3>
        <ul class="health">
          @for (s of health(); track s.name) {
            <li>
              <span>{{ s.name }}</span>
              <span class="health__status" [style.color]="s.color">{{ s.status }}</span>
            </li>
          }
        </ul>
      </mat-card>
      <mat-card class="chart-card">
        <h3>Log del sistema en tiempo real</h3>
        <ul class="log">
          @for (e of log(); track $index) {
            <li><span class="log__dot"></span> {{ e }}</li>
          } @empty {
            <li class="muted">Sin eventos todavía…</li>
          }
        </ul>
      </mat-card>
    </div>
  `,
  styles: `
    .actions { display: flex; gap: 8px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { padding: 20px; }
    .kpi__label { font-size: 12px; color: var(--vexa-gray-500); }
    .kpi__row { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
    .kpi__value { font-size: 30px; font-weight: 800; }
    .trend {
      display: inline-flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600;
      color: var(--vexa-success-700); background: var(--vexa-success-100);
      padding: 3px 8px; border-radius: 999px;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .trend--down { color: var(--vexa-error-700); background: var(--vexa-error-100); }
    .charts, .bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 960px) { .charts, .bottom { grid-template-columns: 1fr; } }
    .chart-card { padding: 20px; }
    .chart-card h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .health, .log { list-style: none; margin: 0; padding: 0; }
    .health li { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .health__status { font-weight: 600; }
    .log li { display: flex; gap: 8px; align-items: baseline; padding: 6px 0; font-size: 13px; }
    .log__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--vexa-primary-600); flex-shrink: 0; }
    .muted { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly api = inject(ApiService);
  private readonly realtime = inject(RealtimeService);

  protected readonly stats = signal<AdminStats>({ users: 0, companies: 0, couriers: 0, jobs: 0, activeDeliveries: 0, delivered: 0, revenue: 0, disputesPending: 0, volume: [], revenueSeries: [], health: [] });
  protected readonly log = signal<string[]>([]);

  protected readonly volume = () => this.stats().volume ?? [0, 0, 0, 0, 0, 0, 0];
  protected readonly revenue = () => this.stats().revenueSeries ?? [0, 0, 0, 0, 0, 0, 0];
  protected readonly health = () => this.stats().health ?? [];

  protected readonly kpis = computed(() => {
    const s = this.stats();
    return [
      { label: 'Usuarios de la plataforma', value: (s.users + s.companies + s.couriers).toLocaleString('es-CO'), trend: '+12.4%', down: false },
      { label: 'Entregas activas', value: s.activeDeliveries.toLocaleString('es-CO'), trend: '+8.2%', down: false },
      { label: 'Ingresos hoy', value: `$${(s.revenue || 0).toLocaleString('es-CO')}`, trend: '+18.5%', down: false },
      { label: 'Disputas pendientes', value: (s.disputesPending ?? 0).toLocaleString('es-CO'), trend: '-4%', down: true },
    ];
  });

  constructor() {
    this.api.get<AdminStats>('admin/analytics').subscribe((s) => this.stats.set(s));

    this.realtime.on(SocketEvents.NEW_JOB).subscribe((e) =>
      this.log.update((l) => [`Nuevo pedido #${e.job.id.slice(0, 8)} publicado`, ...l].slice(0, 8)),
    );
    this.realtime.on(SocketEvents.JOB_ACCEPTED).subscribe((e) =>
      this.log.update((l) => [`Pedido #${e.jobId.slice(0, 8)} asignado a un repartidor`, ...l].slice(0, 8)),
    );
    this.realtime.on(SocketEvents.JOB_COMPLETED).subscribe((e) =>
      this.log.update((l) => [`Pedido #${e.jobId.slice(0, 8)} entregado`, ...l].slice(0, 8)),
    );
  }
}
