import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeader } from '@vexa/ui';
import { ApiService } from '../../core/api/api.service';

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
}

/** Figma: notifications-screen — feed agrupado por día. */
@Component({
  selector: 'vexa-notifications',
  imports: [DatePipe, MatIconModule, PageHeader],
  template: `
    <vexa-page-header title="Notificaciones" />
    @for (group of groups(); track group.label) {
      <h3 class="vexa-overline group">{{ group.label }}</h3>
      <div class="vexa-card list">
        @for (n of group.items; track n.id) {
          <div class="item">
            <span class="item__dot" [class.item__dot--unread]="n.unread"></span>
            <mat-icon>{{ n.icon }}</mat-icon>
            <div class="item__body">
              <strong>{{ n.title }}</strong>
              <small>{{ n.body }}</small>
            </div>
            <small class="item__when">{{ n.when | date:'short' }}</small>
          </div>
        } @empty {
          <p style="padding:16px;color:var(--vexa-gray-500)">Sin notificaciones.</p>
        }
      </div>
    }
  `,
  styles: `
    .group { margin: 20px 0 8px; }
    .list { padding: 4px 0; max-width: 720px; }
    .item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; }
    .item + .item { border-top: 1px solid var(--vexa-gray-100); }
    .item mat-icon { color: var(--vexa-primary-600); margin-top: 2px; }
    .item__dot { width: 8px; height: 8px; border-radius: 50%; background: transparent; margin-top: 8px; }
    .item__dot--unread { background: var(--vexa-primary-600); }
    .item__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .item__body small, .item__when { color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications {
  private readonly api = inject(ApiService);
  protected readonly groups = signal<{ label: string; items: NotificationItem[] }[]>([]);

  constructor() {
    this.api.get<NotificationItem[]>('companies/me/notifications').subscribe((items) => {
      const today = new Date().toDateString();
      const todayItems = items.filter((n) => new Date(n.when).toDateString() === today);
      const older = items.filter((n) => new Date(n.when).toDateString() !== today);
      const groups: { label: string; items: NotificationItem[] }[] = [];
      if (todayItems.length) groups.push({ label: 'HOY', items: todayItems });
      if (older.length) groups.push({ label: 'ANTERIORES', items: older });
      this.groups.set(groups);
    });
  }
}
