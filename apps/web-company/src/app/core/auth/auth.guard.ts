import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '@vexa/shared';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  return store.isAuthenticated() ? true : inject(Router).createUrlTree(['/auth/login']);
};

export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return () => {
    const store = inject(AuthStore);
    const user = store.user();
    if (user && roles.includes(user.role)) return true;
    return inject(Router).createUrlTree([store.isAuthenticated() ? '/' : '/auth/login']);
  };
}
