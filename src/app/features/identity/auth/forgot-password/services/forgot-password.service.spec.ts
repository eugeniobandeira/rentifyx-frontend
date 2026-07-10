import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ForgotPasswordService } from './forgot-password.service';

const AUTH_BASE_URL = '/api/v1/auth';

describe('ForgotPasswordService', () => {
  let service: ForgotPasswordService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ForgotPasswordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('forgotPassword() POSTs to /auth/forgot-password with withCredentials', () => {
    service
      .forgotPassword({ email: 'jane@example.com' })
      .subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${AUTH_BASE_URL}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush(null);
  });
});
