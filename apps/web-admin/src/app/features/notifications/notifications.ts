import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

/** Figma: admin-notification-center — estadísticas, broadcast programado,
 * editor de push y plantillas activas. */
@Component({
  selector: 'vexa-admin-notifications',
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  template: `
    <vexa-page-header title="Centro de notificaciones" />

    <section class="stats">
      <div class="stat vexa-card"><span>Enviadas hoy</span><strong>{{ stats().sentToday | number }}</strong></div>
      <div class="stat vexa-card"><span>Tasa de apertura</span><strong>{{ stats().openRate }}%</strong></div>
      <div class="stat vexa-card"><span>Clics</span><strong>{{ stats().clickRate }}%</strong></div>
    </section>

    <div class="grid">
      <form class="vexa-card block" [formGroup]="form" (ngSubmit)="send()">
        <h3 class="vexa-overline">Crear notificación push</h3>
        <mat-form-field><mat-label>Título</mat-label>
          <input matInput formControlName="title" /></mat-form-field>
        <mat-form-field><mat-label>Cuerpo del mensaje</mat-label>
          <textarea matInput rows="3" formControlName="body"></textarea></mat-form-field>
        <div class="row">
          <mat-form-field><mat-label>Segmento</mat-label>
            <mat-select formControlName="segment">
              <mat-option value="couriers">Todos los repartidores activos</mat-option>
              <mat-option value="companies">Todas las empresas</mat-option>
              <mat-option value="all">Toda la plataforma</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field><mat-label>Programación</mat-label>
            <input matInput formControlName="when" /></mat-form-field>
        </div>
        <div class="row">
          <button mat-stroked-button type="button">Guardar borrador</button>
          <button mat-flat-button type="submit" [disabled]="form.invalid">Programar broadcast</button>
        </div>
      </form>

      <div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Cola programada ({{ scheduled().length }})</h3>
          @for (s of scheduled(); track s.title) {
            <div class="sched"><strong>{{ s.title }}</strong><small>{{ s.desc }}</small></div>
          }
        </div>
        <div class="vexa-card block">
          <h3 class="vexa-overline">Plantillas activas</h3>
          @for (t of templates(); track t) {
            <div class="tpl"><span>{{ t }}</span><mat-icon class="ic">edit</mat-icon></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    @media (max-width: 800px) { .stats { grid-template-columns: 1fr; } }
    .stat { padding: 20px; display: flex; flex-direction: column; gap: 4px; }
    .stat span { font-size: 12px; color: var(--vexa-gray-500); }
    .stat strong { font-size: 28px; font-weight: 800; }
    .up { color: var(--vexa-success-700); font-weight: 600; }
    .muted { color: var(--vexa-gray-500); }
    .grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
    .block { padding: 20px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sched { display: flex; flex-direction: column; padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); }
    .sched small { color: var(--vexa-gray-500); }
    .tpl { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-top: 1px solid var(--vexa-gray-100); font-size: 14px; }
    .ic { font-size: 16px; width: 16px; height: 16px; color: var(--vexa-gray-400); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminNotifications {
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    segment: ['couriers'],
    when: [''],
  });

  protected readonly stats = signal({ sentToday: 0, openRate: 0, clickRate: 0 });
  protected readonly scheduled = signal<{ title: string; desc: string }[]>([]);
  protected readonly templates = signal<string[]>([]);

  constructor() {
    this.api.get<{ stats: { sentToday: number; openRate: number; clickRate: number }; scheduled: { title: string; desc: string }[]; templates: string[] }>('admin/notifications/hub')
      .subscribe((h) => {
        this.stats.set(h.stats);
        this.scheduled.set(h.scheduled);
        this.templates.set(h.templates);
      });
  }

  private readonly api = inject(ApiService);

  send() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.api
      .post<{ queued: number }>('admin/notifications/broadcast', {
        title: v.title,
        body: v.body,
        segment: v.segment,
        scheduledAt: v.when || undefined,
      })
      .subscribe({
        next: (r) =>
          this.snack.open(`Broadcast programado → ${r.queued} dispositivos`, undefined, { duration: 3000 }),
        error: () => this.snack.open('Error al programar el broadcast', undefined, { duration: 3000 }),
      });
  }
}
