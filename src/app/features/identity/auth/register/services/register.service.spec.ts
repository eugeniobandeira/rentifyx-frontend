import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegisterService } from './register.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';

const AUTH_BASE_URL = '/api/v1/auth';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('RegisterService', () => {
  let service: RegisterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegisterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('register() POSTs to /auth/register with withCredentials', () => {
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
    expect(req.request.withCredentials).toBe(true);
    req.flush(user);
  });
});
