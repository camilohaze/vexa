import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Company } from '@vexa/shared';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: companies-management — tabla + panel de detalle de la empresa. */
@Component({
  selector: 'vexa-companies-list',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule, PageHeader],
  template: `
    <vexa-page-header title="Cuentas de empresa" subtitle="Clientes registrados en la plataforma">
      <div actions class="hdr">
        <mat-form-field class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Buscar empresas…" (input)="q.set($any($event.target).value)" />
        </mat-form-field>
        <button mat-flat-button><mat-icon>add</mat-icon> Agregar empresa</button>
      </div>
    </vexa-page-header>

    <div class="grid">
      <div>
        <table mat-table [dataSource]="filtered()" class="full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Empresa</th>
            <td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="taxId">
            <th mat-header-cell *matHeaderCellDef>NIT</th>
            <td mat-cell *matCellDef="let c">{{ c.taxId }}</td>
          </ng-container>
          <ng-container matColumnDef="plan">
            <th mat-header-cell *matHeaderCellDef>Plan</th>
            <td mat-cell *matCellDef="let c">Enterprise</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let c"><span class="vexa-pill vexa-pill--success">Aprobada</span></td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let c">
              <button mat-button color="warn">Suspender</button>
              <button mat-button (click)="selected.set(c)">Gestionar</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns" (click)="selected.set(row)"></tr>
        </table>
      </div>

      @if (selected(); as c) {
        <div class="detail vexa-card">
          <h3>{{ c.name }} — detalle operativo</h3>
          <div class="kv"><span>KPI Mensual</span><strong>Mensualidad auto-pagada</strong></div>
          <div class="kv"><span>API / Webhooks</span><strong>Activo</strong></div>
          <div class="kv"><span>Verificación</span><strong class="ok">Registro empresarial verificado</strong></div>
          <div class="kv"><span>ID</span><strong>{{ c.id.slice(0, 12) }}</strong></div>
        </div>
      }
    </div>
  `,
  styles: `
    .full { width: 100%; }
    .hdr { display: flex; gap: 12px; align-items: center; }
    .search { width: 240px; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; align-items: start; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    .detail { padding: 20px; }
    .kv { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
    .kv span { color: var(--vexa-gray-500); }
    .ok { color: var(--vexa-success-700); }
    tr[mat-row] { cursor: pointer; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesList {
  protected readonly columns = ['name', 'taxId', 'plan', 'status', 'actions'];
  protected readonly companies = signal<Company[]>([]);
  protected readonly q = signal('');
  protected readonly selected = signal<Company | null>(null);

  protected readonly filtered = () => {
    const q = this.q().toLowerCase();
    return this.companies().filter((c) => !q || c.name.toLowerCase().includes(q) || c.taxId?.includes(q));
  };

  constructor() {
    inject(ApiService).get<Company[]>('companies').subscribe((c) => this.companies.set(c));
  }
}
