import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Courier' | 'Company Partner' | 'Admin';
  status: 'Active' | 'Suspended' | 'Invited';
  joined: string;
}

/** Figma: user-management — directorio con tabs, búsqueda, selección y suspensión. */
@Component({
  selector: 'vexa-users',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    PageHeader,
  ],
  template: `
    <vexa-page-header title="Directorio de usuarios" subtitle="Gestiona usuarios, empresas, repartidores y administradores" />

    <mat-button-toggle-group [value]="tab()" (change)="tab.set($event.value)">
      <mat-button-toggle value="users">Usuarios</mat-button-toggle>
      <mat-button-toggle value="companies">Empresas</mat-button-toggle>
      <mat-button-toggle value="couriers">Repartidores</mat-button-toggle>
      <mat-button-toggle value="admins">Admins</mat-button-toggle>
    </mat-button-toggle-group>

    <div class="toolbar">
      <mat-form-field class="search">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Buscar por nombre o email…" (input)="q.set($any($event.target).value)" />
      </mat-form-field>
      <span class="muted">{{ selected().size }} seleccionados</span>
      <button mat-stroked-button color="warn" [disabled]="!selected().size">Suspender selección</button>
    </div>

    <table mat-table [dataSource]="filtered()" class="full">
      <ng-container matColumnDef="sel">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let u">
          <mat-checkbox [checked]="selected().has(u.id)" (change)="toggle(u.id)" />
        </td>
      </ng-container>
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Nombre</th>
        <td mat-cell *matCellDef="let u"><strong>{{ u.name }}</strong></td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let u">{{ u.email }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Rol</th>
        <td mat-cell *matCellDef="let u">{{ u.role }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let u">
          <span class="vexa-pill" [class.vexa-pill--success]="u.status === 'Active'"
              [class.vexa-pill--warning]="u.status === 'Suspended'">{{ u.status }}</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="joined">
        <th mat-header-cell *matHeaderCellDef>Registro</th>
        <td mat-cell *matCellDef="let u">{{ u.joined }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let u">
          <button mat-button>Editar</button>
          <button mat-button color="warn" (click)="suspend(u.id)">Restringir</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
    <mat-paginator [length]="filtered().length" [pageSize]="10" showFirstLastButtons />
  `,
  styles: `
    .full { width: 100%; }
    .toolbar { display: flex; align-items: center; gap: 16px; margin: 8px 0 12px; }
    .search { width: 320px; }
    .muted { color: var(--vexa-gray-500); font-size: 13px; margin-left: auto; }
    mat-button-toggle-group { margin-bottom: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement {
  private readonly api = inject(ApiService);

  protected readonly columns = ['sel', 'name', 'email', 'role', 'status', 'joined', 'actions'];
  protected readonly tab = signal('users');
  protected readonly q = signal('');
  protected readonly selected = signal(new Set<string>());

  protected readonly users = signal<AdminUser[]>([]);

  protected readonly filtered = () => {
    const q = this.q().toLowerCase();
    return this.users().filter((u) =>
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  };

  constructor() {
    this.load();
  }

  load() {
    this.api
      .get<{ id: string; email: string; fullName: string; role: string; createdAt: string }[]>('admin/users')
      .subscribe((rows) =>
        this.users.set(
          rows.map((u) => ({
            id: u.id,
            name: u.fullName,
            email: u.email,
            role:
              u.role === 'COURIER' ? 'Courier'
              : u.role === 'COMPANY' ? 'Company Partner'
              : 'Admin',
            status: 'Active',
            joined: new Date(u.createdAt).toLocaleDateString('es-CO', {
              month: 'short', day: '2-digit', year: 'numeric',
            }),
          })),
        ),
      );
  }

  suspend(id: string) {
    this.api.post(`admin/users/${id}/suspend`).subscribe({
      next: () => this.load(),
      error: () => undefined,
    });
  }

  toggle(id: string) {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }
}
