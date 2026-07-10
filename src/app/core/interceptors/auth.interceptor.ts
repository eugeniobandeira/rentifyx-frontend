import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { SessionService } from '@core/services/session.service';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';

const AUTH_BASE_URL = `${API_BASE_URL}/auth/`;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const isAuthEndpoint = req.url.startsWith(AUTH_BASE_URL);

  const authorizedReq = isAuthEndpoint ? req : _attachToken(req, sessionService);

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
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
