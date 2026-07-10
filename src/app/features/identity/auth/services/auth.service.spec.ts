import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iLoginResponse } from '../interfaces/login-response';

const AUTH_BASE_URL = '/api/v1/auth';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const loginResponse: iLoginResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('register() POSTs to /auth/register', () => {
    service
      .register({
        email: 'jane@example.com',
        taxId: '123456789',
        password: 'Sup3r$ecret!',
        role: 'Renter',
        consentGiven: true,
      })
      .subscribe((response) => expect(response).toEqual(user));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/register`);
    expect(req.request.method).toBe('POST');
    req.flush(user);
  });

  it('login() POSTs to /auth/login', () => {
    service
      .login({ email: 'jane@example.com', password: 'Sup3r$ecret!' })
      .subscribe((response) => expect(response).toEqual(loginResponse));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(loginResponse);
  });

  it('refresh() POSTs to /auth/refresh', () => {
    service
      .refresh({ email: 'jane@example.com', refreshToken: 'refresh-token' })
      .subscribe((response) => expect(response).toEqual(loginResponse));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/refresh`);
    expect(req.request.method).toBe('POST');
    req.flush(loginResponse);
  });

  it('logout() POSTs to /auth/logout', () => {
    service
      .logout({ email: 'jane@example.com', refreshToken: 'refresh-token' })
      .subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('verifyEmail() POSTs to /auth/verify-email', () => {
    service
      .verifyEmail({ email: 'jane@example.com', token: 'verify-token' })
      .subscribe((response) => expect(response).toEqual(user));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/verify-email`);
    expect(req.request.method).toBe('POST');
    req.flush(user);
  });

  it('forgotPassword() POSTs to /auth/forgot-password', () => {
    service
      .forgotPassword({ email: 'jane@example.com' })
      .subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/forgot-password`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('resetPassword() POSTs to /auth/reset-password', () => {
    service
      .resetPassword({ email: 'jane@example.com', token: 'reset-token', newPassword: 'N3w$ecret!!' })
      .subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/reset-password`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
