import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthTokens } from '@vexa/shared';
import { Subject, catchError, firstValueFrom, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'vexa.tokens';
const USER_KEY = 'vexa.user';
const AUTH_ROUTE_RE =
  /\/auth\/(login|refresh|register|google|apple|forgot-password|reset-password|verify-email|resend-verification)\b/;

function readTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function clearSession(router: Router) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
  router.navigateByUrl('/auth/login');
}

let refreshInFlight: Promise<string | null> | null = null;
const refreshDone$ = new Subject<string | null>();

async function performRefresh(http: HttpClient): Promise<string | null> {
  const current = readTokens();
  if (!current?.refreshToken) return null;
  try {
    const tokens = await firstValueFrom(
      http.post<AuthTokens>(`${environment.apiUrl}/auth/refresh`, { refreshToken: current.refreshToken })
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/**
 * Federated remotes (web-company/web-admin/web-courier) register their own auth
 * interceptors, but those only apply when a remote bootstraps standalone -- when
 * loaded as routes inside this shell they share the shell's single HttpClient, so
 * only an interceptor registered here ever runs. All remotes read/write the same
 * localStorage session keys, so this interceptor -- including its refresh-and-retry
 * logic on a 401 -- covers every one of them.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() only works synchronously within this call, before any async gap (e.g. inside
  // catchError's callback, which fires later when the HTTP response arrives) -- capture
  // both here and use them via closure below.
  const router = inject(Router);
  const http = inject(HttpClient);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const token = readTokens()?.accessToken;
  const authReq =
    token && isApiRequest && !req.headers.has('Authorization')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || !isApiRequest || AUTH_ROUTE_RE.test(req.url)) {
        return throwError(() => err);
      }
      if (!readTokens()?.refreshToken) {
        clearSession(router);
        return throwError(() => err);
      }

      if (!refreshInFlight) {
        refreshInFlight = performRefresh(http).finally(() => {
          refreshInFlight = null;
        });
        refreshInFlight.then((newToken) => refreshDone$.next(newToken));
      }

      return refreshDone$.pipe(
        take(1),
        switchMap((newToken) => {
          if (!newToken) {
            clearSession(router);
            return throwError(() => err);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
        })
      );
    })
  );
};
