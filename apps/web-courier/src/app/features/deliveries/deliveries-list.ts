import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Job, JobStatus, Paginated } from '@vexa/shared';
import { StatusChip } from '@vexa/ui';
import { JobsService } from '../jobs/jobs.service';

type Tab = 'active' | 'completed' | 'pending';

const ACTIVE_STATUSES = [JobStatus.ACCEPTED, JobStatus.PICKED_UP, JobStatus.IN_TRANSIT];
const PROGRESS: Record<string, number> = {
  [JobStatus.PENDING]: 5,
  [JobStatus.OFFERED]: 15,
  [JobStatus.ACCEPTED]: 35,
  [JobStatus.PICKED_UP]: 60,
  [JobStatus.IN_TRANSIT]: 80,
  [JobStatus.DELIVERED]: 100,
  [JobStatus.CANCELLED]: 100,
};

/** Figma: web-courier-deliveries */
@Component({
  selector: 'vexa-courier-deliveries',
  imports: [DatePipe, DecimalPipe, MatIconModule, StatusChip],
  template: `
    <div class="notice">
      <mat-icon>info</mat-icon>
      <span>Acepta nuevos pedidos desde la app móvil de Vexa. Aquí solo puedes ver, rastrear y revisar el historial.</span>
    </div>

    <div class="tabs">
      @for (t of tabs; track t.value) {
        <button
          type="button"
          class="tabs__item"
          [class.tabs__item--active]="tab() === t.value"
          (click)="tab.set(t.value)"
        >
          {{ t.label }}
        </button>
      }
    </div>

    <div class="vexa-card table-card">
      <div class="table-header">
        <span class="col col--id">ID</span>
        <span class="col col--date">Fecha</span>
        <span class="col col--route">Ruta</span>
        <span class="col col--detail">Detalle</span>
        <span class="col col--status">Estado</span>
        <span class="col col--earnings">Ganancia</span>
        <span class="col col--progress">Progreso</span>
      </div>
      @for (job of filtered(); track job.id) {
        <div class="row">
          <span class="col col--id">#{{ job.id.slice(0, 8).toUpperCase() }}</span>
          <span class="col col--date">{{ job.createdAt | date: 'short':'':'es-CO' }}</span>
          <span class="col col--route">{{ job.pickup.city }} → {{ job.dropoff.city }}</span>
          <span class="col col--detail">{{ job.notes || '—' }}</span>
          <span class="col col--status"><vexa-status-chip [status]="job.status" /></span>
          <span class="col col--earnings">\${{ job.price | number: '1.2-2':'es-CO' }}</span>
          <span class="col col--progress">
            <span class="progress">
              <span class="progress__bar" [style.width.%]="PROGRESS[job.status] ?? 0"></span>
            </span>
            <span class="progress__pct">{{ PROGRESS[job.status] ?? 0 }}%</span>
          </span>
        </div>
      } @empty {
        <p class="empty">No hay entregas en esta categoría.</p>
      }
    </div>
  `,
  styles: `
    .notice {
      display: flex; align-items: center; gap: 12px; padding: 20px;
      background: var(--vexa-warning-50); border: 1px solid var(--vexa-warning-300);
      border-radius: var(--vexa-radius-md); color: var(--vexa-warning-900); font-size: 14px; font-weight: 600;
      margin-bottom: 24px;
      mat-icon { flex: none; color: var(--vexa-warning-700); }
    }
    .tabs { display: flex; gap: 4px; padding: 4px; background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md); margin-bottom: 24px; width: fit-content; }
    .tabs__item { border: 0; background: transparent; padding: 8px 16px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer; }
    .tabs__item--active { background: var(--vexa-primary-600); color: #fff; }

    .table-card { padding: 0; overflow: hidden; }
    .table-header, .row { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--vexa-gray-200); }
    .row { text-decoration: none; color: inherit; }
    .row:hover { background: var(--vexa-gray-50); }
    .row:last-child { border-bottom: none; }
    .table-header { background: var(--vexa-gray-50); font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); }
    .col--id { width: 100px; flex: none; font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; }
    .col--date { width: 140px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--route { width: 200px; flex: none; color: var(--vexa-gray-900); font-size: 14px; }
    .col--detail { flex: 1 1 auto; min-width: 0; color: var(--vexa-gray-600); font-size: 14px; }
    .col--status { width: 110px; flex: none; }
    .col--earnings { width: 90px; flex: none; font-weight: 600; color: var(--vexa-gray-900); font-size: 14px; }
    .col--progress { width: 140px; flex: none; display: flex; align-items: center; gap: 10px; }
    .progress { flex: 1 1 auto; height: 6px; border-radius: 3px; background: var(--vexa-gray-200); overflow: hidden; }
    .progress__bar { display: block; height: 100%; background: var(--vexa-primary-600); border-radius: 3px; }
    .progress__pct { font-size: 13px; font-weight: 600; color: var(--vexa-gray-900); }
    .empty { padding: 24px; text-align: center; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveriesList {
  private readonly jobs = inject(JobsService);
  protected readonly PROGRESS = PROGRESS;

  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'active', label: 'Activas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'pending', label: 'Recolecciones pendientes' },
  ];

  protected readonly tab = signal<Tab>('active');
  protected readonly page = signal<Paginated<Job> | null>(null);
  protected readonly filtered = computed(() => {
    const items = this.page()?.items ?? [];
    const tab = this.tab();
    if (tab === 'active') return items.filter((j) => ACTIVE_STATUSES.includes(j.status));
    if (tab === 'completed') return items.filter((j) => j.status === JobStatus.DELIVERED);
    return items.filter((j) => j.status === JobStatus.PENDING || j.status === JobStatus.OFFERED);
  });

  constructor() {
    this.jobs.list({ pageSize: 50 }).subscribe((page) => this.page.set(page));
  }
}
