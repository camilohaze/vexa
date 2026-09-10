import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavItem, Shell } from '@vexa/ui';
import { AuthStore } from '../core/auth/auth.store';
import { RealtimeService } from '../core/realtime/realtime.service';

const NAV: NavItem[] = [
  { label: 'Panel', icon: 'home', route: '/dashboard' },
  { label: 'Envíos', icon: 'inventory_2', route: '/jobs' },
  { label: 'Seguimiento', icon: 'place', route: '/tracking' },
  { label: 'Billetera', icon: 'credit_card', route: '/wallet' },
  { label: 'Facturación', icon: 'description', route: '/billing' },
  { label: 'Notificaciones', icon: 'notifications', route: '/notifications' },
  { label: 'Configuración', icon: 'settings', route: '/settings' },
];

@Component({
  selector: 'vexa-company-layout',
  imports: [RouterModule, Shell],
  template: `
    <vexa-shell
      title="Vexa"
      badge="COMP"
      [navItems]="nav"
      [userName]="auth.user()?.fullName"
      roleLabel="Cliente Premium"
      notificationsRoute="/notifications"
      (logout)="auth.logout()"
    >
      <router-outlet />
    </vexa-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  protected readonly nav = NAV;
  protected readonly auth = inject(AuthStore);
  private readonly realtime = inject(RealtimeService);

  constructor() {
    this.realtime.connect();
  }
}
