import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PageHeader, RatingStars } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: courier-profile-view — perfil público del repartidor. */
@Component({
  selector: 'vexa-courier-profile',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatIconModule, PageHeader, RatingStars],
  template: `
    <vexa-page-header title="Perfil del repartidor" />
    @if (courier(); as c) {
      <div class="profile">
        <mat-card class="main vexa-card">
          <div class="head">
            <div class="avatar"><mat-icon>person</mat-icon></div>
            <div>
              <h2 class="vexa-h4">{{ c.name }}</h2>
              <p class="muted">Socio Vexa</p>
              <div class="badges">
                <span class="vexa-pill vexa-pill--success">ID verificado</span>
                <span class="vexa-pill vexa-pill--info">Asegurado</span>
              </div>
            </div>
            <div class="rating">
              <vexa-rating-stars [value]="c.rating" />
              <strong>{{ c.rating.toFixed(1) }}</strong>
              <small class="muted">({{ c.totalJobs }} entregas)</small>
            </div>
          </div>
          <div class="stats">
            <div><strong>{{ c.totalJobs }}</strong><small>Entregas</small></div>
            <div><strong>{{ (c.onTimeRate * 100).toFixed(1) }}%</strong><small>Puntualidad</small></div>
            <div><strong>{{ (c.acceptanceRate * 100).toFixed(1) }}%</strong><small>Aceptación</small></div>
          </div>
          <button mat-flat-button>Asignar entrega</button>
        </mat-card>

        <div class="reviews vexa-card">
          <h3 class="vexa-overline">Reseñas recientes</h3>
          @for (r of reviews(); track r.id) {
            <div class="review">
              <div class="review__head">
                <strong>{{ r.author }}</strong>
                <vexa-rating-stars [value]="r.stars" />
              </div>
              <small class="muted">{{ r.when | date:'medium' }}</small>
              <p>{{ r.text }}</p>
            </div>
          } @empty {
            <p class="muted">Sin reseñas todavía.</p>
          }
        </div>
      </div>
    } @else {
      <p style="padding:20px;color:var(--vexa-gray-500)">Cargando perfil…</p>
    }
  `,
  styles: `
    .profile { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 900px) { .profile { grid-template-columns: 1fr; } }
    .main { padding: 24px; }
    .head { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--vexa-primary-100); display: grid; place-items: center; mat-icon { font-size: 36px; width: 36px; height: 36px; color: var(--vexa-primary-700); } }
    .badges { display: flex; gap: 6px; margin-top: 6px; }
    .rating { margin-left: auto; text-align: right; display: flex; flex-direction: column; gap: 2px; }
    .stats { display: flex; gap: 24px; margin: 20px 0; }
    .stats div { display: flex; flex-direction: column; }
    .stats strong { font-size: 20px; }
    .stats small { color: var(--vexa-gray-500); }
    .muted { color: var(--vexa-gray-500); margin: 0; }
    .reviews { padding: 20px; }
    .review { padding: 12px 0; border-bottom: 1px solid var(--vexa-gray-100); }
    .review:last-child { border: 0; }
    .review__head { display: flex; justify-content: space-between; }
    .review p { margin: 4px 0 0; font-size: 13px; color: var(--vexa-gray-700); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourierProfile implements OnInit {
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  protected readonly courier = signal<{ name: string; rating: number; totalJobs: number; onTimeRate: number; acceptanceRate: number } | null>(null);
  protected readonly reviews = signal<{ id: string; author: string; when: string; stars: number; text: string }[]>([]);

  ngOnInit() {
    this.api.get<{ name: string; rating: number; totalJobs: number; onTimeRate: number; acceptanceRate: number }>(`couriers/${this.id()}/profile`)
      .subscribe((c) => this.courier.set(c));
    this.api.get<{ id: string; author: string; when: string; stars: number; text: string }[]>(`couriers/${this.id()}/reviews`)
      .subscribe((r) => this.reviews.set(r));
  }
}
