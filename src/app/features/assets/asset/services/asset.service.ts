import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iSearchAssetsRequest } from '../interfaces/search-assets-request';
import { iSearchAssetsResponse } from '../interfaces/search-assets-response';
import { iGetAssetByIdResponse } from '../interfaces/get-asset-by-id-response';
import { iCreateAssetRequest } from '../interfaces/create-asset-request';
import { iCreateAssetResponse } from '../interfaces/create-asset-response';
import { iAssetModerationResponse } from '../interfaces/asset-moderation-response';
import { iAdminReviewAssetRequest } from '../interfaces/admin-review-asset-request';
import { iAdminSearchAssetsRequest } from '../interfaces/admin-search-assets-request';
import { iAdminSearchAssetsResponse } from '../interfaces/admin-search-assets-response';
import { AssetStatus } from '../types/asset-status';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.assetRegistryApiUrl}/assets`;

  search(request: iSearchAssetsRequest): Observable<iSearchAssetsResponse> {
    let params = new HttpParams().set('pageSize', request.pageSize);

    if (request.nextPageToken) params = params.set('nextPageToken', request.nextPageToken);
    if (request.categoryId) params = params.set('categoryId', request.categoryId);
    if (request.minPrice !== undefined) params = params.set('minPrice', request.minPrice);
    if (request.maxPrice !== undefined) params = params.set('maxPrice', request.maxPrice);
    if (request.keyword) params = params.set('keyword', request.keyword);

    return this._http.get<iSearchAssetsResponse>(this._API_URL, { params });
  }

  getById(id: string): Observable<iGetAssetByIdResponse> {
    return this._http.get<iGetAssetByIdResponse>(`${this._API_URL}/${id}`);
  }

  create(request: iCreateAssetRequest): Observable<iCreateAssetResponse> {
    return this._http.post<iCreateAssetResponse>(this._API_URL, request);
  }

  submitForModeration(assetId: string): Observable<iAssetModerationResponse> {
    return this._http.post<iAssetModerationResponse>(
      `${this._API_URL}/${assetId}/submit-for-moderation`,
      {},
    );
  }

  adminReview(assetId: string, request: iAdminReviewAssetRequest): Observable<iAssetModerationResponse> {
    return this._http.post<iAssetModerationResponse>(
      `${this._API_URL}/${assetId}/admin-review`,
      request,
    );
  }

  adminSearch(request: iAdminSearchAssetsRequest): Observable<iAdminSearchAssetsResponse> {
    let params = new HttpParams()
      .set('pageSize', request.pageSize)
      .set('status', AssetStatus[request.status]);

    if (request.nextPageToken) params = params.set('nextPageToken', request.nextPageToken);
    if (request.categoryId) params = params.set('categoryId', request.categoryId);
    if (request.minPrice !== undefined) params = params.set('minPrice', request.minPrice);
    if (request.maxPrice !== undefined) params = params.set('maxPrice', request.maxPrice);
    if (request.keyword) params = params.set('keyword', request.keyword);

    return this._http.get<iAdminSearchAssetsResponse>(`${this._API_URL}/admin-search`, { params });
  }
}
