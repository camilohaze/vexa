import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RatingStars, StatCard } from '@vexa/ui';
import { CourierPerformance, CourierReviews, CouriersService } from '../../core/couriers/couriers.service';

const STAR_LABELS = ['5 estrellas', '4 estrellas', '3 estrellas', '2 estrellas', '1 estrella'];

/** Figma: web-courier-performance */
@Component({
  selector: 'vexa-performance',
  imports: [DatePipe, MatIconModule, RatingStars, StatCard],
  template: `
    <div class="top-row">
      <div class="vexa-card rating-card">
        <h2 class="vexa-h5">Calificación general</h2>
        <div class="rating-card__center">
          <strong>{{ (reviews()?.average ?? 0).toFixed(2) }}</strong>
          <vexa-rating-stars [value]="reviews()?.average ?? 0" />
          <span class="muted">Basado en {{ reviews()?.total ?? 0 }} reseñas verificadas</span>
        </div>
      </div>

      <div class="vexa-card dist-card">
        <h2 class="vexa-h5">Distribución de calificaciones</h2>
        @for (label of starLabels; track label; let i = $index) {
          <div class="dist-row">
            <span class="dist-row__label">{{ label }}</span>
            <span class="dist-row__track">
              <span class="dist-row__fill" [style.width.%]="distPct(i)"></span>
            </span>
            <span class="dist-row__pct">{{ distPct(i) }}%</span>
          </div>
        }
      </div>
    </div>

    <section class="kpis">
      <vexa-stat-card label="Puntualidad" [value]="pct(performance()?.onTimeRate)" icon="schedule" tone="primary" />
      <vexa-stat-card label="Aceptación" [value]="pct(performance()?.acceptanceRate)" icon="check_circle" tone="success" />
      <vexa-stat-card label="Finalización" [value]="pct(performance()?.completionRate)" icon="inventory_2" tone="warning" />
      <vexa-stat-card label="Tiempo promedio" [value]="avgTimeLabel()" icon="near_me" tone="primary" />
    </section>

    <div class="vexa-card reviews-card">
      <h2 class="vexa-h5">Comentarios de clientes</h2>
      @for (r of reviews()?.comments ?? []; track r.id) {
        <div class="review-row">
          <div class="review-row__top">
            <strong>{{ r.author }}</strong>
            <vexa-rating-stars [value]="r.stars" />
          </div>
          <p>{{ r.text }}</p>
          <small class="muted">{{ r.when | date: 'medium' }}</small>
        </div>
      } @empty {
        <p class="muted">Aún no tienes reseñas.</p>
      }
    </div>
  `,
  styles: `
    .top-row { display: flex; gap: 24px; margin-bottom: 24px; align-items: stretch; }
    @media (max-width: 900px) { .top-row { flex-direction: column; } }
    .rating-card { width: 380px; flex: none; display: flex; flex-direction: column; gap: 20px; padding: 32px; }
    @media (max-width: 900px) { .rating-card { width: 100%; } }
    .rating-card__center { display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .rating-card__center strong { font-size: 56px; font-weight: 700; color: var(--vexa-gray-900); }
    .muted { color: var(--vexa-gray-500); font-size: 13px; }

    .dist-card { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 12px; padding: 24px; }
    .dist-row { display: flex; align-items: center; gap: 16px; }
    .dist-row__label { width: 90px; flex: none; font-size: 13px; color: var(--vexa-gray-600); }
    .dist-row__track { flex: 1 1 auto; height: 8px; border-radius: 4px; background: var(--vexa-gray-200); overflow: hidden; }
    .dist-row__fill { display: block; height: 100%; background: var(--vexa-warning-500); border-radius: 4px; }
    .dist-row__pct { width: 40px; flex: none; text-align: right; font-size: 13px; font-weight: 600; color: var(--vexa-gray-900); }

    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }

    .reviews-card { display: flex; flex-direction: column; gap: 16px; }
    .review-row { display: flex; flex-direction: column; gap: 6px; background: var(--vexa-gray-50); border-radius: var(--vexa-radius-md); padding: 16px; }
    .review-row__top { display: flex; align-items: center; justify-content: space-between; }
    .review-row p { margin: 0; font-size: 13px; color: var(--vexa-gray-600); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Performance {
  private readonly couriers = inject(CouriersService);
  protected readonly starLabels = STAR_LABELS;

  protected readonly performance = signal<CourierPerformance | null>(null);
  protected readonly reviews = signal<CourierReviews | null>(null);

  protected readonly avgTimeLabel = computed(() => {
    const m = this.performance()?.avgDeliveryMinutes;
    return m ? `${Math.round(m)} min` : '—';
  });

  constructor() {
    this.couriers.performance().subscribe((p) => this.performance.set(p));
    this.couriers.reviews().subscribe((r) => this.reviews.set(r));
  }

  protected pct(v?: number): string {
    return v != null ? `${(v * 100).toFixed(1)}%` : '—';
  }

  protected distPct(index: number): number {
    const r = this.reviews();
    if (!r || !r.total) return 0;
    return Math.round(((r.distribution[index] ?? 0) / r.total) * 100);
  }
}
