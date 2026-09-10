import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavItem, Shell } from '@vexa/ui';
import { AuthStore } from '../core/auth/auth.store';

const NAV: NavItem[] = [
  { label: 'Panel', icon: 'home', route: 'dashboard' },
  { label: 'Entregas', icon: 'inventory_2', route: 'deliveries' },
  { label: 'Ganancias', icon: 'bar_chart', route: 'earnings' },
  { label: 'Billetera', icon: 'credit_card', route: 'wallet' },
  { label: 'Desempeño', icon: 'military_tech', route: 'performance' },
  { label: 'Perfil', icon: 'person', route: 'profile' },
];

/** El centro de verificación se alcanza desde el botón "Editar perfil" en Perfil,
 * no tiene entrada propia en el sidebar (igual que en el Figma). */

@Component({
  selector: 'vexa-courier-layout',
  imports: [RouterModule, Shell],
  template: `
    <vexa-shell
      title="Vexa"
      badge="COURIER"
      [navItems]="nav"
      [userName]="auth.user()?.fullName"
      roleLabel="Repartidor"
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
}
