import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HttpErrorKind } from '@shared/types/http-error-kind';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { iApiErrorResponse } from '@shared/interfaces/api-error-response';
import { iValidationErrorResponse } from '@shared/interfaces/validation-error-response';

const RATE_LIMIT_MESSAGE = 'Too many attempts — try again shortly';
const NETWORK_ERROR_MESSAGE = "Couldn't reach the server, check your connection";
const SERVER_ERROR_MESSAGE = 'Something went wrong, try again';

const STATUS_KIND_MAP: Record<number, HttpErrorKind> = {
  400: 'bad-request',
  401: 'unauthorized',
  404: 'not-found',
  409: 'conflict',
  422: 'validation',
  429: 'rate-limit',
};

export const httpErrorClassifierInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      return throwError(() => _classify(error));
    }),
  );

function _classify(error: HttpErrorResponse): iClassifiedHttpError {
  if (error.status === 0) {
    return {
      kind: 'network',
      status: 0,
      message: NETWORK_ERROR_MESSAGE,
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
      message: body?.title ?? SERVER_ERROR_MESSAGE,
      correlationId: body?.extensions?.correlationId ?? null,
      validationErrors: body?.errors ?? null,
    };
  }

  const body = error.error as iApiErrorResponse | null;
  const message = kind === 'rate-limit' ? RATE_LIMIT_MESSAGE : (body?.title ?? SERVER_ERROR_MESSAGE);

  return {
    kind,
    status: error.status,
    message,
    correlationId: body?.extensions?.correlationId ?? null,
    validationErrors: null,
  };
}
