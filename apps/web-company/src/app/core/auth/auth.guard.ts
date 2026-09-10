import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@vexa/shared';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  if (store.isAuthenticated()) return true;
  inject(Router).navigateByUrl('/auth/login');
  return false;
};

export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const user = store.user();
    if (user && roles.includes(user.role)) return true;
    if (!store.isAuthenticated()) {
      inject(Router).navigateByUrl('/auth/login');
      return false;
    }
    return false;
  };
}
