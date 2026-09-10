import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourierEarnings, CouriersService } from '../../core/couriers/couriers.service';

type Period = 'today' | 'week' | 'month';
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** Figma: web-courier-earnings */
@Component({
  selector: 'vexa-earnings',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="period-tabs">
      @for (p of periods; track p.value) {
        <button
          type="button"
          class="period-tabs__item"
          [class.period-tabs__item--active]="period() === p.value"
          (click)="period.set(p.value)"
        >
          {{ p.label }}
        </button>
      }
    </div>

    <div class="vexa-card headline-card">
      <div class="headline-card__left">
        <span class="vexa-overline">Total {{ periodLabel() }}</span>
        <strong class="headline-card__value">\${{ periodValue() | number: '1.2-2':'es-CO' }}</strong>
        <a routerLink="/wallet" class="withdraw-btn">Retirar fondos</a>
      </div>
      <div class="headline-card__meta">
        <div class="meta-row">
          <span>Promedio por entrega</span>
          <strong>\${{ avgPerJob() | number: '1.2-2':'es-CO' }}</strong>
        </div>
        <hr />
        <div class="meta-row">
          <span>Calificación activa</span>
          <strong>{{ (earnings()?.rating ?? 0).toFixed(2) }} / 5.0</strong>
        </div>
      </div>
    </div>

    <div class="vexa-card chart-card">
      <h2 class="vexa-h5">Tendencia de ganancias (últimos 7 días)</h2>
      <div class="bars">
        @for (v of earnings()?.dailyBars ?? []; track $index) {
          <div class="bar-col">
            <span class="bar-col__value">{{ (v * 100).toFixed(0) }}%</span>
            <div class="bar-col__fill" [style.height.px]="v * 140"></div>
            <span class="bar-col__label">{{ dayLabels[$index] }}</span>
          </div>
        }
      </div>
    </div>

    <div class="vexa-card breakdown-card">
      <h2 class="vexa-h5">Ganancias por categoría</h2>
      @for (row of earnings()?.breakdown ?? []; track row[0]) {
        <div class="breakdown-row">
          <div>
            <strong>{{ row[0] }}</strong>
            <span class="breakdown-row__count">{{ row[2] }} entregas</span>
          </div>
          <strong>\${{ row[1] | number: '1.2-2':'es-CO' }}</strong>
        </div>
      } @empty {
        <p class="empty">Aún no hay ganancias registradas.</p>
      }
    </div>
  `,
  styles: `
    .period-tabs { display: flex; gap: 4px; padding: 4px; background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md); width: fit-content; margin-bottom: 24px; }
    .period-tabs__item { border: 0; background: transparent; padding: 8px 16px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer; }
    .period-tabs__item--active { background: var(--vexa-sidebar-active); color: #fff; }

    .headline-card { display: flex; gap: 48px; padding: 32px; margin-bottom: 24px; }
    .headline-card__left { display: flex; flex-direction: column; gap: 16px; flex: 1 1 auto; }
    .headline-card__value { font-size: 48px; font-weight: 700; color: var(--vexa-gray-900); }
    .withdraw-btn {
      width: fit-content; background: var(--vexa-primary-600); color: #fff; text-decoration: none;
      padding: 12px 24px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600;
    }
    .headline-card__meta { width: 300px; flex: none; display: flex; flex-direction: column; gap: 16px; }
    .meta-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; color: var(--vexa-gray-600); }
    .meta-row strong { color: var(--vexa-gray-900); font-size: 16px; }
    .headline-card__meta hr { border: none; border-top: 1px solid var(--vexa-gray-200); margin: 0; }

    .chart-card { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
    .bars { display: flex; align-items: flex-end; justify-content: space-between; height: 180px; }
    .bar-col { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 80px; }
    .bar-col__value { font-size: 11px; color: var(--vexa-gray-400); }
    .bar-col__fill { width: 32px; background: var(--vexa-primary-600); border-radius: 6px 6px 0 0; min-height: 2px; }
    .bar-col__label { font-size: 13px; color: var(--vexa-gray-600); }

    .breakdown-card { display: flex; flex-direction: column; gap: 8px; }
    .breakdown-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--vexa-gray-200); }
    .breakdown-row:last-child { border-bottom: none; }
    .breakdown-row div { display: flex; flex-direction: column; gap: 2px; }
    .breakdown-row strong { color: var(--vexa-gray-900); font-size: 14px; }
    .breakdown-row__count { font-size: 12px; color: var(--vexa-gray-400); }
    .empty { color: var(--vexa-gray-500); padding: 8px 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Earnings {
  private readonly couriers = inject(CouriersService);
  protected readonly dayLabels = DAY_LABELS;

  protected readonly periods: { value: Period; label: string }[] = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
  ];
  protected readonly period = signal<Period>('week');
  protected readonly periodLabel = computed(
    () => this.periods.find((p) => p.value === this.period())?.label.toLowerCase() ?? ''
  );

  protected readonly earnings = signal<CourierEarnings | null>(null);
  protected readonly periodValue = computed(() => {
    const e = this.earnings();
    if (!e) return 0;
    return this.period() === 'today' ? e.today : this.period() === 'week' ? e.week : e.month;
  });
  protected readonly avgPerJob = computed(() => {
    const e = this.earnings();
    return e && e.completed > 0 ? e.week / e.completed : 0;
  });

  constructor() {
    this.couriers.earnings().subscribe((e) => this.earnings.set(e));
  }
}
