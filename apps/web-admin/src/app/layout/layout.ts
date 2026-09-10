import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavItem, Shell } from '@vexa/ui';
import { AuthStore } from '../core/auth/auth.store';
import { RealtimeService } from '../core/realtime/realtime.service';

const NAV: NavItem[] = [
  { label: 'Panel', icon: 'dashboard', route: 'dashboard' },
  { label: 'Usuarios', icon: 'group', route: 'users' },
  { label: 'Empresas', icon: 'business', route: 'companies' },
  { label: 'Repartidores', icon: 'local_shipping', route: 'couriers' },
  { label: 'Despachos', icon: 'inventory_2', route: 'jobs' },
  { label: 'Mapa', icon: 'map', route: 'map' },
  { label: 'Disputas', icon: 'error_outline', route: 'disputes' },
  { label: 'Finanzas', icon: 'credit_card', route: 'finance' },
  { label: 'Reportes', icon: 'description', route: 'reports' },
  { label: 'Analítica', icon: 'bar_chart', route: 'analytics' },
  { label: 'Fraude', icon: 'gpp_maybe', route: 'fraud' },
  { label: 'Soporte', icon: 'help_outline', route: 'support' },
  { label: 'Notificaciones', icon: 'notifications', route: 'notifications' },
];

@Component({
  selector: 'vexa-admin-layout',
  imports: [RouterModule, Shell],
  template: `
    <vexa-shell
      title="Vexa"
      badge="ADMIN"
      [navItems]="nav"
      [userName]="auth.user()?.fullName"
      roleLabel="Administrador"
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
