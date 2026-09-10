import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CourierStatus, Job, JobStatus } from '@vexa/shared';
import { StatCard } from '@vexa/ui';
import { CourierEarnings, CouriersService } from '../../core/couriers/couriers.service';
import { AuthStore } from '../../core/auth/auth.store';
import { JobsService } from '../jobs/jobs.service';

/** Figma: web-courier-dashboard */
@Component({
  selector: 'vexa-courier-dashboard',
  imports: [DecimalPipe, MatIconModule, MatSlideToggleModule, StatCard],
  template: `
    <div class="banner">
      <div class="banner__text">
        <h1>Hola, {{ firstName() }}!</h1>
        <p>Estás verificado y autorizado para completar entregas en Vexa.</p>
      </div>
      <div class="banner__status">
        <span [class.banner__status-label--on]="isOnline()" class="banner__status-label">
          {{ isOnline() ? 'EN LÍNEA' : 'DESCONECTADO' }}
        </span>
        <mat-slide-toggle [checked]="isOnline()" (change)="toggleStatus($event.checked)" />
      </div>
    </div>

    <div class="earnings vexa-card">
      <div class="earnings__left">
        <span class="vexa-overline">Ganancias de hoy</span>
        <span class="earnings__value">\${{ earnings()?.today ?? 0 | number: '1.2-2':'es-CO' }}</span>
      </div>
      <div class="earnings__note">
        <mat-icon>smartphone</mat-icon>
        <span>Los pedidos nuevos se aceptan desde la app móvil de Vexa.</span>
      </div>
    </div>

    <section class="kpis">
      <vexa-stat-card label="Entregas de hoy" [value]="todayCount()" icon="inventory_2" tone="primary" />
      <vexa-stat-card
        label="Completadas esta semana"
        [value]="earnings()?.completed ?? 0"
        icon="task_alt"
        tone="success"
      />
      <vexa-stat-card label="Calificación activa" [value]="ratingLabel()" icon="star" tone="warning" />
    </section>

    <div class="vexa-card activity">
      <h2 class="vexa-h5">Historial reciente</h2>
      <div class="activity__list">
        @for (job of recentJobs(); track job.id) {
          <div class="activity__row">
            <div class="activity__icon"><mat-icon>inventory_2</mat-icon></div>
            <div class="activity__info">
              <div class="activity__id-line">
                <strong>#{{ job.id.slice(0, 8).toUpperCase() }}</strong>
                <span class="dot">·</span>
                <span>{{ job.pickup.city }} → {{ job.dropoff.city }}</span>
              </div>
              @if (job.notes) {
                <span class="activity__note">{{ job.notes }}</span>
              }
            </div>
            <span class="vexa-pill vexa-pill--success">
              Entregado (+\${{ job.price | number: '1.2-2':'es-CO' }})
            </span>
            <span class="activity__time">{{ timeAgo(job.completedAt) }}</span>
          </div>
        } @empty {
          <p>Aún no tienes entregas completadas.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 32px; border-radius: var(--vexa-radius-lg); margin-bottom: 24px;
      background: linear-gradient(90deg, var(--vexa-sidebar-active), var(--vexa-sidebar-bg));
      color: #fff;
    }
    .banner__text h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .banner__text p { margin: 0; color: var(--vexa-sidebar-muted); font-size: 15px; max-width: 500px; }
    .banner__status { display: flex; align-items: center; gap: 12px; flex: none; }
    .banner__status-label { font-size: 14px; font-weight: 600; color: var(--vexa-sidebar-muted); }
    .banner__status-label--on { color: var(--vexa-success-500); }

    .earnings {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px;
    }
    .earnings__left { display: flex; flex-direction: column; gap: 8px; }
    .earnings__value { font-size: 40px; font-weight: 700; color: var(--vexa-gray-900); }
    .earnings__note {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: var(--vexa-primary-50); color: var(--vexa-primary-600);
      border-radius: var(--vexa-radius-sm); font-size: 13px; font-weight: 500;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }

    .activity__list { display: flex; flex-direction: column; }
    .activity__row {
      display: flex; align-items: center; gap: 16px; padding: 16px 0;
      border-bottom: 1px solid var(--vexa-gray-200);
      &:last-child { border-bottom: none; }
    }
    .activity__icon {
      flex: none; width: 40px; height: 40px; border-radius: var(--vexa-radius-md);
      background: var(--vexa-gray-50); display: grid; place-items: center; color: var(--vexa-gray-500);
    }
    .activity__info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .activity__id-line { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--vexa-gray-600); }
    .activity__id-line strong { color: var(--vexa-gray-900); }
    .dot { color: var(--vexa-gray-400); }
    .activity__note { font-size: 13px; color: var(--vexa-gray-400); }
    .activity__time { flex: none; font-size: 13px; color: var(--vexa-gray-400); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly couriers = inject(CouriersService);
  private readonly jobs = inject(JobsService);
  protected readonly auth = inject(AuthStore);

  protected readonly earnings = signal<CourierEarnings | null>(null);
  protected readonly status = signal<CourierStatus>(CourierStatus.OFFLINE);
  protected readonly recentJobs = signal<Job[]>([]);

  protected readonly isOnline = computed(() => this.status() === CourierStatus.AVAILABLE);
  protected readonly firstName = computed(() => this.auth.user()?.fullName?.split(' ')[0] ?? '');
  protected readonly ratingLabel = computed(() => {
    const e = this.earnings();
    return e ? `${e.rating.toFixed(2)} / 5.0` : '—';
  });
  protected readonly todayCount = computed(
    () => this.recentJobs().filter((j) => this.isToday(j.completedAt)).length
  );

  constructor() {
    this.couriers.me().subscribe((courier) => this.status.set(courier.status));
    this.couriers.earnings().subscribe((earnings) => this.earnings.set(earnings));
    this.jobs.list({ status: JobStatus.DELIVERED, pageSize: 10 }).subscribe((page) => this.recentJobs.set(page.items));
  }

  protected toggleStatus(checked: boolean): void {
    const next = checked ? CourierStatus.AVAILABLE : CourierStatus.OFFLINE;
    this.status.set(next);
    this.couriers.updateStatus(next).subscribe();
  }

  private isToday(date?: string): boolean {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }

  protected timeAgo(date?: string): string {
    if (!date) return '';
    const diffMs = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'justo ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }
}
