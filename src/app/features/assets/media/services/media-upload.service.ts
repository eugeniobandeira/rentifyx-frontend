import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iRequestMediaUploadRequest } from '../interfaces/request-media-upload-request';
import { iRequestMediaUploadResponse } from '../interfaces/request-media-upload-response';
import { iConfirmMediaUploadRequest } from '../interfaces/confirm-media-upload-request';
import { iConfirmMediaUploadResponse } from '../interfaces/confirm-media-upload-response';

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.assetRegistryApiUrl}/assets`;

  requestUpload(
    assetId: string,
    request: iRequestMediaUploadRequest,
  ): Observable<iRequestMediaUploadResponse> {
    return this._http.post<iRequestMediaUploadResponse>(
      `${this._API_URL}/${assetId}/media/upload-request`,
      request,
    );
  }

  /**
   * PUTs the raw file directly to S3 using the presigned URL - a different HTTP-call shape from
   * every other request in this codebase: no BaseHttpService, no Authorization header (the
   * presigned URL itself is the credential; authInterceptor already skips non-backend hosts), and
   * the body is the raw File, not a JSON DTO.
   */
  uploadToS3(uploadUrl: string, file: File): Observable<unknown> {
    const headers = new HttpHeaders({ 'Content-Type': file.type });
    return this._http.put(uploadUrl, file, { headers });
  }

  confirmUpload(
    assetId: string,
    request: iConfirmMediaUploadRequest,
  ): Observable<iConfirmMediaUploadResponse> {
    return this._http.post<iConfirmMediaUploadResponse>(
      `${this._API_URL}/${assetId}/media/confirm`,
      request,
    );
  }
}
