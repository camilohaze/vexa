import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: commission-management — tasa base, tiers por socio y desglose. */
@Component({
  selector: 'vexa-commission',
  imports: [DecimalPipe, MatButtonModule, MatFormFieldModule, MatInputModule, PageHeader],
  template: `
    <vexa-page-header title="Configuración de comisiones y tarifas" />

    @if (data(); as d) {
    <div class="grid">
      <div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Comisión base por defecto</h3>
          <div class="rate">
            <strong>{{ d.baseRate }}%</strong>
            <button mat-stroked-button>Editar tasa base</button>
          </div>
          <p class="muted">Aplica a la tarifa de entrega estándar en todas las regiones.</p>
        </div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Tasas por nivel de socio</h3>
          @for (t of d.tiers; track t.name) {
            <div class="tier">
              <div>
                <strong>{{ t.name }}</strong>
                <small>{{ t.desc }}</small>
              </div>
              <strong class="tier__rate">{{ t.rate }}</strong>
            </div>
          }
        </div>
      </div>

      <div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Modificación masiva de tarifas</h3>
          <div class="bulk">
            <mat-form-field><mat-label>Tasa objetivo (%)</mat-label><input matInput value="13.5" /></mat-form-field>
            <button mat-flat-button>Aplicar cambios</button>
          </div>
          <p class="muted">Aplica la tasa seleccionada a todas las empresas elegibles.</p>
        </div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Desglose de comisiones</h3>
          <div class="donut">{{ totalPct() }}%</div>
          <ul class="kv">
            @for (b of d.breakdown; track b.label) {
              <li><span>{{ b.label }}</span><strong>{{ b.value | number:'1.0-0' }}</strong></li>
            }
          </ul>
        </div>
      </div>
    </div>
    }
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 1000px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    .block { padding: 20px; margin-bottom: 16px; }
    .rate { display: flex; align-items: center; gap: 16px; margin: 8px 0; }
    .rate strong { font-size: 36px; font-weight: 800; }
    .muted { color: var(--vexa-gray-500); font-size: 13px; }
    .tier { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--vexa-gray-100); }
    .tier small { display: block; color: var(--vexa-gray-500); }
    .tier__rate { color: var(--vexa-primary-700); }
    .bulk { display: flex; gap: 12px; align-items: center; }
    .donut {
      width: 90px; height: 90px; border-radius: 50%; margin: 8px auto;
      background: conic-gradient(var(--vexa-primary-600) 0 88%, var(--vexa-gray-100) 88% 100%);
      display: grid; place-items: center; font-weight: 800; color: var(--vexa-primary-700);
      position: relative;
    }
    .kv { list-style: none; padding: 0; margin: 8px 0 0; }
    .kv li { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .kv span { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Commission {
  private readonly api = inject(ApiService);
  protected readonly data = signal<{ baseRate: number; tiers: { name: string; desc: string; rate: string }[]; breakdown: { label: string; value: number }[] } | null>(null);
  protected readonly totalPct = () => {
    const b = this.data()?.breakdown ?? [];
    const total = b.reduce((acc, x) => acc + x.value, 0);
    return total > 0 ? Math.round((b[0]?.value ?? 0) / total * 100) : 0;
  };

  constructor() {
    this.api.get<{ baseRate: number; tiers: { name: string; desc: string; rate: string }[]; breakdown: { label: string; value: number }[] }>('admin/commissions')
      .subscribe((d) => this.data.set(d));
  }
}
