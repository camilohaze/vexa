import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface SupportTicket {
  id: string;
  subject: string;
  lastMessage?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'CLOSED';
  slaHours: number;
  createdAt: string;
}

/** Figma: support-center — cola de tickets + chat + acciones rápidas. */
@Component({
  selector: 'vexa-support',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, PageHeader],
  template: `
    <vexa-page-header title="Soporte a clientes y repartidores" />

    <div class="grid">
      <div class="vexa-card queue">
        <div class="queue__head">
          <h3 class="vexa-overline">Cola de tickets</h3>
          <span class="vexa-pill vexa-pill--warning">{{ openCount() }} abiertos</span>
        </div>
        @for (t of tickets(); track t.id) {
          <button type="button" class="ticket" [class.ticket--on]="active() === t.id" (click)="active.set(t.id)">
            <strong>TIX-{{ t.id.slice(0, 6).toUpperCase() }}</strong>
            <small>{{ t.subject }}</small>
            <span class="vexa-pill" [class.vexa-pill--error]="t.slaHours <= 4"
                [class.vexa-pill--info]="t.slaHours > 4">SLA {{ t.slaHours }}h</span>
          </button>
        } @empty {
          <small style="padding:12px;color:var(--vexa-gray-500)">Sin tickets.</small>
        }
      </div>

      <div class="vexa-card chat">
        @if (selected(); as t) {
          <div class="chat__head">
            <strong>{{ t.subject }}</strong>
            <span class="vexa-pill" [class.vexa-pill--error]="t.status === 'ESCALATED'">{{ t.status }}</span>
          </div>
          <div class="chat__body">
            <div class="msg msg--in">{{ t.lastMessage ?? 'Sin mensajes todavía.' }}</div>
          </div>
          <div class="chat__actions">
            <button mat-stroked-button (click)="setStatus(t, 'IN_PROGRESS')">Tomar</button>
            <button mat-stroked-button color="warn" (click)="setStatus(t, 'ESCALATED')">Escalar</button>
            <button mat-flat-button color="primary" (click)="setStatus(t, 'CLOSED')">Cerrar ticket</button>
          </div>
        } @else {
          <p style="color:var(--vexa-gray-500)">Selecciona un ticket de la cola.</p>
        }
      </div>

      <div class="vexa-card actions">
        <h3 class="vexa-overline">Acciones rápidas y plantillas</h3>
        <button mat-stroked-button class="w-full">Enviar bypass de POD</button>
        <button mat-stroked-button class="w-full">Escalar a Tech Lead</button>
        <button mat-stroked-button class="w-full">Enviar plantilla de resolución</button>
      </div>
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 280px 1fr 240px; gap: 16px; align-items: start; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
    .queue, .chat, .actions { padding: 16px; }
    .queue__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ticket {
      display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left;
      padding: 12px; border: 0; border-top: 1px solid var(--vexa-gray-100);
      background: none; cursor: pointer; font: inherit;
      small { color: var(--vexa-gray-500); }
    }
    .ticket--on { background: var(--vexa-primary-50); }
    .ticket .vexa-pill { align-self: flex-start; margin-top: 4px; }
    .chat { display: flex; flex-direction: column; gap: 12px; min-height: 380px; }
    .chat__head { display: flex; justify-content: space-between; align-items: center; }
    .chat__body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .chat__actions { display: flex; gap: 8px; }
    .msg { max-width: 75%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.4; }
    .msg--in { background: var(--vexa-gray-100); align-self: flex-start; }
    .w-full { width: 100%; }
    .actions { display: flex; flex-direction: column; gap: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Support {
  private readonly api = inject(ApiService);
  protected readonly tickets = signal<SupportTicket[]>([]);
  protected readonly active = signal<string | null>(null);
  protected readonly openCount = () =>
    this.tickets().filter((t) => t.status === 'OPEN').length;
  protected readonly selected = () =>
    this.tickets().find((t) => t.id === this.active()) ?? null;

  constructor() {
    this.load();
  }

  load() {
    this.api.get<SupportTicket[]>('admin/support/tickets').subscribe((rows) => {
      this.tickets.set(rows);
      if (rows.length && !this.active()) this.active.set(rows[0].id);
    });
  }

  setStatus(ticket: SupportTicket, status: SupportTicket['status']) {
    this.api.patch<SupportTicket>(`admin/support/tickets/${ticket.id}`, { status })
      .subscribe((updated) =>
        this.tickets.update((list) => list.map((t) => (t.id === ticket.id ? updated : t))),
      );
  }
}
