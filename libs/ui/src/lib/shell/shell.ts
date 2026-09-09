import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { NavItem } from '../models/nav-item';

@Component({
  selector: 'vexa-shell',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterModule,
  ],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #drawer
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        class="shell__sidenav"
      >
        <div class="shell__brand">
          <mat-icon>local_shipping</mat-icon>
          <span>{{ title() }}</span>
        </div>
        <mat-nav-list>
          @for (item of navItems(); track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active"
              (click)="isHandset() && drawer.close()"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="shell__toolbar">
          <button
            mat-icon-button
            class="shell__menu"
            aria-label="Abrir menú"
            (click)="drawer.toggle()"
            [class.hidden]="!isHandset()"
          >
            <mat-icon>menu</mat-icon>
          </button>
          <span>{{ title() }}</span>
          <span class="spacer"></span>
          @if (userName()) {
            <span class="shell__user">{{ userName() }}</span>
          }
          <button mat-icon-button aria-label="Cerrar sesión" (click)="logout.emit()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <main class="shell__content">
          <ng-content />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100vh; }
    .shell__sidenav { width: 240px; }
    .shell__brand {
      display: flex; align-items: center; gap: 8px;
      padding: 16px; font-weight: 600; font-size: 18px;
    }
    .shell__toolbar { position: sticky; top: 0; z-index: 10; }
    .shell__user { font-size: 14px; margin-right: 8px; }
    .shell__content { padding: 24px; }
    .spacer { flex: 1 1 auto; }
    .hidden { visibility: hidden; }
    a.active { background: var(--mat-sys-secondary-container); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  title = input.required<string>();
  navItems = input.required<NavItem[]>();
  userName = input<string>();
  logout = output<void>();

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );
}
