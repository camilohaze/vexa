import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { JobStatus, Payment } from '@vexa/shared';
import { PageHeader, StatusChip } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: payments-management — volumen, payouts, escrow, transacciones,
 * programación de pagos y reembolso manual. */
@Component({
  selector: 'vexa-payments-list',
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, PageHeader, StatusChip],
  template: `
    <vexa-page-header title="Operaciones financieras" />

    <section class="stats">
      <div class="stat vexa-card">
        <span>Volumen total de la plataforma</span>
        <strong>{{ volume() | number:'1.0-0':'es-CO' }} COP</strong>
        <small class="up">+14.3%</small>
      </div>
      <div class="stat vexa-card">
        <span>Pagos pendientes</span>
        <strong>{{ pending() | number:'1.0-0':'es-CO' }} COP</strong>
        <small class="muted">Próx. lote</small>
      </div>
      <div class="stat vexa-card">
        <span>Escrow retenido</span>
        <strong>250,000</strong>
        <small class="muted">Por liberar</small>
      </div>
    </section>

    <div class="grid">
      <div>
        <h3 class="vexa-overline">Transacciones de pago</h3>
        <table mat-table [dataSource]="payments()" class="full">
          <ng-container matColumnDef="reference">
            <th mat-header-cell *matHeaderCellDef>TXN ID</th>
            <td mat-cell *matCellDef="let p">#{{ (p.reference ?? p.id).slice(0, 10) }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let p">{{ p.provider === 'WOMPI' ? 'Pago' : 'Payout' }}</td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Monto</th>
            <td mat-cell *matCellDef="let p">{{ p.amount | number:'1.0-0' }} {{ p.currency }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p"><vexa-status-chip [status]="mapStatus(p.status)" /></td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let p">{{ p.createdAt | date:'short' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </div>

      <div class="side">
        <div class="vexa-card block">
          <h3 class="vexa-overline">Programador de pagos</h3>
          <p class="muted">Ciclo automático</p>
          <p><strong>Semanal (cada lunes)</strong></p>
          <button mat-stroked-button>Editar reglas de pago</button>
        </div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Procesador de reembolso manual</h3>
          <mat-form-field class="w-full">
            <mat-label>ID del pedido original (ej. VX-982)</mat-label>
            <input matInput #refundId />
          </mat-form-field>
          <mat-form-field class="w-full">
            <mat-label>Motivo del reembolso / ticket</mat-label>
            <input matInput />
          </mat-form-field>
          <button mat-flat-button color="warn" class="w-full"
              (click)="refund(refundId.value)">Ejecutar reembolso inmediato</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    @media (max-width: 900px) { .stats { grid-template-columns: 1fr; } }
    .stat { padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .stat span { font-size: 12px; color: var(--vexa-gray-500); }
    .stat strong { font-size: 26px; font-weight: 800; }
    .up { color: var(--vexa-success-700); font-weight: 600; }
    .muted { color: var(--vexa-gray-500); }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    .full, .w-full { width: 100%; }
    .block { padding: 20px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .block p { margin: 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsList {
  protected readonly columns = ['reference', 'type', 'amount', 'status', 'createdAt'];
  protected readonly payments = signal<Payment[]>([]);

  protected readonly volume = computed(() =>
    this.payments().filter((p) => p.status === 'APPROVED')
      .reduce((acc, p) => acc + Number(p.amount || 0), 0) || 1842090,
  );
  protected readonly pending = computed(() =>
    this.payments().filter((p) => p.status === 'PENDING')
      .reduce((acc, p) => acc + Number(p.amount || 0), 0) || 42890,
  );

  constructor() {
    inject(ApiService).get<Payment[]>('payments').subscribe((p) => this.payments.set(p));
  }

  protected mapStatus(status: Payment['status']): JobStatus {
    if (status === 'APPROVED') return JobStatus.DELIVERED;
    if (status === 'DECLINED' || status === 'ERROR') return JobStatus.CANCELLED;
    return JobStatus.PENDING;
  }

  private readonly api = inject(ApiService);
  protected readonly lastRefund = signal<string | null>(null);

  protected refund(id: string) {
    this.api.post<Payment>(`admin/payments/${id}/refund`).subscribe({
      next: () => {
        this.lastRefund.set(id);
        this.payments.update((list) =>
          list.map((p) => (p.id === id ? { ...p, status: 'REFUNDED' as Payment['status'] } : p)),
        );
      },
      error: () => undefined,
    });
  }
}
