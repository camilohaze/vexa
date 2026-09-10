import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Layout } from './layout/layout';

export const appRoutes: Route[] = [
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback').then((m) => m.AuthCallback) },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard) },
      {
        path: 'deliveries',
        loadComponent: () => import('./features/deliveries/deliveries-list').then((m) => m.DeliveriesList),
      },
      { path: 'earnings', loadComponent: () => import('./features/earnings/earnings').then((m) => m.Earnings) },
      { path: 'wallet', loadComponent: () => import('./features/wallet/wallet').then((m) => m.Wallet) },
      {
        path: 'performance',
        loadComponent: () => import('./features/performance/performance').then((m) => m.Performance),
      },
      { path: 'profile', loadComponent: () => import('./features/profile/profile').then((m) => m.Profile) },
      {
        path: 'verification',
        loadComponent: () => import('./features/verification/verification').then((m) => m.Verification),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
