import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BaseHttpService } from './base-http.service';

interface iTestRequest {
  email: string;
}

interface iTestResponse {
  ok: boolean;
}

describe('BaseHttpService', () => {
  let service: BaseHttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BaseHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('post() sends the body to the given URL and returns the typed response', () => {
    const body: iTestRequest = { email: 'jane@example.com' };

    service
      .post<iTestResponse, iTestRequest>('/api/v1/test', body)
      .subscribe((response) => expect(response).toEqual({ ok: true }));

    const req = httpMock.expectOne('/api/v1/test');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.withCredentials).toBe(false);
    req.flush({ ok: true });
  });

  it('post() forwards withCredentials when provided', () => {
    service
      .post<iTestResponse, iTestRequest>(
        '/api/v1/test',
        { email: 'jane@example.com' },
        { withCredentials: true },
      )
      .subscribe();

    const req = httpMock.expectOne('/api/v1/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });
  });
});
