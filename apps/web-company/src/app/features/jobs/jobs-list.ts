import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Job, JobStatus, Paginated } from '@vexa/shared';
import { PageHeader, StatusChip } from '@vexa/ui';
import { JobsService } from './jobs.service';

@Component({
  selector: 'vexa-jobs-list',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    PageHeader,
    RouterLink,
    StatusChip,
  ],
  template: `
    <vexa-page-header title="Envíos activos">
      <a mat-flat-button actions routerLink="/jobs/new">
        <mat-icon>add</mat-icon> Nuevo pedido
      </a>
    </vexa-page-header>

    <mat-button-toggle-group [value]="tab()" (change)="setTab($event.value)">
      <mat-button-toggle value="all">Todos</mat-button-toggle>
      <mat-button-toggle value="active">En tránsito</mat-button-toggle>
      <mat-button-toggle value="pending">Pendientes</mat-button-toggle>
    </mat-button-toggle-group>

    <table mat-table [dataSource]="page()?.items ?? []" class="jobs">
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef>#</th>
        <td mat-cell *matCellDef="let j">{{ j.id.slice(0, 8) }}</td>
      </ng-container>
      <ng-container matColumnDef="route">
        <th mat-header-cell *matHeaderCellDef>Ruta</th>
        <td mat-cell *matCellDef="let j">{{ j.pickup.line1 }} → {{ j.dropoff.line1 }}</td>
      </ng-container>
      <ng-container matColumnDef="progress">
        <th mat-header-cell *matHeaderCellDef>Progreso</th>
        <td mat-cell *matCellDef="let j">
          <div class="progress">
            <div class="progress__bar" [style.width.%]="progressOf(j)"></div>
          </div>
        </td>
      </ng-container>
      <ng-container matColumnDef="price">
        <th mat-header-cell *matHeaderCellDef>Precio</th>
        <td mat-cell *matCellDef="let j">{{ j.price | number:'1.0-0':'es-CO' }} COP</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Estado</th>
        <td mat-cell *matCellDef="let j"><vexa-status-chip [status]="j.status" /></td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let j">
          <a mat-button [routerLink]="['/jobs', j.id]">Ver</a>
          <button
            mat-button
            color="warn"
            [disabled]="j.status === 'DELIVERED' || j.status === 'CANCELLED'"
            (click)="cancel(j)"
          >
            Cancelar
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    <mat-paginator
      [length]="page()?.total ?? 0"
      [pageSize]="pageSize"
      (page)="onPage($event)"
    />
  `,
  styles: `
    .jobs { width: 100%; }
    mat-button-toggle-group { margin-bottom: 16px; }
    .progress { width: 120px; height: 6px; border-radius: 3px; background: var(--vexa-gray-100); overflow: hidden; }
    .progress__bar { height: 100%; background: var(--vexa-primary-600); border-radius: 3px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsList {
  private readonly service = inject(JobsService);

  protected readonly columns = ['id', 'route', 'progress', 'price', 'status', 'actions'];
  protected readonly page = signal<Paginated<Job> | null>(null);
  protected readonly tab = signal<'all' | 'active' | 'pending'>('all');
  protected readonly pageSize = 20;
  private pageIndex = 0;

  private static readonly ACTIVE = [
    JobStatus.ACCEPTED,
    JobStatus.PICKED_UP,
    JobStatus.IN_TRANSIT,
  ];

  private static readonly PROGRESS: Record<string, number> = {
    [JobStatus.PENDING]: 5,
    [JobStatus.OFFERED]: 15,
    [JobStatus.ACCEPTED]: 35,
    [JobStatus.PICKED_UP]: 60,
    [JobStatus.IN_TRANSIT]: 80,
    [JobStatus.DELIVERED]: 100,
    [JobStatus.CANCELLED]: 100,
  };

  constructor() {
    this.load();
  }

  setTab(tab: 'all' | 'active' | 'pending') {
    this.tab.set(tab);
    this.pageIndex = 0;
    this.load();
  }

  progressOf(job: Job) {
    return JobsList.PROGRESS[job.status] ?? 0;
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.load();
  }

  cancel(job: Job) {
    this.service.cancel(job.id).subscribe(() => this.load());
  }

  private load() {
    const tab = this.tab();
    this.service
      .list({ page: this.pageIndex + 1, pageSize: this.pageSize })
      .subscribe((page) => {
        const items =
          tab === 'active'
            ? page.items.filter((j) => JobsList.ACTIVE.includes(j.status))
            : tab === 'pending'
              ? page.items.filter((j) => j.status === JobStatus.PENDING || j.status === JobStatus.OFFERED)
              : page.items;
        this.page.set({ ...page, items });
      });
  }
}
