import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Subject, catchError, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from './auth.store';

const AUTH_ROUTE_RE = /\/auth\/(login|refresh|register|google|apple|forgot-password|reset-password)\b/;

let refreshInFlight: Promise<string | null> | null = null;
const refreshDone$ = new Subject<string | null>();

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const token = auth.tokens()?.accessToken;
  const authReq = token && isApiRequest ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !isApiRequest || AUTH_ROUTE_RE.test(req.url)) {
        return throwError(() => err);
      }
      if (!auth.tokens()?.refreshToken) {
        auth.logout();
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = auth.refreshTokens().finally(() => {
          refreshInFlight = null;
        });
        refreshInFlight.then((newToken) => refreshDone$.next(newToken));
      }

      return refreshDone$.pipe(
        take(1),
        switchMap((newToken) => {
          if (!newToken) {
            auth.logout();
            return throwError(() => err);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        })
      );
    })
  );
};
