import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api/api.service';

interface PaymentMethod {
  id: string;
  methodType: 'card' | 'bank' | 'wallet';
  label: string;
  sub?: string | null;
  last4?: string | null;
  brand?: string | null;
  isDefault: boolean;
}

/** Figma: web-payment-methods */
@Component({
  selector: 'vexa-payment-methods',
  imports: [MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, FormsModule],
  template: `
    <div class="layout">
      <div class="vexa-card methods-card">
        <div class="methods-card__head">
          <h2 class="vexa-h5">Métodos guardados</h2>
        </div>
        @for (m of methods(); track m.id) {
          <div class="method-row" [class.method-row--default]="m.isDefault">
            <div class="method-row__badge"><mat-icon>{{ icon(m.methodType) }}</mat-icon></div>
            <div class="method-row__info">
              <div class="method-row__name">
                <strong>{{ m.label }}{{ m.last4 ? ' •••• ' + m.last4 : '' }}</strong>
                @if (m.isDefault) {
                  <span class="default-badge">PREDETERMINADO</span>
                }
              </div>
              @if (m.sub) {
                <span class="method-row__sub">{{ m.sub }}</span>
              }
            </div>
            <div class="method-row__actions">
              @if (!m.isDefault) {
                <button type="button" class="link" (click)="setDefault(m.id)">Predeterminar</button>
              }
              <button type="button" class="link link--danger" (click)="remove(m.id)">Eliminar</button>
            </div>
          </div>
        } @empty {
          <p class="empty">No tienes métodos de pago guardados.</p>
        }
      </div>

      <div class="vexa-card add-card">
        <h2 class="vexa-h5">Agregar método</h2>
        <form (ngSubmit)="add()" class="add-form">
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="newMethod.methodType" name="type">
              @for (t of types; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nombre / banco</mat-label>
            <input matInput [(ngModel)]="newMethod.label" name="label" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Detalle</mat-label>
            <input matInput [(ngModel)]="newMethod.sub" name="sub" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Últimos 4 dígitos</mat-label>
            <input matInput [(ngModel)]="newMethod.last4" name="last4" maxlength="4" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Marca / red</mat-label>
            <input matInput [(ngModel)]="newMethod.brand" name="brand" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="!newMethod.label">Agregar</button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .layout { display: flex; gap: 24px; align-items: flex-start; }
    @media (max-width: 900px) { .layout { flex-direction: column; } }
    .methods-card { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
    .add-card { width: 380px; flex: none; display: flex; flex-direction: column; gap: 16px; }
    @media (max-width: 900px) { .add-card { width: 100%; } }

    .method-row {
      display: flex; align-items: center; gap: 16px; padding: 20px;
      border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md);
    }
    .method-row--default { background: var(--vexa-primary-50); border-color: var(--vexa-primary-600); }
    .method-row__badge {
      width: 36px; height: 36px; border-radius: var(--vexa-radius-sm); flex: none;
      background: #fff; border: 1px solid var(--vexa-gray-200); display: grid; place-items: center;
      color: var(--vexa-gray-600);
    }
    .method-row__info { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .method-row__name { display: flex; align-items: center; gap: 8px; font-size: 15px; color: var(--vexa-gray-900); }
    .default-badge { background: var(--vexa-primary-100); color: var(--vexa-primary-700); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .method-row__sub { font-size: 13px; color: var(--vexa-gray-400); }
    .method-row__actions { display: flex; gap: 12px; flex: none; }
    .link { border: none; background: none; padding: 0; font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer; }
    .link--danger { color: var(--vexa-error-500); }
    .add-form { display: grid; gap: 12px; }
    .empty { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethods {
  private readonly api = inject(ApiService);
  protected readonly methods = signal<PaymentMethod[]>([]);
  protected readonly types: PaymentMethod['methodType'][] = ['card', 'bank', 'wallet'];
  protected newMethod: Partial<PaymentMethod> = { methodType: 'card' };

  constructor() {
    this.load();
  }

  private load() {
    this.api.get<PaymentMethod[]>('companies/me/payment-methods').subscribe((m) => this.methods.set(m));
  }

  icon(type: PaymentMethod['methodType']) {
    return type === 'bank' ? 'account_balance' : type === 'wallet' ? 'account_balance_wallet' : 'credit_card';
  }

  setDefault(id: string) {
    this.api.patch<void>(`companies/me/payment-methods/${id}/default`, {}).subscribe(() => this.load());
  }

  remove(id: string) {
    this.api
      .delete<void>(`companies/me/payment-methods/${id}`)
      .subscribe(() => this.methods.update((list) => list.filter((m) => m.id !== id)));
  }

  add() {
    const dto = this.newMethod as Omit<PaymentMethod, 'id'>;
    this.api.post<PaymentMethod>('companies/me/payment-methods', dto).subscribe(() => {
      this.newMethod = { methodType: 'card' };
      this.load();
    });
  }
}
