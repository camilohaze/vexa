import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { Job, JobStatus, Paginated } from '@vexa/shared';
import { StatusChip } from '@vexa/ui';
import { JobsService } from './jobs.service';

type Tab = 'all' | 'active' | 'pending';

/** Figma: web-active-deliveries */
@Component({
  selector: 'vexa-jobs-list',
  imports: [MatIconModule, MatPaginatorModule, RouterLink, StatusChip],
  template: `
    <div class="filters-bar">
      <div class="tabs">
        @for (t of tabs; track t.value) {
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="tab() === t.value"
            (click)="setTab(t.value)"
          >
            {{ t.label }}
          </button>
        }
      </div>
      <a routerLink="../jobs/new" class="express-btn">Solicitar repartidor exprés</a>
    </div>

    <div class="vexa-card table-card">
      <div class="table-header">
        <span class="col col--id">ID</span>
        <span class="col col--courier">Repartidor</span>
        <span class="col col--detail">Detalle</span>
        <span class="col col--route">Ruta</span>
        <span class="col col--status">Estado</span>
        <span class="col col--progress">Progreso</span>
      </div>
      @for (job of page()?.items ?? []; track job.id) {
        <a [routerLink]="['../jobs', job.id]" class="row">
          <span class="col col--id row-id">#{{ job.id.slice(0, 8).toUpperCase() }}</span>
          <span class="col col--courier row-courier">
            <mat-icon>person</mat-icon>
            {{ job.courierId ? 'Repartidor #' + job.courierId.slice(0, 6) : 'Sin asignar' }}
          </span>
          <span class="col col--detail">{{ job.notes || '—' }}</span>
          <span class="col col--route">{{ job.pickup.city }} → {{ job.dropoff.city }}</span>
          <span class="col col--status"><vexa-status-chip [status]="job.status" /></span>
          <span class="col col--progress">
            <span class="progress">
              <span class="progress__bar" [style.width.%]="progressOf(job)"></span>
            </span>
            <span class="progress__pct">{{ progressOf(job) }}%</span>
          </span>
        </a>
      } @empty {
        <p class="empty">No hay envíos en esta categoría.</p>
      }
    </div>

    <mat-paginator [length]="page()?.total ?? 0" [pageSize]="pageSize" (page)="onPage($event)" />
  `,
  styles: `
    .filters-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .tabs {
      display: flex; gap: 4px; padding: 4px; background: #fff;
      border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md);
    }
    .tabs__item {
      border: 0; background: transparent; padding: 8px 16px; border-radius: var(--vexa-radius-sm);
      font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer;
    }
    .tabs__item--active { background: var(--vexa-primary-600); color: #fff; }
    .express-btn {
      background: var(--vexa-primary-600); color: #fff; text-decoration: none;
      padding: 10px 16px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600;
    }

    .table-card { padding: 0; overflow: hidden; }
    .table-header, .row {
      display: flex; align-items: center; gap: 12px; padding: 16px 24px;
      border-bottom: 1px solid var(--vexa-gray-200);
    }
    .row { text-decoration: none; color: inherit; }
    .row:hover { background: var(--vexa-gray-50); }
    .row:last-child { border-bottom: none; }
    .table-header { background: var(--vexa-gray-50); font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); }
    .col--id { width: 100px; flex: none; }
    .col--courier { width: 170px; flex: none; display: flex; align-items: center; gap: 8px; }
    .col--courier mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--vexa-gray-400); }
    .col--detail { width: 140px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--route { flex: 1 1 auto; min-width: 0; color: var(--vexa-gray-600); font-size: 14px; }
    .col--status { width: 110px; flex: none; }
    .col--progress { width: 140px; flex: none; display: flex; align-items: center; gap: 10px; }
    .row-id { font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; }
    .row-courier { font-size: 14px; color: var(--vexa-gray-900); font-weight: 500; }
    .progress { flex: 1 1 auto; height: 6px; border-radius: 3px; background: var(--vexa-gray-200); overflow: hidden; }
    .progress__bar { display: block; height: 100%; background: var(--vexa-primary-600); border-radius: 3px; }
    .progress__pct { font-size: 13px; font-weight: 600; color: var(--vexa-gray-900); }
    .empty { padding: 24px; text-align: center; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsList {
  private readonly service = inject(JobsService);

  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'En tránsito' },
    { value: 'pending', label: 'Recolecciones pendientes' },
  ];

  protected readonly page = signal<Paginated<Job> | null>(null);
  protected readonly tab = signal<Tab>('all');
  protected readonly pageSize = 20;
  private pageIndex = 0;

  private static readonly ACTIVE = [JobStatus.ACCEPTED, JobStatus.PICKED_UP, JobStatus.IN_TRANSIT];

  private static readonly PROGRESS: Record<string, number> = {
    [JobStatus.PENDING]: 5,
    [JobStatus.OFFERED]: 15,
    [JobStatus.ACCEPTED]: 35,
    [JobStatus.PICKED_UP]: 60,
    [JobStatus.IN_TRANSIT]: 80,
    [JobStatus.DELIVERED]: 100,
    [JobStatus.CANCELLED]: 100,
  };

  constructor() {
    this.load();
  }

  setTab(tab: Tab) {
    this.tab.set(tab);
    this.pageIndex = 0;
    this.load();
  }

  progressOf(job: Job) {
    return JobsList.PROGRESS[job.status] ?? 0;
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.load();
  }

  private load() {
    const tab = this.tab();
    this.service.list({ page: this.pageIndex + 1, pageSize: this.pageSize }).subscribe((page) => {
      const items =
        tab === 'active'
          ? page.items.filter((j) => JobsList.ACTIVE.includes(j.status))
          : tab === 'pending'
            ? page.items.filter((j) => j.status === JobStatus.PENDING || j.status === JobStatus.OFFERED)
            : page.items;
      this.page.set({ ...page, items });
    });
  }
}
