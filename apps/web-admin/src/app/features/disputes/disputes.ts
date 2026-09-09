import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface Dispute {
  id: string;
  subject: string;
  detail?: string | null;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

/** Figma: disputes-center — log de disputas + panel de ticket con evidencia. */
@Component({
  selector: 'vexa-disputes',
  imports: [DatePipe, MatButtonModule, MatButtonToggleModule, MatIconModule, MatSelectModule, PageHeader],
  template: `
    <vexa-page-header title="Gestión de disputas" />

    <mat-button-toggle-group [value]="tab()" (change)="tab.set($event.value)">
      <mat-button-toggle value="all">Todas ({{ counts().all }})</mat-button-toggle>
      <mat-button-toggle value="review">En revisión ({{ counts().review }})</mat-button-toggle>
      <mat-button-toggle value="resolved">Resueltas ({{ counts().resolved }})</mat-button-toggle>
      <mat-button-toggle value="escalated">Escaladas ({{ counts().escalated }})</mat-button-toggle>
    </mat-button-toggle-group>

    <div class="grid">
      <div class="vexa-card">
        <div class="log-head">
          <h3 class="vexa-overline">Log de disputas activas</h3>
          <mat-select value="newest" class="sort">
            <mat-option value="newest">Más recientes</mat-option>
          </mat-select>
        </div>
        @for (d of disputes(); track d.id) {
          <button type="button" class="row" [class.row--on]="current() === d.id" (click)="current.set(d.id)">
            <div>
              <strong>DIS-{{ d.id.slice(0, 6).toUpperCase() }}</strong>
              <small>{{ d.subject }}</small>
            </div>
            <span class="vexa-pill" [class.vexa-pill--error]="d.priority === 'HIGH'"
                [class.vexa-pill--warning]="d.priority === 'MEDIUM'">{{ d.priority }}</span>
            <span class="vexa-pill vexa-pill--info">{{ d.status }}</span>
          </button>
        } @empty {
          <p class="muted" style="padding:16px">Sin disputas registradas.</p>
        }
      </div>

      @if (selectedDispute(); as d) {
        <div class="vexa-card ticket">
          <div class="ticket__head">
            <h3>Ticket #DIS-{{ d.id.slice(0, 6).toUpperCase() }}</h3>
            <button mat-stroked-button (click)="resolve(d.id, 'IN_REVIEW')">Asignármelo</button>
          </div>
          <p class="muted">{{ d.detail ?? d.subject }}</p>
          <h4 class="vexa-overline">Timeline de la disputa</h4>
          <ul class="tl">
            <li><mat-icon>flag</mat-icon> Disputa abierta — {{ d.createdAt | date:'short' }}</li>
            <li><mat-icon>assignment_ind</mat-icon> Estado actual: {{ d.status }}</li>
          </ul>
          <button mat-flat-button color="primary" class="resolve"
              (click)="resolve(d.id, 'RESOLVED')">Resolver y reembolsar al cliente</button>
          <button mat-stroked-button color="warn" (click)="resolve(d.id, 'ESCALATED')">Escalar</button>
        </div>
      } @else {
        <div class="vexa-card ticket"><p class="muted">Selecciona una disputa para ver el detalle.</p></div>
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; margin-top: 16px; align-items: start; }
    @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
    .log-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 16px 0; }
    .sort { width: 150px; font-size: 12px; }
    .row {
      display: grid; grid-template-columns: 1fr auto auto auto; gap: 12px; align-items: center;
      width: 100%; padding: 14px 16px; background: none; border: 0; border-top: 1px solid var(--vexa-gray-100);
      cursor: pointer; font: inherit; text-align: left;
      small { display: block; color: var(--vexa-gray-500); }
    }
    .row--on { background: var(--vexa-primary-50); }
    .ticket { padding: 20px; display: flex; flex-direction: column; gap: 10px; }
    .ticket__head { display: flex; justify-content: space-between; align-items: center; }
    .ticket__head h3 { margin: 0; }
    .muted { color: var(--vexa-gray-600); font-size: 13px; margin: 0; }
    .tl { list-style: none; padding: 0; margin: 0; }
    .tl li { display: flex; gap: 8px; align-items: center; padding: 6px 0; font-size: 13px; }
    .tl mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--vexa-primary-600); }
    .evidence { display: flex; gap: 8px; }
    .evidence__ph { width: 90px; height: 70px; border-radius: 10px; background: var(--vexa-gray-100); display: grid; place-items: center; color: var(--vexa-gray-400); }
    .resolve { margin-top: 4px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Disputes {
  private readonly api = inject(ApiService);
  protected readonly tab = signal('all');
  protected readonly current = signal<string | null>(null);
  protected readonly selectedDispute = () =>
    this.disputes().find((d) => d.id === this.current()) ?? null;

  protected readonly disputes = signal<Dispute[]>([]);

  protected readonly counts = computed(() => {
    const d = this.disputes();
    return {
      all: d.length,
      review: d.filter((x) => x.status === 'OPEN' || x.status === 'IN_REVIEW').length,
      resolved: d.filter((x) => x.status === 'RESOLVED').length,
      escalated: d.filter((x) => x.status === 'ESCALATED').length,
    };
  });

  constructor() {
    this.api.get<Dispute[]>('admin/disputes').subscribe((d) => {
      this.disputes.set(d);
      if (d.length) this.current.set(d[0].id);
    });
  }

  resolve(id: string, status: Dispute['status']) {
    this.api.patch<Dispute>(`admin/disputes/${id}`, { status }).subscribe((updated) =>
      this.disputes.update((list) => list.map((d) => (d.id === id ? updated : d))),
    );
  }
}
