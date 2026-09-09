import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LineChart, PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface AdminAnalytics {
  users: number;
  companies: number;
  couriers: number;
  jobs: number;
  activeDeliveries: number;
  delivered: number;
  revenue: number;
  disputesPending: number;
  volume: number[];
  utilization: number[];
  cohorts: { name: string; value: number }[];
  geo: { name: string; trips: string }[];
}

/** Figma: analytics-dashboard — volumen, utilización, cohortes y geografía. */
@Component({
  selector: 'vexa-analytics',
  imports: [CurrencyPipe, LineChart, PageHeader],
  template: `
    <vexa-page-header title="Analítica avanzada de la plataforma" />
    @if (stats(); as s) {
      <p class="totals">{{ s.users }} usuarios · {{ s.couriers }} repartidores ·
        {{ s.jobs }} pedidos · {{ s.delivered }} entregados ·
        {{ s.revenue | currency:'COP':'symbol-narrow':'1.0-0' }} facturado</p>
    }

    <div class="charts">
      <div class="vexa-card chart">
        <h3>Volumen de entregas</h3>
        <vexa-line-chart [values]="volume()" [fill]="true" />
      </div>
      <div class="vexa-card chart">
        <h3>Utilización de repartidores</h3>
        <vexa-line-chart [values]="utilization()" color="#0e9f6e" [fill]="true" />
      </div>
    </div>

    <div class="grid">
      <div class="vexa-card block">
        <h3 class="vexa-overline">Retención por cohorte (S1–S4)</h3>
        @for (c of cohorts(); track c.name) {
          <div class="cohort">
            <span>{{ c.name }}</span>
            <div class="cohort__bar"><i [style.width.%]="c.value"></i></div>
            <strong>{{ c.value }}% activo</strong>
          </div>
        }
      </div>
      <div class="vexa-card block">
        <h3 class="vexa-overline">Rendimiento geográfico</h3>
        @for (g of geo(); track g.name) {
          <div class="geo">
            <span>{{ g.name }}</span>
            <strong>{{ g.trips }}</strong>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    @media (max-width: 900px) { .charts { grid-template-columns: 1fr; } }
    .chart { padding: 20px; }
    .chart h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 1000px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .block { padding: 20px; }
    .cohort { display: grid; grid-template-columns: 130px 1fr 90px; gap: 12px; align-items: center; padding: 8px 0; font-size: 13px; }
    .cohort__bar { height: 6px; border-radius: 3px; background: var(--vexa-gray-100); }
    .cohort__bar i { display: block; height: 100%; border-radius: 3px; background: var(--vexa-primary-600); }
    .cohort strong { color: var(--vexa-success-700); font-size: 12px; text-align: right; }
    .geo { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); font-size: 14px; }
    .geo span { color: var(--vexa-gray-600); }
    .totals { margin: 0 0 16px; color: var(--vexa-gray-500); font-size: 13px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Analytics {
  protected readonly stats = signal<AdminAnalytics | null>(null);

  protected readonly volume = () => this.stats()?.volume ?? [320, 380, 350, 420, 460, 430, 510];
  protected readonly utilization = () => this.stats()?.utilization ?? [55, 62, 58, 70, 66, 74, 80];
  protected readonly cohorts = () => this.stats()?.cohorts ?? [
    { name: 'Cohorte base Ene', value: 64.5 },
    { name: 'Feb 2026 sign-ups', value: 78.1 },
    { name: 'Mar 2026 sign-ups', value: 52.6 },
  ];
  protected readonly geo = () => this.stats()?.geo ?? [
    { name: 'Bogotá — Premium Zone', trips: '14,890 viajes' },
    { name: 'Medellín — Metro', trips: '9,120 viajes' },
  ];

  constructor() {
    inject(ApiService).get<AdminAnalytics>('admin/analytics').subscribe((a) => this.stats.set(a));
  }
}
