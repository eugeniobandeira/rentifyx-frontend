import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@app/environment/environment';
import { AssetService } from './asset.service';
import { iSearchAssetsResponse } from '../interfaces/search-assets-response';
import { iGetAssetByIdResponse } from '../interfaces/get-asset-by-id-response';
import { iCreateAssetRequest } from '../interfaces/create-asset-request';
import { iCreateAssetResponse } from '../interfaces/create-asset-response';
import { iAssetModerationResponse } from '../interfaces/asset-moderation-response';
import { AssetStatus } from '../types/asset-status';

const ASSETS_URL = `${environment.assetRegistryApiUrl}/assets`;

const searchResponse: iSearchAssetsResponse = {
  items: [
    { id: 'asset-1', title: 'Compact Excavator', price: 285, categoryId: 'cat-1', status: AssetStatus.Active },
  ],
  nextPageToken: null,
};

const assetDetail: iGetAssetByIdResponse = {
  id: 'asset-1',
  title: 'Compact Excavator',
  description: 'A well-maintained compact excavator.',
  price: 285,
  categoryId: 'cat-1',
  ownerId: 'owner-1',
  status: AssetStatus.Active,
  createdAt: '2026-07-20T14:32:00Z',
};

describe('AssetService', () => {
  let service: AssetService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AssetService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('search() GETs /assets with only pageSize when no optional filters are given', () => {
    service.search({ pageSize: 20 }).subscribe((response) => expect(response).toEqual(searchResponse));

    const req = httpMock.expectOne((r) => r.url === ASSETS_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.has('categoryId')).toBe(false);
    expect(req.request.params.has('keyword')).toBe(false);
    req.flush(searchResponse);
  });

  it('search() includes every optional filter as a query param when provided', () => {
    service
      .search({
        pageSize: 10,
        nextPageToken: 'token-abc',
        categoryId: 'cat-1',
        minPrice: 100,
        maxPrice: 500,
        keyword: 'excavator',
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === ASSETS_URL);
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('nextPageToken')).toBe('token-abc');
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('minPrice')).toBe('100');
    expect(req.request.params.get('maxPrice')).toBe('500');
    expect(req.request.params.get('keyword')).toBe('excavator');
    req.flush(searchResponse);
  });

  it('getById() GETs /assets/{id}', () => {
    service.getById('asset-1').subscribe((response) => expect(response).toEqual(assetDetail));

    const req = httpMock.expectOne(`${ASSETS_URL}/asset-1`);
    expect(req.request.method).toBe('GET');
    req.flush(assetDetail);
  });

  it('create() POSTs /assets with the request body', () => {
    const request: iCreateAssetRequest = {
      title: 'Compact Excavator',
      description: 'A well-maintained compact excavator.',
      price: 285,
      categoryId: 'cat-1',
      idempotencyKey: 'idem-1',
    };
    const response: iCreateAssetResponse = {
      assetId: 'asset-1',
      status: AssetStatus.Draft,
      createdAt: '2026-07-27T10:00:00Z',
    };

    service.create(request).subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(ASSETS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(response);
  });

  it('submitForModeration() POSTs /assets/{id}/submit-for-moderation with an empty body', () => {
    const response: iAssetModerationResponse = { assetId: 'asset-1', status: AssetStatus.PendingModeration };

    service.submitForModeration('asset-1').subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(`${ASSETS_URL}/asset-1/submit-for-moderation`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(response);
  });

  it('adminReview() POSTs /assets/{id}/admin-review with approve/reason', () => {
    const response: iAssetModerationResponse = { assetId: 'asset-1', status: AssetStatus.Active };

    service
      .adminReview('asset-1', { approve: true, reason: 'Looks good.' })
      .subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne(`${ASSETS_URL}/asset-1/admin-review`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ approve: true, reason: 'Looks good.' });
    req.flush(response);
  });

  it('adminSearch() GETs /assets/admin-search with pageSize and status name', () => {
    const response = { items: [], nextPageToken: null };

    service
      .adminSearch({ pageSize: 20, status: AssetStatus.PendingModeration })
      .subscribe((res) => expect(res).toEqual(response));

    const req = httpMock.expectOne((r) => r.url === `${ASSETS_URL}/admin-search`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.get('status')).toBe('PendingModeration');
    req.flush(response);
  });

  it('adminSearch() includes every optional filter as a query param when provided', () => {
    service
      .adminSearch({
        pageSize: 10,
        status: AssetStatus.Archived,
        nextPageToken: 'token-abc',
        categoryId: 'cat-1',
        minPrice: 100,
        maxPrice: 500,
        keyword: 'excavator',
      })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === `${ASSETS_URL}/admin-search`);
    expect(req.request.params.get('status')).toBe('Archived');
    expect(req.request.params.get('nextPageToken')).toBe('token-abc');
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('minPrice')).toBe('100');
    expect(req.request.params.get('maxPrice')).toBe('500');
    expect(req.request.params.get('keyword')).toBe('excavator');
    req.flush({ items: [], nextPageToken: null });
  });
});
