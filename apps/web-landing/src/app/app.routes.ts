import { Route } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const appRoutes: Route[] = [
  { path: '', loadComponent: () => import('./features/landing/landing').then((m) => m.Landing) },
  { path: 'products', loadComponent: () => import('./features/public/features').then((m) => m.Features) },
  { path: 'how-it-works', loadComponent: () => import('./features/public/how-it-works').then((m) => m.HowItWorks) },
  { path: 'resources', loadComponent: () => import('./features/public/support').then((m) => m.Support) },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
  { path: 'auth/callback', loadComponent: () => import('./features/auth/callback').then((m) => m.AuthCallback) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register').then((m) => m.Register) },
  { path: 'auth/forgot-password', loadComponent: () => import('./features/auth/forgot-password').then((m) => m.ForgotPassword) },
  { path: 'auth/verify-email', loadComponent: () => import('./features/auth/verify-email').then((m) => m.VerifyEmail) },
  { path: 'auth/change-password', loadComponent: () => import('./features/auth/change-password').then((m) => m.ChangePassword) },
  { path: 'company', loadChildren: () => loadRemoteModule('webCompany', './routes').then((m) => m.appRoutes) },
  { path: 'admin', loadChildren: () => loadRemoteModule('webAdmin', './routes').then((m) => m.appRoutes) },
  { path: 'courier', loadChildren: () => loadRemoteModule('webCourier', './routes').then((m) => m.appRoutes) },
  { path: '**', redirectTo: '' },
];
