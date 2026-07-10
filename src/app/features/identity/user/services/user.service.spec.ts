import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { iUserResponse } from '../interfaces/user-response';
import { iDataExportResponse } from '../interfaces/data-export-response';

const USERS_BASE_URL = '/api/v1/users';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const dataExport: iDataExportResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  taxId: '123456789',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  consentGivenAt: '2026-01-01T00:00:00Z',
  auditHistory: [{ eventType: 'AccountCreated', occurredAt: '2026-01-01T00:00:00Z' }],
};

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getMe() GETs /users/me', () => {
    service.getMe().subscribe((response) => expect(response).toEqual(user));

    const req = httpMock.expectOne(`${USERS_BASE_URL}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(user);
  });

  it('deleteMe() DELETEs /users/me', () => {
    service.deleteMe().subscribe((response) => expect(response).toBeNull());

    const req = httpMock.expectOne(`${USERS_BASE_URL}/me`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('exportMyData() GETs /users/me/data-export', () => {
    service.exportMyData().subscribe((response) => expect(response).toEqual(dataExport));

    const req = httpMock.expectOne(`${USERS_BASE_URL}/me/data-export`);
    expect(req.request.method).toBe('GET');
    req.flush(dataExport);
  });
});
