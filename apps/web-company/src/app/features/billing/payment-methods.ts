import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PageHeader } from '@vexa/ui';
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

/** Figma: payment-methods — métodos guardados + agregar. */
@Component({
  selector: 'vexa-payment-methods',
  imports: [MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, FormsModule, PageHeader],
  template: `
    <vexa-page-header title="Métodos de pago" />
    <div class="methods vexa-card">
      <h3 class="vexa-overline">Métodos guardados</h3>
      @for (m of methods(); track m.id) {
        <div class="method">
          <mat-icon>{{ icon(m.methodType) }}</mat-icon>
          <div class="method__body">
            <strong>{{ m.label }}</strong>
            <small>{{ m.sub }}</small>
          </div>
          @if (m.isDefault) { <span class="vexa-pill vexa-pill--success">Predeterminado</span> }
          @if (!m.isDefault) {
            <button mat-button (click)="setDefault(m.id)">Predeterminar</button>
          }
          <button mat-button color="warn" (click)="remove(m.id)">Eliminar</button>
        </div>
      } @empty {
        <p style="color:var(--vexa-gray-500)">No tienes métodos de pago guardados.</p>
      }

      <h3 class="vexa-overline" style="margin-top:24px">Agregar método</h3>
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
  `,
  styles: `
    .methods { max-width: 640px; padding: 20px; }
    .method { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--vexa-gray-100); }
    .method mat-icon { color: var(--vexa-gray-600); }
    .method__body { flex: 1; display: flex; flex-direction: column; }
    .method__body small { color: var(--vexa-gray-500); }
    .add-form { display: grid; gap: 12px; }
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
    this.api.delete<void>(`companies/me/payment-methods/${id}`).subscribe(() =>
      this.methods.update((list) => list.filter((m) => m.id !== id)),
    );
  }

  add() {
    const dto = this.newMethod as Omit<PaymentMethod, 'id'>;
    this.api.post<PaymentMethod>('companies/me/payment-methods', dto).subscribe(() => {
      this.newMethod = { methodType: 'card' };
      this.load();
    });
  }
}
