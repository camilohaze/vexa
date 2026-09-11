import { HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthTokens } from '@vexa/shared';
import { Subject, catchError, firstValueFrom, switchMap, take, throwError } from 'rxjs';

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

async function performRefresh(http: HttpClient, apiUrl: string): Promise<string | null> {
  const current = readTokens();
  if (!current?.refreshToken) return null;
  try {
    const tokens = await firstValueFrom(
      http.post<AuthTokens>(`${apiUrl}/auth/refresh`, { refreshToken: current.refreshToken })
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    return tokens.accessToken;
  } catch {
    return null;
  }
}

/**
 * Attaches the stored access token to every request against `apiUrl`, and on a 401
 * transparently refreshes the token pair via POST /auth/refresh and retries the
 * original request once. Concurrent 401s share a single in-flight refresh instead of
 * each firing their own. Falls back to clearing the session and redirecting to
 * /auth/login only when there's no refresh token to use, or the refresh itself fails.
 *
 * Self-contained by design (no app-specific AuthStore dependency, reads/writes the
 * same localStorage keys every app already shares) so a single instance can be
 * registered once by the app that actually owns the HttpClient instance in use.
 *
 * In this workspace that's `web-landing`: web-company/web-admin/web-courier are
 * Module Federation remotes that only expose `app.routes.ts`, not `app.config.ts` --
 * when loaded as routes inside web-landing's shell (the only way this app is ever
 * actually run) they share the shell's single HttpClient, so only the interceptor
 * registered in web-landing's own app.config.ts ever executes, regardless of which
 * remote's component issued the request. Each remote still registers this same
 * interceptor in its own app.config.ts too, purely so it keeps working if that
 * remote is ever bootstrapped standalone (each has its own main.ts for exactly that) --
 * without this shared factory, that fallback path would mean hand-copying the same
 * refresh logic into every remote, which is how it silently drifted out of sync
 * before this was extracted.
 */
export function provideAuthInterceptor(apiUrl: string): HttpInterceptorFn {
  return (req, next) => {
    const router = inject(Router);
    const http = inject(HttpClient);

    const isApiRequest = req.url.startsWith(apiUrl);
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
          refreshInFlight = performRefresh(http, apiUrl).finally(() => {
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
}
