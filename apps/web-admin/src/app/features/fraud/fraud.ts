import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface FraudFlags {
  lowRatedCouriers: { courierId: string; rating: number; ratingsCount: number; reason: string }[];
  highCancellationCouriers: { courierId: string; cancellations: number; reason: string }[];
}

/** Figma: fraud-detection — anomalías, cuentas de riesgo y reglas automáticas. */
@Component({
  selector: 'vexa-fraud',
  imports: [MatIconModule, MatSlideToggleModule, PageHeader],
  template: `
    <vexa-page-header title="Monitoreo de seguridad y fraude" />

    <section class="stats">
      <div class="stat vexa-card">
        <span>Anomalías detectadas</span>
        <strong>{{ flagged().length }}</strong>
        <small class="warn">Críticas: 4</small>
      </div>
      <div class="stat vexa-card">
        <span>Tasa de falsos positivos</span>
        <strong>0.82%</strong>
        <small class="ok">Objetivo &lt;1%</small>
      </div>
      <div class="stat vexa-card">
        <span>Score promedio de riesgo</span>
        <strong>14 / 100</strong>
        <small class="ok">Zona segura</small>
      </div>
    </section>

    <div class="grid">
      <div class="vexa-card block">
        <h3 class="vexa-overline">Cuentas de alto riesgo pendientes</h3>
        <table class="tbl">
          <tr><th>ID</th><th>Riesgo</th><th>Motivo del trigger</th><th>Acción</th></tr>
          @for (a of flagged(); track a.id) {
            <tr>
              <td>#{{ a.id }}</td>
              <td><span class="vexa-pill" [class.vexa-pill--error]="a.level === 'ALTA'" [class.vexa-pill--warning]="a.level === 'MEDIA'">{{ a.level }}</span></td>
              <td>{{ a.reason }}</td>
              <td><button class="link">Revisar</button></td>
            </tr>
          }
        </table>
      </div>
      <div class="vexa-card block">
        <h3 class="vexa-overline">Reglas de acción automática</h3>
        @for (r of rules; track r.name) {
          <div class="rule">
            <div>
              <strong>{{ r.name }}</strong>
              <small>{{ r.desc }}</small>
            </div>
            <mat-slide-toggle [checked]="r.on" />
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    @media (max-width: 800px) { .stats { grid-template-columns: 1fr; } }
    .stat { padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .stat span { font-size: 12px; color: var(--vexa-gray-500); }
    .stat strong { font-size: 28px; font-weight: 800; }
    .warn { color: var(--vexa-error-600); font-weight: 600; }
    .ok { color: var(--vexa-success-700); font-weight: 600; }
    .grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    .block { padding: 20px; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
    .tbl th { text-align: left; color: var(--vexa-gray-500); font-weight: 600; font-size: 11px; padding: 8px 0; }
    .tbl td { padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); }
    .link { background: none; border: 0; color: var(--vexa-primary-600); cursor: pointer; font-size: 13px; }
    .rule { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid var(--vexa-gray-100); }
    .rule small { display: block; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Fraud {
  protected readonly flagged = signal<{ id: string; level: string; reason: string }[]>([]);
  protected readonly rules = [
    { name: 'Bloqueo instantáneo + score > 90', desc: 'Congela la cuenta al superar el umbral', on: true },
    { name: 'Solo foto de POD duplicada', desc: 'Requiere revisión humana si coincide', on: true },
    { name: 'Login multi-dispositivo', desc: 'Requiere verificación extra por email', on: false },
  ];

  constructor() {
    inject(ApiService).get<FraudFlags>('admin/fraud').subscribe((f) =>
      this.flagged.set([
        ...f.lowRatedCouriers.map((c) => ({
          id: `ACC-${c.courierId.slice(0, 6)}`,
          level: 'ALTA',
          reason: `${c.reason} (${c.rating.toFixed(1)}★ en ${c.ratingsCount} reseñas)`,
        })),
        ...f.highCancellationCouriers.map((c) => ({
          id: `ACC-${c.courierId.slice(0, 6)}`,
          level: 'MEDIA',
          reason: `${c.reason} (${c.cancellations} pedidos cancelados)`,
        })),
      ]),
    );
  }
}
