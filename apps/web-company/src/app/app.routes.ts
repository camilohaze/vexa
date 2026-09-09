import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { Layout } from './layout/layout';

export const appRoutes: Route[] = [
  { path: 'auth/login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback').then((m) => m.AuthCallback) },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'jobs', loadComponent: () => import('./features/jobs/jobs-list').then((m) => m.JobsList) },
      { path: 'jobs/new', loadComponent: () => import('./features/jobs/job-create').then((m) => m.JobCreate) },
      {
        path: 'jobs/:id',
        loadComponent: () => import('./features/jobs/job-tracking').then((m) => m.JobTracking),
      },
      {
        path: 'jobs/:id/rate',
        loadComponent: () => import('./features/couriers/rate-courier').then((m) => m.RateCourier),
      },
      {
        path: 'couriers/:id',
        loadComponent: () => import('./features/couriers/courier-profile').then((m) => m.CourierProfile),
      },
      { path: 'wallet', loadComponent: () => import('./features/billing/wallet').then((m) => m.Wallet) },
      {
        path: 'wallet/methods',
        loadComponent: () => import('./features/billing/payment-methods').then((m) => m.PaymentMethods),
      },
      { path: 'billing', loadComponent: () => import('./features/billing/invoices').then((m) => m.Invoices) },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications').then((m) => m.Notifications),
      },
      { path: 'settings', loadComponent: () => import('./features/settings/settings').then((m) => m.Settings) },
    ],
  },
  { path: '**', redirectTo: '' },
];
