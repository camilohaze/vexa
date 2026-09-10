import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api/api.service';

interface NotificationItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
}

type Category = 'deliveries' | 'payments' | 'system';
type Tab = 'all' | Category;

const DELIVERY_ICONS = ['local_shipping', 'inventory_2', 'package', 'place'];
const PAYMENT_ICONS = ['credit_card', 'account_balance_wallet', 'payments', 'receipt_long'];

function categoryOf(icon: string): Category {
  if (DELIVERY_ICONS.includes(icon)) return 'deliveries';
  if (PAYMENT_ICONS.includes(icon)) return 'payments';
  return 'system';
}

/** Figma: web-notifications */
@Component({
  selector: 'vexa-notifications',
  imports: [DatePipe, MatIconModule],
  template: `
    <div class="filter-header">
      <div class="tabs">
        @for (t of tabs; track t.value) {
          <button
            type="button"
            class="tabs__item"
            [class.tabs__item--active]="tab() === t.value"
            (click)="tab.set(t.value)"
          >
            {{ t.label }}
          </button>
        }
      </div>
      <button type="button" class="mark-read-btn" (click)="markAllRead()">Marcar todo como leído</button>
    </div>

    <div class="vexa-card list">
      @for (n of filtered(); track n.id) {
        <div class="item" [class.item--unread]="n.unread">
          <div class="item__icon" [class]="'item__icon--' + categoryOf(n.icon)">
            <mat-icon>{{ n.icon }}</mat-icon>
          </div>
          <div class="item__body">
            <div class="item__title-row">
              <strong>{{ n.title }}</strong>
              @if (n.unread) {
                <span class="dot"></span>
              }
            </div>
            <p class="item__text">{{ n.body }}</p>
          </div>
          <span class="item__when">{{ n.when | date: 'short' }}</span>
        </div>
      } @empty {
        <p class="empty">Sin notificaciones.</p>
      }
    </div>
  `,
  styles: `
    .filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .tabs { display: flex; gap: 4px; padding: 4px; background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-md); }
    .tabs__item { border: 0; background: transparent; padding: 8px 16px; border-radius: var(--vexa-radius-sm); font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer; }
    .tabs__item--active { background: var(--vexa-primary-600); color: #fff; }
    .mark-read-btn { background: #fff; border: 1px solid var(--vexa-gray-200); border-radius: var(--vexa-radius-sm); padding: 10px 16px; font-size: 14px; font-weight: 600; color: var(--vexa-gray-600); cursor: pointer; }

    .list { padding: 0; overflow: hidden; }
    .item { display: flex; gap: 16px; padding: 20px; border-bottom: 1px solid var(--vexa-gray-200); }
    .item:last-child { border-bottom: none; }
    .item--unread { background: var(--vexa-gray-50); }
    .item__icon {
      flex: none; width: 40px; height: 40px; border-radius: var(--vexa-radius-sm);
      display: grid; place-items: center; color: var(--vexa-gray-600);
    }
    .item__icon--deliveries { background: var(--vexa-primary-100); color: var(--vexa-primary-700); }
    .item__icon--payments { background: var(--vexa-success-100); color: var(--vexa-success-700); }
    .item__icon--system { background: var(--vexa-warning-100); color: var(--vexa-warning-700); }
    .item__body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .item__title-row { display: flex; align-items: center; gap: 8px; }
    .item__title-row strong { font-size: 15px; color: var(--vexa-gray-900); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--vexa-primary-600); flex: none; }
    .item__text { margin: 0; font-size: 14px; color: var(--vexa-gray-600); }
    .item__when { flex: none; font-size: 13px; color: var(--vexa-gray-400); }
    .empty { padding: 24px; color: var(--vexa-gray-500); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications {
  private readonly api = inject(ApiService);
  protected readonly categoryOf = categoryOf;

  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'deliveries', label: 'Envíos' },
    { value: 'payments', label: 'Pagos' },
    { value: 'system', label: 'Sistema' },
  ];

  protected readonly tab = signal<Tab>('all');
  protected readonly items = signal<NotificationItem[]>([]);
  protected readonly filtered = computed(() => {
    const tab = this.tab();
    return tab === 'all' ? this.items() : this.items().filter((n) => categoryOf(n.icon) === tab);
  });

  constructor() {
    this.api.get<NotificationItem[]>('companies/me/notifications').subscribe((items) => this.items.set(items));
  }

  markAllRead() {
    this.items.update((list) => list.map((n) => ({ ...n, unread: false })));
  }
}
