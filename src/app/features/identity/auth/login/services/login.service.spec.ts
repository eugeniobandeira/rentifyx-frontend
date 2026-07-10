import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginService } from './login.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iAuthTokenResponse } from '@features/identity/auth/session/interfaces/auth-token-response';

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

describe('LoginService', () => {
  let service: LoginService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LoginService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('login() POSTs to /auth/login with withCredentials, returns AuthTokenResponse (no refreshToken)', () => {
    service
      .login({ email: 'jane@example.com', password: 'Sup3r$ecret!' })
      .subscribe((response) => expect(response).toEqual(authTokenResponse));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(authTokenResponse);
  });
});
