import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ResetPasswordService } from './reset-password.service';

const AUTH_BASE_URL = '/api/v1/auth';

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ResetPasswordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('resetPassword() POSTs to /auth/reset-password with withCredentials', () => {
    service
      .resetPassword({ email: 'jane@example.com', token: 'reset-token', newPassword: 'N3w$ecret!!' })
      .subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });
});
