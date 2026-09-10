import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';

/** Figma: web-company-wallet */
@Component({
  selector: 'vexa-wallet',
  imports: [DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="top-grid">
      <div class="balance-card">
        <span class="balance-card__label">Gastado en envíos</span>
        <strong class="balance-card__value">\${{ wallet()?.spent ?? 0 | number: '1.2-2' }}</strong>
        <div class="balance-card__actions">
          <button type="button" class="btn btn--white">Recargar saldo</button>
          <a routerLink="/wallet/methods" class="btn btn--ghost">Métodos de pago</a>
        </div>
      </div>

      <div class="vexa-card summary-card">
        <span class="summary-card__title">Resumen del mes</span>
        <div class="summary-card__metrics">
          <div class="metric">
            <span class="metric__label">Pendiente</span>
            <strong class="metric__value">\${{ wallet()?.pending ?? 0 | number: '1.2-2' }}</strong>
          </div>
          <div class="metric">
            <span class="metric__label">Reembolsado</span>
            <strong class="metric__value">\${{ wallet()?.refunded ?? 0 | number: '1.2-2' }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="vexa-card transactions-card">
      <h2 class="vexa-h5">Historial de transacciones</h2>
      <div class="table">
        <div class="table-header">
          <span class="col col--date">Fecha</span>
          <span class="col col--desc">Descripción</span>
          <span class="col col--type">Tipo</span>
          <span class="col col--amount">Monto</span>
        </div>
        @for (tx of txs(); track tx.id) {
          <div class="row">
            <span class="col col--date">{{ tx.at | date: 'mediumDate' }}</span>
            <span class="col col--desc">{{ tx.title }}</span>
            <span class="col col--type">
              <span class="type-badge" [class.type-badge--credit]="tx.amount >= 0">
                {{ tx.amount >= 0 ? 'Crédito' : 'Débito' }}
              </span>
            </span>
            <span class="col col--amount" [class.col--amount-credit]="tx.amount >= 0">
              {{ tx.amount >= 0 ? '+' : '-' }}\${{ (tx.amount < 0 ? -tx.amount : tx.amount) | number: '1.2-2' }}
            </span>
          </div>
        } @empty {
          <p class="empty">Sin movimientos todavía.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; align-items: stretch; }
    @media (max-width: 800px) { .top-grid { grid-template-columns: 1fr; } }

    .balance-card {
      display: flex; flex-direction: column; gap: 20px; padding: 28px; border-radius: var(--vexa-radius-lg);
      background: linear-gradient(90deg, #1e3a8a, var(--vexa-primary-600)); color: #fff;
    }
    .balance-card__label { font-size: 14px; color: var(--vexa-primary-200); }
    .balance-card__value { font-size: 40px; font-weight: 700; }
    .balance-card__actions { display: flex; gap: 12px; }
    .btn { border: none; border-radius: var(--vexa-radius-sm); padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn--white { background: #fff; color: var(--vexa-primary-600); }
    .btn--ghost { background: rgba(255, 255, 255, 0.15); color: #fff; border: 1px solid rgba(255, 255, 255, 0.3); }

    .summary-card { display: flex; flex-direction: column; gap: 16px; justify-content: center; }
    .summary-card__title { font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); }
    .summary-card__metrics { display: flex; gap: 40px; }
    .metric { display: flex; flex-direction: column; gap: 4px; }
    .metric__label { font-size: 12px; color: var(--vexa-gray-400); }
    .metric__value { font-size: 24px; font-weight: 700; color: var(--vexa-gray-900); }

    .transactions-card { display: flex; flex-direction: column; gap: 20px; padding: 24px; }
    .table-header, .row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; }
    .table-header { background: var(--vexa-gray-50); font-size: 12px; font-weight: 700; color: var(--vexa-gray-600); border-radius: var(--vexa-radius-sm); }
    .row { border-bottom: 1px solid var(--vexa-gray-200); }
    .row:last-child { border-bottom: none; }
    .col--date { width: 140px; flex: none; color: var(--vexa-gray-600); font-size: 14px; }
    .col--desc { flex: 1 1 auto; min-width: 0; font-weight: 600; color: var(--vexa-gray-900); font-size: 14px; }
    .col--type { width: 100px; flex: none; }
    .type-badge { background: var(--vexa-gray-100); color: var(--vexa-gray-600); font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
    .type-badge--credit { background: var(--vexa-success-100); color: var(--vexa-success-700); }
    .col--amount { width: 120px; flex: none; text-align: right; font-weight: 600; color: var(--vexa-gray-900); }
    .col--amount-credit { color: var(--vexa-success-700); }
    .empty { padding: 16px; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wallet {
  protected readonly wallet = signal<{ spent: number; pending: number; refunded: number } | null>(null);
  protected readonly txs = signal<{ id: string; title: string; at: string; amount: number }[]>([]);

  constructor() {
    const api = inject(ApiService);
    api
      .get<{ spent: number; pending: number; refunded: number }>('companies/me/wallet')
      .subscribe((w) => this.wallet.set(w));
    api
      .get<{ id: string; title: string; at: string; amount: number }[]>('companies/me/transactions')
      .subscribe((t) => this.txs.set(t));
  }
}
