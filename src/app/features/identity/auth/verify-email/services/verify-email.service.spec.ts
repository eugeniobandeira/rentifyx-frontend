import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VerifyEmailService } from './verify-email.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';

const AUTH_BASE_URL = 'http://localhost:5000/api/v1/auth';

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

describe('VerifyEmailService', () => {
  let service: VerifyEmailService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VerifyEmailService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('verifyEmail() POSTs to /auth/verify-email with withCredentials', () => {
    service
      .verifyEmail({ email: 'jane@example.com', token: 'verify-token' })
      .subscribe((response) => expect(response).toEqual(user));

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/verify-email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(user);
  });
});
