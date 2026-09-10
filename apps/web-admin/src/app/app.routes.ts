import { Route } from '@angular/router';
import { UserRole } from '@vexa/shared';
import { authGuard, roleGuard } from './core/auth/auth.guard';
import { Layout } from './layout/layout';

export const appRoutes: Route[] = [
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback').then((m) => m.AuthCallback) },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard, roleGuard(UserRole.ADMIN)],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'users', loadComponent: () => import('./features/users/users').then((m) => m.UserManagement) },
      { path: 'companies', loadComponent: () => import('./features/companies/companies-list').then((m) => m.CompaniesList) },
      { path: 'couriers', loadComponent: () => import('./features/couriers/couriers-list').then((m) => m.CouriersList) },
      { path: 'jobs', loadComponent: () => import('./features/jobs/jobs-monitor').then((m) => m.JobsMonitor) },
      { path: 'map', loadComponent: () => import('./features/map/realtime-map').then((m) => m.RealtimeMap) },
      { path: 'disputes', loadComponent: () => import('./features/disputes/disputes').then((m) => m.Disputes) },
      { path: 'finance', loadComponent: () => import('./features/finance/commission').then((m) => m.Commission) },
      { path: 'payments', loadComponent: () => import('./features/payments/payments-list').then((m) => m.PaymentsList) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports').then((m) => m.Reports) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics').then((m) => m.Analytics) },
      { path: 'fraud', loadComponent: () => import('./features/fraud/fraud').then((m) => m.Fraud) },
      { path: 'support', loadComponent: () => import('./features/support/support').then((m) => m.Support) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications').then((m) => m.AdminNotifications) },
    ],
  },
  { path: '**', redirectTo: '' },
];
