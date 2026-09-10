import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';

/** Figma: web-invoices */
@Component({
  selector: 'vexa-invoices',
  imports: [DecimalPipe],
  template: `
    <section class="kpis">
      <div class="vexa-card kpi">
        <span class="kpi__label">Total facturado (histórico)</span>
        <strong class="kpi__value">\${{ totalBilled() | number: '1.0-0':'es-CO' }}</strong>
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
          <span class="col col--amount">\${{ inv.total | number: '1.0-0':'es-CO' }}</span>
          <span class="col col--action"><button type="button" class="link">Descargar</button></span>
        </div>
      } @empty {
        <p class="empty">Sin facturas todavía.</p>
      }
    </div>
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { display: flex; flex-direction: column; gap: 12px; }
    .kpi__label { font-size: 14px; color: var(--vexa-gray-600); font-weight: 500; }
    .kpi__value { font-size: 32px; font-weight: 700; color: var(--vexa-gray-900); }
    .kpi__value--success { color: var(--vexa-success-600); }

    .table-card { padding: 0; overflow: hidden; }
    .table-header, .row { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid var(--vexa-gray-200); }
    .row:last-child { border-bottom: none; }
    .table-header { background: var(--vexa-gray-50); font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); }
    .col--id { width: 140px; flex: none; font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; }
    .col--period { width: 160px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--items { flex: 1 1 auto; min-width: 0; color: var(--vexa-gray-600); font-size: 14px; }
    .col--status { width: 100px; flex: none; }
    .status-badge { background: var(--vexa-success-100); color: var(--vexa-success-700); font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 8px; }
    .col--amount { width: 120px; flex: none; font-weight: 700; color: var(--vexa-gray-900); font-size: 14px; }
    .col--action { width: 90px; flex: none; text-align: right; }
    .link { border: none; background: none; padding: 0; font-size: 14px; font-weight: 600; color: var(--vexa-primary-600); cursor: pointer; }
    .empty { padding: 16px 24px; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoices {
  protected readonly invoices = signal<{ period: string; count: number; total: number }[]>([]);
  protected readonly totalBilled = computed(() => this.invoices().reduce((acc, i) => acc + i.total, 0));

  constructor() {
    inject(ApiService)
      .get<{ period: string; count: string; total: string }[]>('companies/me/invoices')
      .subscribe((rows) =>
        this.invoices.set(rows.map((r) => ({ period: r.period, count: Number(r.count), total: Number(r.total) })))
      );
  }
}
