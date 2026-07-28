import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { HttpErrorKind } from '@shared/types/http-error-kind';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { iApiErrorResponse } from '@shared/interfaces/api-error-response';
import { iValidationErrorResponse } from '@shared/interfaces/validation-error-response';

const STATUS_KIND_MAP: Record<number, HttpErrorKind> = {
  400: 'bad-request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
  422: 'validation',
  429: 'rate-limit',
};

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/i18n/')) {
    return next(req);
  }

  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      return throwError(() => _classify(error, translate));
    }),
  );
};

function _classify(error: HttpErrorResponse, translate: TranslateService): iClassifiedHttpError {
  if (error.status === 0) {
    return {
      kind: 'network',
      status: 0,
      message: translate.instant('common.httpError.network'),
      correlationId: null,
      validationErrors: null,
    };
  }

  const kind = STATUS_KIND_MAP[error.status] ?? 'server';

  if (kind === 'validation') {
    const body = error.error as iValidationErrorResponse | null;
    return {
      kind,
      status: error.status,
      message: body?.title ?? translate.instant('common.httpError.server'),
      correlationId: body?.extensions?.correlationId ?? null,
      validationErrors: body?.errors ?? null,
    };
  }

  const body = error.error as iApiErrorResponse | null;
  const fallbackMessage = translate.instant(
    kind === 'forbidden' ? 'common.httpError.forbidden' : 'common.httpError.server',
  );
  const message =
    kind === 'rate-limit' ? translate.instant('common.httpError.rateLimit') : (body?.title ?? fallbackMessage);

  return {
    kind,
    status: error.status,
    message,
    correlationId: body?.extensions?.correlationId ?? null,
    validationErrors: null,
  };
}
