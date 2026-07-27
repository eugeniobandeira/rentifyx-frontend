import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { environment } from '@app/environment/environment';

const AUTH_BASE_URL = `${environment.identityApiUrl}/auth/`;

// Only our own backends - never attach a Bearer token to a request to any other host (e.g. a
// direct-to-S3 presigned upload PUT). Without this check every outgoing request got the token,
// which never mattered until the first non-backend HTTP call (media upload) needed one not to.
const KNOWN_API_PREFIXES = [environment.identityApiUrl, environment.assetRegistryApiUrl];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const isAuthEndpoint = req.url.startsWith(AUTH_BASE_URL);
  const isKnownBackend = KNOWN_API_PREFIXES.some((prefix) => req.url.startsWith(prefix));

  const authorizedReq = isKnownBackend && !isAuthEndpoint ? _attachToken(req, sessionService) : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint || !isKnownBackend) {
        return throwError(() => error);
      }

      return sessionService
        .refresh()
        .pipe(switchMap(() => next(_attachToken(req, sessionService))));
    }),
  );
};

function _attachToken(
  req: HttpRequest<unknown>,
  sessionService: SessionService,
): HttpRequest<unknown> {
  const token = sessionService.accessToken();
  if (!token) {
    return req;
  }
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
