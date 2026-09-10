import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
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
          <span class="shell__brand-icon"><mat-icon>local_shipping</mat-icon></span>
          <span class="shell__brand-name">{{ title() }}</span>
          @if (badge()) {
            <span class="shell__badge">{{ badge() }}</span>
          }
        </div>
        <mat-nav-list class="shell__nav">
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
        <div class="shell__spacer"></div>
        @if (userName()) {
          <div class="shell__user-card">
            <div class="shell__avatar">
              @if (avatarUrl()) {
                <img [src]="avatarUrl()" alt="" />
              } @else {
                <span>{{ initials() }}</span>
              }
            </div>
            <div class="shell__user-info">
              <span class="shell__user-name">{{ userName() }}</span>
              @if (roleLabel()) {
                <span class="shell__user-role">{{ roleLabel() }}</span>
              }
            </div>
            <button
              mat-icon-button
              class="shell__logout"
              aria-label="Cerrar sesión"
              (click)="logout.emit()"
            >
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        }
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
          <span class="shell__page-title">{{ pageTitle() || activePageTitle() || title() }}</span>
          <span class="spacer"></span>
          @if (showSearch()) {
            <label class="shell__search">
              <mat-icon>search</mat-icon>
              <input type="text" [placeholder]="searchPlaceholder()" />
            </label>
          }
          @if (notificationsRoute(); as route) {
            <a mat-icon-button class="shell__bell" [routerLink]="route" aria-label="Notificaciones">
              <mat-icon>notifications</mat-icon>
            </a>
          } @else {
            <button mat-icon-button class="shell__bell" aria-label="Notificaciones">
              <mat-icon>notifications</mat-icon>
            </button>
          }
        </mat-toolbar>
        <main class="shell__content">
          <ng-content />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { height: 100vh; }

    .shell__sidenav {
      width: 264px;
      display: flex;
      flex-direction: column;
      background: var(--vexa-sidebar-bg);
      color: var(--vexa-sidebar-text);
      border-right: none;
      padding: 16px 12px;
      box-sizing: border-box;
    }

    .shell__brand {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 8px 20px;
    }
    .shell__brand-icon {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: var(--vexa-radius-sm);
      background: var(--vexa-primary-600); color: #fff; flex: none;
    }
    .shell__brand-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .shell__brand-name { font-weight: 700; font-size: 18px; color: #fff; }
    .shell__badge {
      margin-left: auto; font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
      text-transform: uppercase; color: var(--vexa-sidebar-muted);
      background: var(--vexa-sidebar-active); padding: 3px 8px; border-radius: var(--vexa-radius-pill);
    }

    .shell__nav { display: flex; flex-direction: column; gap: 2px; }
    .shell__nav a {
      border-radius: var(--vexa-radius-sm); color: var(--vexa-sidebar-muted);
      --mat-icon-color: var(--vexa-sidebar-muted);
    }
    .shell__nav a mat-icon { color: var(--vexa-sidebar-muted) !important; }
    .shell__nav a [matListItemTitle] { color: var(--vexa-sidebar-muted) !important; }
    .shell__nav a.active {
      background: var(--vexa-sidebar-active);
      color: #fff;
      --mat-icon-color: #fff;
    }
    .shell__nav a.active mat-icon { color: #fff !important; }
    .shell__nav a.active [matListItemTitle] { color: #fff !important; }

    .shell__spacer { flex: 1 1 auto; }

    .shell__user-card {
      display: flex; align-items: center; gap: 10px;
      padding: 10px; border-radius: var(--vexa-radius-md);
      background: var(--vexa-sidebar-active);
    }
    .shell__avatar {
      width: 36px; height: 36px; border-radius: 50%; flex: none; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      background: var(--vexa-primary-600); color: #fff; font-size: 13px; font-weight: 700;
    }
    .shell__avatar img { width: 100%; height: 100%; object-fit: cover; }
    .shell__user-info { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
    .shell__user-name { font-size: 13px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .shell__user-role { font-size: 11px; color: var(--vexa-sidebar-muted); }
    .shell__logout { color: var(--vexa-sidebar-muted); flex: none; }

    .shell__toolbar {
      position: sticky; top: 0; z-index: 10;
      background: #fff; border-bottom: 1px solid var(--vexa-gray-200);
      gap: 16px;
    }
    .shell__page-title { font-size: 20px; font-weight: 700; color: var(--vexa-gray-900); }
    .shell__search {
      display: flex; align-items: center; gap: 8px;
      background: var(--vexa-gray-100); border-radius: var(--vexa-radius-pill);
      padding: 8px 14px; width: 280px; color: var(--vexa-gray-400);
    }
    .shell__search mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .shell__search input {
      border: 0; background: transparent; outline: none; flex: 1 1 auto;
      font: var(--mat-sys-body-medium); color: var(--vexa-gray-900);
    }
    .shell__bell { color: var(--vexa-gray-600); }

    .shell__content { padding: 24px; background: var(--mat-sys-surface); min-height: calc(100vh - 64px); }
    .spacer { flex: 1 1 auto; }
    .hidden { visibility: hidden; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  title = input.required<string>();
  navItems = input.required<NavItem[]>();
  userName = input<string>();
  roleLabel = input<string>();
  avatarUrl = input<string>();
  badge = input<string>();
  pageTitle = input<string>();
  showSearch = input<boolean>(true);
  searchPlaceholder = input<string>('Buscar...');
  notificationsRoute = input<string>();
  logout = output<void>();

  private readonly router = inject(Router);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe(Breakpoints.Handset)
      .pipe(map((result) => result.matches)),
    { initialValue: false }
  );

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly activePageTitle = computed(() => {
    const url = this.currentUrl();
    const match = [...this.navItems()]
      .sort((a, b) => b.route.length - a.route.length)
      .find((item) => url === item.route || url.startsWith(`${item.route}/`));
    return match?.label ?? '';
  });

  protected readonly initials = computed(() => {
    const name = this.userName() ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });
}
