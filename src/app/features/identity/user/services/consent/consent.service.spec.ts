import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConsentService } from './consent.service';
import { iConsentResponse } from '../../interfaces/consent-response';

const CONSENT_URL = 'http://localhost:5000/api/v1/users/me/consent';

const consent: iConsentResponse = {
  essentialGranted: true,
  essentialGrantedAt: '2026-01-01T00:00:00Z',
  essentialRevokedAt: null,
  marketingGranted: false,
  marketingGrantedAt: null,
  marketingRevokedAt: null,
};

describe('ConsentService', () => {
  let service: ConsentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConsentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getConsent() GETs /users/me/consent', () => {
    service.getConsent().subscribe((response) => expect(response).toEqual(consent));

    const req = httpMock.expectOne(CONSENT_URL);
    expect(req.request.method).toBe('GET');
    req.flush(consent);
  });

  it('updateConsent() PUTs /users/me/consent with the purpose and granted flag', () => {
    service.updateConsent('Marketing', true).subscribe((response) => expect(response).toEqual(consent));

    const req = httpMock.expectOne(CONSENT_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ purpose: 'Marketing', granted: true });
    req.flush(consent);
  });
});
