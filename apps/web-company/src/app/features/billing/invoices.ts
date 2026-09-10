import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { StatusChip } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';
import { DeliveryHistoryJob, JobsService } from '../jobs/jobs.service';

type Tab = 'invoices' | 'history';

/** Figma: web-invoices + web-delivery-history (ambas viven bajo el ítem "Invoices" del sidebar) */
@Component({
  selector: 'vexa-invoices',
  imports: [DatePipe, DecimalPipe, FormsModule, MatPaginatorModule, RouterLink, StatusChip],
  template: `
    <div class="tabs">
      <button type="button" class="tabs__item" [class.tabs__item--active]="tab() === 'invoices'" (click)="tab.set('invoices')">
        Facturas
      </button>
      <button type="button" class="tabs__item" [class.tabs__item--active]="tab() === 'history'" (click)="tab.set('history')">
        Historial de entregas
      </button>
    </div>

    @if (tab() === 'invoices') {
      <section class="kpis">
        <div class="vexa-card kpi">
          <span class="kpi__label">Total facturado (histórico)</span>
          <strong class="kpi__value">\${{ totalBilled() | number: '1.0-0' }}</strong>
        </div>
        <div class="vexa-card kpi">
          <span class="kpi__label">Facturas pagadas</span>
          <strong class="kpi__value kpi__value--success">{{ invoices().length }}</strong>
        </div>
      </section>

      <div class="vexa-card table-card">
        <div class="table-header">
          <span class="col col--id">Factura</span>
          <span class="col col--period">Período</span>
          <span class="col col--items">Pagos incluidos</span>
          <span class="col col--status">Estado</span>
          <span class="col col--amount">Monto</span>
          <span class="col col--action"></span>
        </div>
        @for (inv of invoices(); track inv.period) {
          <div class="row">
            <span class="col col--id">INV-{{ inv.period }}</span>
            <span class="col col--period">{{ inv.period }}</span>
            <span class="col col--items">{{ inv.count }} envíos</span>
            <span class="col col--status"><span class="status-badge">Pagada</span></span>
            <span class="col col--amount">\${{ inv.total | number: '1.0-0' }}</span>
            <span class="col col--action"><button type="button" class="link">Descargar</button></span>
          </div>
        } @empty {
          <p class="empty">Sin facturas todavía.</p>
        }
      </div>
    } @else {
      <section class="kpis">
        <div class="vexa-card kpi">
          <span class="kpi__label">Envíos entregados</span>
          <strong class="kpi__value">{{ historyStats().totalCount | number: '1.0-0' }}</strong>
        </div>
        <div class="vexa-card kpi">
          <span class="kpi__label">Gasto logístico total</span>
          <strong class="kpi__value">\${{ historyStats().totalSpend | number: '1.0-0' }}</strong>
        </div>
        <div class="vexa-card kpi">
          <span class="kpi__label">Tiempo de transporte promedio</span>
          <strong class="kpi__value">{{ avgTransportLabel() }}</strong>
        </div>
      </section>

      <div class="filters-bar">
        <input class="search" type="text" placeholder="Buscar en el archivo…" [(ngModel)]="search" (ngModelChange)="onFiltersChange()" />
        <div class="date-range">
          <input type="date" [(ngModel)]="fromDate" (ngModelChange)="onFiltersChange()" />
          <span>–</span>
          <input type="date" [(ngModel)]="toDate" (ngModelChange)="onFiltersChange()" />
        </div>
        <button type="button" class="export-btn" [disabled]="exporting()" (click)="exportCsv()">
          {{ exporting() ? 'Exportando…' : 'Exportar CSV' }}
        </button>
      </div>

      <div class="vexa-card table-card">
        <div class="table-header">
          <span class="col col--id">Paquete</span>
          <span class="col col--date">Fecha de entrega</span>
          <span class="col col--courier">Repartidor</span>
          <span class="col col--route">Ruta</span>
          <span class="col col--type">Tipo</span>
          <span class="col col--status">Estado</span>
          <span class="col col--amount">Costo total</span>
        </div>
        @for (job of historyRows(); track job.id) {
          <a [routerLink]="['../jobs', job.id]" class="row">
            <span class="col col--id">VX-{{ job.id.slice(0, 6).toUpperCase() }}</span>
            <span class="col col--date">{{ job.completedAt ? (job.completedAt | date: 'mediumDate') : '—' }}</span>
            <span class="col col--courier">{{ courierNameOf(job) }}</span>
            <span class="col col--route">{{ job.pickup.city }} → {{ job.dropoff.city }}</span>
            <span class="col col--type">{{ job.packageType || '—' }}</span>
            <span class="col col--status"><vexa-status-chip [status]="job.status" /></span>
            <span class="col col--amount">\${{ job.price | number: '1.0-0' }}</span>
          </a>
        } @empty {
          <p class="empty">No hay entregas en este rango.</p>
        }
      </div>

      <mat-paginator [length]="historyTotal()" [pageSize]="historyPageSize" (page)="onHistoryPage($event)" />
    }
  `,
  styles: `
    .tabs {
      display: inline-flex; gap: 4px; padding: 4px; background: #fff;
      border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md); margin-bottom: 24px;
    }
    .tabs__item {
      border: 0; background: transparent; padding: 8px 16px; border-radius: var(--vexa-radius-sm);
      font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer;
    }
    .tabs__item--active { background: var(--vexa-primary-600); color: #fff; }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { display: flex; flex-direction: column; gap: 12px; }
    .kpi__label { font-size: 14px; color: var(--vexa-gray-600); font-weight: 500; }
    .kpi__value { font-size: 32px; font-weight: 700; color: var(--vexa-gray-900); }
    .kpi__value--success { color: var(--vexa-success-600); }

    .table-card { padding: 0; overflow: hidden; overflow-x: auto; }
    .table-header, .row { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--vexa-gray-200); min-width: 760px; }
    .row { text-decoration: none; color: inherit; }
    .row:hover { background: var(--vexa-gray-50); }
    .row:last-child { border-bottom: none; }
    .table-header { background: var(--vexa-gray-50); font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); }
    .col--id { width: 140px; flex: none; font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; }
    .col--period { width: 160px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--items { flex: 1 1 auto; min-width: 0; color: var(--vexa-gray-600); font-size: 14px; }
    .col--date { width: 140px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--courier { width: 150px; flex: none; color: var(--vexa-gray-900); font-size: 14px; }
    .col--route { flex: 1 1 auto; min-width: 0; color: var(--vexa-gray-600); font-size: 14px; }
    .col--type { width: 130px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--status { width: 100px; flex: none; }
    .status-badge { background: var(--vexa-success-100); color: var(--vexa-success-700); font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
    .col--amount { width: 120px; flex: none; font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; text-align: right; }
    .col--action { width: 90px; flex: none; text-align: right; }
    .link { border: none; background: none; padding: 0; font-size: 14px; font-weight: 600; color: var(--vexa-primary-600); cursor: pointer; }
    .empty { padding: 16px 24px; color: var(--vexa-gray-500); }

    .filters-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .search {
      flex: 1 1 220px; padding: 10px 14px; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-sm);
      font: inherit; font-size: 14px;
    }
    .date-range { display: flex; align-items: center; gap: 6px; }
    .date-range input {
      padding: 9px 10px; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-sm); font: inherit; font-size: 13px;
    }
    .export-btn {
      border: 1px solid var(--vexa-primary-600); background: #fff; color: var(--vexa-primary-600);
      padding: 9px 16px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .export-btn:disabled { opacity: 0.6; cursor: default; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoices {
  private readonly jobsService = inject(JobsService);

  protected readonly tab = signal<Tab>('invoices');

  // --- Facturas ---
  protected readonly invoices = signal<{ period: string; count: number; total: number }[]>([]);
  protected readonly totalBilled = computed(() => this.invoices().reduce((acc, i) => acc + i.total, 0));

  // --- Historial de entregas ---
  protected readonly historyRows = signal<DeliveryHistoryJob[]>([]);
  protected readonly historyTotal = signal(0);
  protected readonly historyStats = signal({ totalCount: 0, totalSpend: 0, avgTransportSeconds: 0 });
  protected readonly exporting = signal(false);
  protected readonly historyPageSize = 20;
  private historyPageIndex = 0;

  protected search = '';
  protected fromDate = '';
  protected toDate = '';

  protected readonly avgTransportLabel = computed(() => {
    const seconds = this.historyStats().avgTransportSeconds;
    if (!seconds) return '—';
    const hours = seconds / 3600;
    return hours >= 24 ? `${(hours / 24).toFixed(1)} días` : `${hours.toFixed(1)} h`;
  });

  constructor() {
    inject(ApiService)
      .get<{ period: string; count: string; total: string }[]>('companies/me/invoices')
      .subscribe((rows) =>
        this.invoices.set(rows.map((r) => ({ period: r.period, count: Number(r.count), total: Number(r.total) })))
      );
    this.loadHistory();
  }

  protected courierNameOf(job: DeliveryHistoryJob): string {
    return job.courier?.user?.fullName ?? 'Repartidor';
  }

  protected onFiltersChange() {
    this.historyPageIndex = 0;
    this.loadHistory();
  }

  protected onHistoryPage(event: PageEvent) {
    this.historyPageIndex = event.pageIndex;
    this.loadHistory();
  }

  private loadHistory() {
    this.jobsService
      .history({
        ...(this.fromDate ? { from: this.fromDate } : {}),
        ...(this.toDate ? { to: this.toDate } : {}),
        ...(this.search ? { search: this.search } : {}),
        page: this.historyPageIndex + 1,
        pageSize: this.historyPageSize,
      })
      .subscribe((page) => {
        this.historyRows.set(page.items);
        this.historyTotal.set(page.total);
        this.historyStats.set(page.stats);
      });
  }

  protected exportCsv() {
    this.exporting.set(true);
    this.jobsService
      .history({
        ...(this.fromDate ? { from: this.fromDate } : {}),
        ...(this.toDate ? { to: this.toDate } : {}),
        ...(this.search ? { search: this.search } : {}),
        page: 1,
        pageSize: 1000,
      })
      .subscribe({
        next: (page) => {
          const header = ['Paquete', 'Fecha de entrega', 'Ruta', 'Tipo', 'Estado', 'Costo total (COP)'];
          const rows = page.items.map((job) => [
            `VX-${job.id.slice(0, 6).toUpperCase()}`,
            job.completedAt ? new Date(job.completedAt).toLocaleDateString('es-CO') : '',
            `${job.pickup.city} -> ${job.dropoff.city}`,
            job.packageType ?? '',
            job.status,
            String(job.price),
          ]);
          const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'historial-entregas.csv';
          a.click();
          URL.revokeObjectURL(url);
          this.exporting.set(false);
        },
        error: () => this.exporting.set(false),
      });
  }
}
