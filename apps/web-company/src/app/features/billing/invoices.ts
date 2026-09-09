import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: invoices — listado de facturas con descarga. */
@Component({
  selector: 'vexa-invoices',
  imports: [DecimalPipe, MatButtonModule, PageHeader],
  template: `
    <vexa-page-header title="Facturación">
      <button mat-flat-button actions>Descargar todo</button>
    </vexa-page-header>
    <div class="invoices">
      @for (inv of invoices(); track inv.period) {
        <div class="invoice vexa-card">
          <div>
            <strong>INV-{{ inv.period }}</strong>
            <small>{{ inv.count }} pagos · {{ inv.period }}</small>
            <strong class="invoice__total">{{ inv.total | number:'1.2-2':'es-CO' }} COP</strong>
          </div>
          <div class="invoice__right">
            <span class="vexa-pill vexa-pill--success">Pagada</span>
            <button mat-button>Descargar</button>
          </div>
        </div>
      } @empty {
        <p style="color:var(--vexa-gray-500)">Sin facturas todavía.</p>
      }
    </div>
  `,
  styles: `
    .invoices { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
    .invoice { padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
    .invoice div:first-child { display: flex; flex-direction: column; gap: 2px; }
    .invoice small { color: var(--vexa-gray-500); }
    .invoice__total { color: var(--vexa-primary-700); }
    .invoice__right { display: flex; align-items: center; gap: 12px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invoices {
  protected readonly invoices = signal<{ period: string; count: number; total: number }[]>([]);

  constructor() {
    inject(ApiService)
      .get<{ period: string; count: string; total: string }[]>('companies/me/invoices')
      .subscribe((rows) =>
        this.invoices.set(
          rows.map((r) => ({ period: r.period, count: Number(r.count), total: Number(r.total) })),
        ),
      );
  }
}
