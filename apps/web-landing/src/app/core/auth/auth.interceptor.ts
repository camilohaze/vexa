import { HttpInterceptorFn } from '@angular/common/http';
import { AuthTokens } from '@vexa/shared';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'vexa.tokens';

/**
 * Federated remotes (web-company/web-admin/web-courier) register their own auth
 * interceptors, but those only apply when a remote bootstraps standalone — when
 * loaded as routes inside this shell they share the shell's single HttpClient, so
 * only an interceptor registered here ever runs. All remotes read/write the same
 * localStorage session keys, so this interceptor covers every one of them.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl) || req.headers.has('Authorization')) return next(req);
  let token: string | undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    token = raw ? (JSON.parse(raw) as AuthTokens).accessToken : undefined;
  } catch {
    token = undefined;
  }
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
