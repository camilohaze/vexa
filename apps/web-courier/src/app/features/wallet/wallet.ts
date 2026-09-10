import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CourierEarnings, CourierTransaction, CouriersService, Payout, PayoutMethod } from '../../core/couriers/couriers.service';

interface LedgerRow {
  id: string;
  at: string;
  title: string;
  amount: number;
  statusLabel?: string;
}

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'En proceso',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
};

/** Figma: web-courier-wallet */
@Component({
  selector: 'vexa-courier-wallet',
  imports: [DatePipe, DecimalPipe, FormsModule, MatIconModule],
  template: `
    <div class="top-row">
      <div class="balance-card">
        <span class="balance-card__label">GANADO ESTE MES</span>
        <strong class="balance-card__value">\${{ earnings()?.month ?? 0 | number: '1.2-2' }}</strong>
        <div class="balance-card__note">
          <mat-icon>check_circle</mat-icon>
          <span>{{ earnings()?.completed ?? 0 }} entregas completadas este período.</span>
        </div>
      </div>

      <div class="vexa-card withdraw-card">
        <h2 class="vexa-h5">Solicitar retiro</h2>
        <label class="field">
          <span>Monto (USD)</span>
          <input type="number" [(ngModel)]="amount" min="1" />
        </label>
        <label class="field">
          <span>Método</span>
          <select [(ngModel)]="method">
            @for (m of methods(); track m.key) {
              <option [value]="m.key">{{ m.label }} — {{ m.detail }}</option>
            }
          </select>
        </label>
        <button type="button" class="withdraw-btn" [disabled]="!amount || requesting()" (click)="withdraw()">
          <mat-icon>north_east</mat-icon>
          {{ requesting() ? 'Enviando…' : 'Solicitar retiro' }}
        </button>
      </div>
    </div>

    <div class="vexa-card ledger-card">
      <h2 class="vexa-h5">Historial de pagos</h2>
      <div class="table-header">
        <span class="col col--date">Fecha</span>
        <span class="col col--desc">Descripción</span>
        <span class="col col--amount">Monto</span>
      </div>
      @for (row of ledgerRows(); track row.id) {
        <div class="row">
          <span class="col col--date">{{ row.at | date: 'mediumDate' }}</span>
          <span class="col col--desc">
            {{ row.title }}
            @if (row.statusLabel) { <span class="status-tag">{{ row.statusLabel }}</span> }
          </span>
          <span class="col col--amount" [class.col--amount--negative]="row.amount < 0">
            {{ row.amount < 0 ? '-' : '+' }}\${{ (row.amount < 0 ? -row.amount : row.amount) | number: '1.2-2' }}
          </span>
        </div>
      } @empty {
        <p class="empty">Aún no tienes pagos registrados.</p>
      }
    </div>
  `,
  styles: `
    .top-row { display: flex; gap: 24px; align-items: stretch; margin-bottom: 24px; }
    @media (max-width: 900px) { .top-row { flex-direction: column; } }
    .balance-card {
      flex: 1 1 auto; display: flex; flex-direction: column; gap: 24px; padding: 32px;
      background: var(--vexa-sidebar-bg); color: #fff; border-radius: var(--vexa-radius-lg);
    }
    .balance-card__label { font-size: 14px; font-weight: 600; color: var(--vexa-sidebar-muted); }
    .balance-card__value { font-size: 48px; font-weight: 700; }
    .balance-card__note { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--vexa-sidebar-muted);
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--vexa-success-500); }
    }
    .withdraw-card { width: 380px; flex: none; display: flex; flex-direction: column; gap: 16px; padding: 32px; }
    @media (max-width: 900px) { .withdraw-card { width: 100%; } }
    .field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--vexa-gray-600); }
    .field input, .field select { padding: 10px 12px; border-radius: var(--vexa-radius-sm); border: 1px solid var(--vexa-gray-200); font: inherit; font-size: 14px; color: var(--vexa-gray-900); }
    .withdraw-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--vexa-primary-600); color: #fff; border: none; border-radius: var(--vexa-radius-sm);
      padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .ledger-card { display: flex; flex-direction: column; gap: 8px; }
    .table-header, .row { display: flex; align-items: center; gap: 12px; padding: 14px 4px; border-bottom: 1px solid var(--vexa-gray-200); }
    .row:last-child { border-bottom: none; }
    .table-header { font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); }
    .col--date { width: 140px; flex: none; font-size: 13px; color: var(--vexa-gray-600); }
    .col--desc { flex: 1 1 auto; min-width: 0; font-size: 14px; font-weight: 600; color: var(--vexa-gray-900); }
    .col--amount { width: 100px; flex: none; text-align: right; font-weight: 700; color: var(--vexa-success-600); }
    .col--amount--negative { color: var(--vexa-gray-700); }
    .status-tag {
      margin-left: 8px; font-size: 11px; font-weight: 600; color: var(--vexa-gray-500);
      background: var(--vexa-gray-100); padding: 2px 8px; border-radius: 6px;
    }
    .empty { color: var(--vexa-gray-500); padding: 8px 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wallet {
  private readonly couriers = inject(CouriersService);
  private readonly snack = inject(MatSnackBar);

  protected readonly earnings = signal<CourierEarnings | null>(null);
  protected readonly transactions = signal<CourierTransaction[]>([]);
  protected readonly payouts = signal<Payout[]>([]);
  protected readonly methods = signal<PayoutMethod[]>([]);
  protected readonly requesting = signal(false);

  protected amount: number | null = null;
  protected method = '';

  protected readonly ledgerRows = computed<LedgerRow[]>(() => {
    const earned = this.transactions().map((tx) => ({ id: tx.id, at: tx.at, title: tx.title, amount: tx.amount }));
    const withdrawn = this.payouts().map((p) => ({
      id: p.id,
      at: p.createdAt,
      title: `Retiro — ${p.method}`,
      amount: -p.amount,
      statusLabel: PAYOUT_STATUS_LABEL[p.status] ?? p.status,
    }));
    return [...earned, ...withdrawn].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  });

  constructor() {
    this.couriers.earnings().subscribe((e) => this.earnings.set(e));
    this.couriers.transactions().subscribe((t) => this.transactions.set(t));
    this.loadPayouts();
    this.couriers.payoutMethods().subscribe((m) => {
      this.methods.set(m);
      if (m.length) this.method = m[0].key;
    });
  }

  private loadPayouts() {
    this.couriers.payouts().subscribe((p) => this.payouts.set(p));
  }

  withdraw() {
    if (!this.amount || !this.method) return;
    this.requesting.set(true);
    this.couriers.requestPayout(this.amount, this.method).subscribe({
      next: () => {
        this.requesting.set(false);
        this.amount = null;
        this.snack.open('Retiro solicitado', undefined, { duration: 2500 });
        this.loadPayouts();
      },
      error: () => {
        this.requesting.set(false);
        this.snack.open('No se pudo procesar el retiro', undefined, { duration: 2500 });
      },
    });
  }
}
