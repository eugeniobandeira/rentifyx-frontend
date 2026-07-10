import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { httpErrorClassifierInterceptor } from './http-error-classifier.interceptor';

describe('httpErrorClassifierInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorClassifierInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function captureError(): { error?: iClassifiedHttpError } {
    const result: { error?: iClassifiedHttpError } = {};
    http.get('/api/v1/whatever').subscribe({
      next: () => expect.unreachable('expected an error'),
      error: (error: iClassifiedHttpError) => (result.error = error),
    });
    return result;
  }

  it('passes successful responses through untouched', () => {
    let response: unknown;
    http.get('/api/v1/whatever').subscribe((res) => (response = res));

    httpMock.expectOne('/api/v1/whatever').flush({ ok: true });

    expect(response).toEqual({ ok: true });
  });

  it('classifies a 401 as unauthorized, using the backend title as the message', () => {
    const result = captureError();

    httpMock.expectOne('/api/v1/whatever').flush(
      { title: 'Invalid credentials.', status: 401, extensions: { correlationId: 'abc-123' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(result.error).toEqual({
      kind: 'unauthorized',
      status: 401,
      message: 'Invalid credentials.',
      correlationId: 'abc-123',
      validationErrors: null,
    });
  });

  it('classifies a 422 as validation, carrying the field errors', () => {
    const result = captureError();

    httpMock.expectOne('/api/v1/whatever').flush(
      {
        title: 'Validation failed',
        status: 422,
        errors: { email: ['Email is required.'] },
        extensions: { correlationId: 'abc-123' },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(result.error).toEqual({
      kind: 'validation',
      status: 422,
      message: 'Validation failed',
      correlationId: 'abc-123',
      validationErrors: { email: ['Email is required.'] },
    });
  });

  it('classifies a 409 as conflict', () => {
    const result = captureError();

    httpMock
      .expectOne('/api/v1/whatever')
      .flush(
        { title: 'Already registered.', status: 409, extensions: { correlationId: null } },
        { status: 409, statusText: 'Conflict' },
      );

    expect(result.error?.kind).toBe('conflict');
    expect(result.error?.message).toBe('Already registered.');
  });

  it('classifies a 429 with a generic rate-limit message, ignoring any body title', () => {
    const result = captureError();

    httpMock.expectOne('/api/v1/whatever').flush({}, { status: 429, statusText: 'Too Many Requests' });

    expect(result.error).toEqual({
      kind: 'rate-limit',
      status: 429,
      message: 'Too many attempts — try again shortly',
      correlationId: null,
      validationErrors: null,
    });
  });

  it('classifies status 0 (offline/CORS) as network', () => {
    const result = captureError();

    httpMock.expectOne('/api/v1/whatever').error(new ProgressEvent('error'), { status: 0 });

    expect(result.error).toEqual({
      kind: 'network',
      status: 0,
      message: "Couldn't reach the server, check your connection",
      correlationId: null,
      validationErrors: null,
    });
  });

  it('classifies an unmapped status (e.g. 500) as server, falling back to a generic message', () => {
    const result = captureError();

    httpMock.expectOne('/api/v1/whatever').flush({}, { status: 500, statusText: 'Internal Server Error' });

    expect(result.error).toEqual({
      kind: 'server',
      status: 500,
      message: 'Something went wrong, try again',
      correlationId: null,
      validationErrors: null,
    });
  });

  it('maps 400 and 404 to distinct bad-request/not-found kinds (for callers to combine as needed)', () => {
    const badRequest = captureError();
    httpMock.expectOne('/api/v1/whatever').flush({}, { status: 400, statusText: 'Bad Request' });
    expect(badRequest.error?.kind).toBe('bad-request');

    const notFound = captureError();
    httpMock.expectOne('/api/v1/whatever').flush({}, { status: 404, statusText: 'Not Found' });
    expect(notFound.error?.kind).toBe('not-found');
  });
});
