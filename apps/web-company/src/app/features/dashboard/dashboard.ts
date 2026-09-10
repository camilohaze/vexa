import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Job, JobStatus } from '@vexa/shared';
import { StatCard, StatusChip } from '@vexa/ui';
import { AuthStore } from '../../core/auth/auth.store';
import { JobsService } from '../jobs/jobs.service';

/** Figma: web-company-dashboard */
@Component({
  selector: 'vexa-dashboard',
  imports: [MatIconModule, RouterLink, StatCard, StatusChip],
  template: `
    <div class="banner">
      <div class="banner__text">
        <h1>Hola, {{ companyName() }}</h1>
        <p>Tu flujo logístico va bien. {{ activeCount() }} envíos en tránsito.</p>
      </div>
      <div class="banner__actions">
        <a routerLink="/jobs/new" class="banner__btn banner__btn--primary">
          <mat-icon>add</mat-icon>
          Nuevo envío
        </a>
        <a routerLink="/tracking" class="banner__btn banner__btn--ghost">
          <mat-icon>search</mat-icon>
          Rastrear envío
        </a>
      </div>
    </div>

    <section class="kpis">
      <vexa-stat-card label="Envíos activos" [value]="activeCount()" icon="inventory_2" tone="primary" />
      <vexa-stat-card label="Completados hoy" [value]="completedTodayCount()" icon="task_alt" tone="success" />
      <vexa-stat-card label="Pedidos pendientes" [value]="pendingCount()" icon="schedule" tone="warning" />
    </section>

    <div class="vexa-card activity">
      <h2 class="vexa-h5">Actividad reciente</h2>
      <div class="activity__list">
        @for (job of recentJobs(); track job.id) {
          <div class="activity__row">
            <div class="activity__icon"><mat-icon>local_shipping</mat-icon></div>
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
            <vexa-status-chip [status]="job.status" />
            <span class="activity__time">{{ timeAgo(job.createdAt) }}</span>
          </div>
        } @empty {
          <p class="activity__empty">Aún no tienes envíos registrados.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 32px; border-radius: var(--vexa-radius-lg); margin-bottom: 24px;
      background: linear-gradient(90deg, var(--vexa-primary-700), var(--vexa-primary-600));
      color: #fff;
    }
    .banner__text h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .banner__text p { margin: 0; color: var(--vexa-primary-200); font-size: 15px; max-width: 500px; }
    .banner__actions { display: flex; gap: 12px; flex: none; }
    .banner__btn {
      display: flex; align-items: center; gap: 8px; padding: 12px 20px;
      border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600;
      text-decoration: none; border: none; cursor: pointer;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }
    .banner__btn--primary { background: #fff; color: var(--vexa-primary-600); }
    .banner__btn--ghost { background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }

    .activity__list { display: flex; flex-direction: column; }
    .activity__row {
      display: flex; align-items: center; gap: 16px; padding: 16px 0;
      border-bottom: 1px solid var(--vexa-gray-200);
      &:last-child { border-bottom: none; }
    }
    .activity__icon {
      flex: none; width: 40px; height: 40px; border-radius: 50%;
      background: var(--vexa-gray-50); display: grid; place-items: center; color: var(--vexa-gray-500);
    }
    .activity__info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .activity__id-line { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--vexa-gray-600); }
    .activity__id-line strong { color: var(--vexa-gray-900); }
    .dot { color: var(--vexa-gray-400); }
    .activity__note { font-size: 12px; color: var(--vexa-gray-400); }
    .activity__time { flex: none; font-size: 13px; color: var(--vexa-gray-400); }
    .activity__empty { color: var(--vexa-gray-500); padding: 8px 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly jobs = inject(JobsService);
  protected readonly auth = inject(AuthStore);

  protected readonly all = signal<Job[]>([]);
  protected readonly companyName = computed(() => this.auth.user()?.fullName ?? '');
  protected readonly recentJobs = computed(() =>
    [...this.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  );

  private count(status: JobStatus): number {
    return this.all().filter((j) => j.status === status).length;
  }

  protected readonly activeCount = computed(
    () =>
      this.count(JobStatus.IN_TRANSIT) +
      this.count(JobStatus.PICKED_UP) +
      this.count(JobStatus.ACCEPTED) +
      this.count(JobStatus.OFFERED)
  );
  protected readonly pendingCount = computed(() => this.count(JobStatus.PENDING));
  protected readonly completedTodayCount = computed(
    () =>
      this.all().filter((j) => j.status === JobStatus.DELIVERED && this.isToday(j.completedAt)).length
  );

  constructor() {
    this.jobs.list({ pageSize: 50 }).subscribe((page) => this.all.set(page.items));
  }

  private isToday(date?: string): boolean {
    if (!date) return false;
    return new Date(date).toDateString() === new Date().toDateString();
  }

  protected timeAgo(date?: string): string {
    if (!date) return '';
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'justo ahora';
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return `hace ${Math.floor(hours / 24)}d`;
  }
}
