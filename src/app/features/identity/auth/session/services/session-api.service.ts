import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iAuthTokenResponse } from '../interfaces/auth-token-response';
import { iRefreshRequest } from '../interfaces/refresh-request';
import { iLogoutRequest } from '../interfaces/logout-request';

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const WITH_CREDENTIALS = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly _http = inject(HttpClient);

  refresh(request: iRefreshRequest): Observable<iAuthTokenResponse> {
    return this._http.post<iAuthTokenResponse>(
      `${AUTH_BASE_URL}/refresh`,
      request,
      WITH_CREDENTIALS,
    );
  }

  logout(request: iLogoutRequest): Observable<void> {
    return this._http.post<void>(`${AUTH_BASE_URL}/logout`, request, WITH_CREDENTIALS);
  }
}
