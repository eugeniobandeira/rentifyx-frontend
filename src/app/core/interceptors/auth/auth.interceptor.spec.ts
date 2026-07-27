import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { environment } from '@app/environment/environment';

const AUTH_BASE_URL = `${environment.identityApiUrl}/auth`;
const USERS_ME_URL = `${environment.identityApiUrl}/users/me`;

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  essentialConsentGranted: true,
  essentialConsentGivenAt: '2026-01-01T00:00:00Z',
  essentialConsentRevokedAt: null,
  marketingConsentGranted: false,
  marketingConsentGivenAt: null,
  marketingConsentRevokedAt: null,
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockSessionService: {
    accessToken: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSessionService = {
      accessToken: vi.fn().mockReturnValue('access-token'),
      refresh: vi.fn().mockReturnValue(of(user)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: mockSessionService },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('attaches Authorization: Bearer {token} to non-auth requests', () => {
    http.get(`${USERS_ME_URL}`).subscribe();

    const req = httpMock.expectOne(`${USERS_ME_URL}`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    req.flush(user);
  });

  it('does not attach a token for the 7 unauthenticated /auth/* endpoints', () => {
    const endpoints = [
      'register',
      'login',
      'refresh',
      'logout',
      'verify-email',
      'forgot-password',
      'reset-password',
    ];

    for (const endpoint of endpoints) {
      http.post(`${AUTH_BASE_URL}/${endpoint}`, {}).subscribe();
      const req = httpMock.expectOne(`${AUTH_BASE_URL}/${endpoint}`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush(null);
    }

    expect(mockSessionService.accessToken).not.toHaveBeenCalled();
  });

  it('on 401 from a non-auth request, refreshes once and retries with the new token', () => {
    mockSessionService.accessToken
      .mockReturnValueOnce('expired-token')
      .mockReturnValue('new-token');

    http.get(`${USERS_ME_URL}`).subscribe((response) => expect(response).toEqual(user));

    const firstReq = httpMock.expectOne(`${USERS_ME_URL}`);
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer expired-token');
    firstReq.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(mockSessionService.refresh).toHaveBeenCalledTimes(1);

    const retryReq = httpMock.expectOne(`${USERS_ME_URL}`);
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush(user);
  });

  it('on 401 with refresh failure, propagates the error without retrying', () => {
    mockSessionService.refresh.mockReturnValue(throwError(() => new Error('refresh failed')));

    let caughtError: unknown;
    http.get(`${USERS_ME_URL}`).subscribe({
      next: () => expect.unreachable('expected an error'),
      error: (error) => (caughtError = error),
    });

    const req = httpMock.expectOne(`${USERS_ME_URL}`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(mockSessionService.refresh).toHaveBeenCalledTimes(1);
    expect(caughtError).toBeDefined();
    httpMock.expectNone(`${USERS_ME_URL}`);
  });

  it('on 401 from /auth/refresh itself, does not attempt another refresh', () => {
    let caughtError: unknown;
    http.post(`${AUTH_BASE_URL}/refresh`, {}).subscribe({
      next: () => expect.unreachable('expected an error'),
      error: (error) => (caughtError = error),
    });

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/refresh`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(mockSessionService.refresh).not.toHaveBeenCalled();
    expect(caughtError).toBeDefined();
  });

  it('on 401 from another /auth/* endpoint (e.g. login), does not attempt refresh', () => {
    let caughtError: unknown;
    http.post(`${AUTH_BASE_URL}/login`, {}).subscribe({
      next: () => expect.unreachable('expected an error'),
      error: (error) => (caughtError = error),
    });

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/login`);
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(mockSessionService.refresh).not.toHaveBeenCalled();
    expect(caughtError).toBeDefined();
  });

  it('does not attach a token to a request to an unknown host (e.g. a direct-to-S3 upload)', () => {
    http.put('https://rentifyx-media.s3.amazonaws.com/assets/photo.jpg?X-Amz-Signature=abc', {}).subscribe();

    const req = httpMock.expectOne(
      'https://rentifyx-media.s3.amazonaws.com/assets/photo.jpg?X-Amz-Signature=abc',
    );
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(mockSessionService.accessToken).not.toHaveBeenCalled();
    req.flush(null);
  });

  it('does not attach an Authorization header when there is no access token', () => {
    mockSessionService.accessToken.mockReturnValue(null);

    http.get(`${USERS_ME_URL}`).subscribe();

    const req = httpMock.expectOne(`${USERS_ME_URL}`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(user);
  });
});
