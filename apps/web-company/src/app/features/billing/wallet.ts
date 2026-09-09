import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: company-wallet — saldo, retirar/transferir, transacciones. */
@Component({
  selector: 'vexa-wallet',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatIconModule, PageHeader, RouterLink],
  template: `
    <vexa-page-header title="Billetera Vexa">
      <a mat-button actions routerLink="/wallet/methods">Métodos de pago</a>
    </vexa-page-header>

    <div class="wallet">
      <div class="balance vexa-card">
        <span class="vexa-overline">Gastado en envíos</span>
        <strong class="balance__value">{{ wallet()?.spent ?? 0 | number:'1.2-2':'es-CO' }} COP</strong>
        <small>Pendiente: {{ wallet()?.pending ?? 0 | number:'1.2-2':'es-CO' }} ·
          Reembolsado: {{ wallet()?.refunded ?? 0 | number:'1.2-2':'es-CO' }}</small>
        <div class="balance__actions">
          <button mat-flat-button>Recargar</button>
          <button mat-stroked-button>Transferir</button>
        </div>
      </div>

      <div class="vexa-card">
        <h3 class="vexa-overline">Transacciones recientes</h3>
        @for (tx of txs(); track tx.id) {
          <div class="tx">
            <span class="tx__icon" [class.tx__icon--neg]="tx.amount < 0">
              <mat-icon>{{ tx.amount >= 0 ? 'south_west' : 'north_east' }}</mat-icon>
            </span>
            <div class="tx__body">
              <strong>{{ tx.title }}</strong>
              <small>{{ tx.at | date:'medium':'':'es-CO' }}</small>
            </div>
            <strong [class.neg]="tx.amount < 0" class="tx__amount">
              {{ tx.amount >= 0 ? '+' : '-' }}{{ (tx.amount < 0 ? -tx.amount : tx.amount) | number:'1.2-2':'es-CO' }}
            </strong>
          </div>
        } @empty {
          <p style="padding:16px;color:var(--vexa-gray-500)">Sin movimientos todavía.</p>
        }
      </div>
    </div>
  `,
  styles: `
    .wallet { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; align-items: start; max-width: 900px; }
    @media (max-width: 800px) { .wallet { grid-template-columns: 1fr; } }
    .balance {
      padding: 24px; background: linear-gradient(135deg, var(--vexa-primary-600), var(--vexa-primary-800));
      border: 0; color: #fff; display: flex; flex-direction: column; gap: 8px;
      .vexa-overline { color: rgba(255,255,255,.7); }
    }
    .balance__value { font-size: 36px; font-weight: 800; }
    .balance__actions { display: flex; gap: 8px; margin-top: 8px; }
    .balance__actions button { flex: 1; }
    .tx { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
    .tx__icon {
      width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
      background: var(--vexa-success-100); color: var(--vexa-success-700);
    }
    .tx__icon--neg { background: var(--vexa-error-100); color: var(--vexa-error-700); }
    .tx__body { flex: 1; display: flex; flex-direction: column; }
    .tx__body small { color: var(--vexa-gray-500); }
    .tx__amount { color: var(--vexa-success-700); }
    .tx__amount.neg { color: var(--vexa-gray-900); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Wallet {
  protected readonly wallet = signal<{ spent: number; pending: number; refunded: number } | null>(null);
  protected readonly txs = signal<{ id: string; title: string; at: string; amount: number }[]>([]);

  constructor() {
    const api = inject(ApiService);
    api.get<{ spent: number; pending: number; refunded: number }>('companies/me/wallet')
      .subscribe((w) => this.wallet.set(w));
    api.get<{ id: string; title: string; at: string; amount: number }[]>('companies/me/transactions')
      .subscribe((t) => this.txs.set(t));
  }
}
