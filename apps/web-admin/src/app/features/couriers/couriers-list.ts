import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { Courier } from '@vexa/shared';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';
import { RealtimeService } from '../../core/realtime/realtime.service';
import { SocketEvents } from '@vexa/shared';

/** Figma: couriers-management — gestión de flota (vehículo, rating,
 * entregas, ganancias, verificación, en línea). */
@Component({
  selector: 'vexa-couriers-list',
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTableModule,
    PageHeader,
  ],
  template: `
    <vexa-page-header title="Gestión de flota">
      <div actions class="hdr">
        <mat-form-field class="search">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Buscar repartidores…" (input)="q.set($any($event.target).value)" />
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="onlineOnly">Solo en línea</mat-slide-toggle>
      </div>
    </vexa-page-header>

    <table mat-table [dataSource]="filtered()" class="full">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Repartidor</th>
        <td mat-cell *matCellDef="let c"><strong>Repartidor #{{ c.id.slice(0, 6) }}</strong></td>
      </ng-container>
      <ng-container matColumnDef="vehicle">
        <th mat-header-cell *matHeaderCellDef>Vehículo</th>
        <td mat-cell *matCellDef="let c">{{ c.vehicle }}</td>
      </ng-container>
      <ng-container matColumnDef="rating">
        <th mat-header-cell *matHeaderCellDef>Rating</th>
        <td mat-cell *matCellDef="let c">
          <mat-icon class="star">star</mat-icon> {{ c.rating | number:'1.1-2' }}
        </td>
      </ng-container>
      <ng-container matColumnDef="deliveries">
        <th mat-header-cell *matHeaderCellDef>Entregas</th>
        <td mat-cell *matCellDef="let c">{{ 0 }}</td>
      </ng-container>
      <ng-container matColumnDef="verification">
        <th mat-header-cell *matHeaderCellDef>Verificación</th>
        <td mat-cell *matCellDef="let c"><span class="vexa-pill vexa-pill--success">Verificado</span></td>
      </ng-container>
      <ng-container matColumnDef="online">
        <th mat-header-cell *matHeaderCellDef>En línea</th>
        <td mat-cell *matCellDef="let c">
          <span class="online" [class.online--off]="!online().has(c.id)">
            {{ online().has(c.id) ? 'EN LÍNEA' : 'OFFLINE' }}
          </span>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let c"><button mat-button>Editar perfil</button></td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
  `,
  styles: `
    .full { width: 100%; }
    .hdr { display: flex; gap: 16px; align-items: center; }
    .search { width: 260px; }
    .star { font-size: 16px; width: 16px; height: 16px; color: var(--vexa-warning-500); vertical-align: -3px; }
    .online { font-size: 11px; font-weight: 700; letter-spacing: .4px; color: var(--vexa-success-700); }
    .online--off { color: var(--vexa-gray-400); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouriersList {
  private readonly realtime = inject(RealtimeService);

  protected readonly columns = ['name', 'vehicle', 'rating', 'deliveries', 'verification', 'online', 'actions'];
  protected readonly couriers = signal<Courier[]>([]);
  protected readonly online = signal(new Set<string>());
  protected readonly q = signal('');
  protected onlineOnly = false;

  protected readonly filtered = () => {
    const q = this.q().toLowerCase();
    return this.couriers().filter((c) => {
      if (this.onlineOnly && !this.online().has(c.id)) return false;
      return !q || c.id.toLowerCase().includes(q);
    });
  };

  constructor() {
    inject(ApiService).get<Courier[]>('couriers').subscribe((c) => this.couriers.set(c));
    // Repartidores transmitiendo ubicación = en línea
    this.realtime.on(SocketEvents.COURIER_LOCATION).subscribe((e) =>
      this.online.update((s) => new Set(s).add(e.courierId)),
    );
  }
}
