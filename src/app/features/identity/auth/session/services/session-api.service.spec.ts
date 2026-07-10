import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SessionApiService } from './session-api.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iAuthTokenResponse } from '../interfaces/auth-token-response';

const AUTH_BASE_URL = 'http://localhost:5000/api/v1/auth';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const authTokenResponse: iAuthTokenResponse = {
  accessToken: 'access-token',
  user,
};

describe('SessionApiService', () => {
  let service: SessionApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('refresh() POSTs to /auth/refresh with withCredentials, body has no refreshToken', () => {
    service
      .refresh({ email: 'jane@example.com' })
      .subscribe((response) => expect(response).toEqual(authTokenResponse));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ email: 'jane@example.com' });
    req.flush(authTokenResponse);
  });

  it('logout() POSTs to /auth/logout with withCredentials, body has no refreshToken', () => {
    service.logout({ email: 'jane@example.com' }).subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    expect(req.request.body).toEqual({ email: 'jane@example.com' });
    req.flush(null);
  });
});
