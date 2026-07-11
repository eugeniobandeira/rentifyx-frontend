import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iAuthTokenResponse } from '../../interfaces/auth-token-response';
import { iRefreshRequest } from '../../interfaces/refresh-request';
import { iLogoutRequest } from '../../interfaces/logout-request';

const WITH_CREDENTIALS = { withCredentials: true };

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/auth`;

  refresh(request: iRefreshRequest): Observable<iAuthTokenResponse> {
    return this._http.post<iAuthTokenResponse>(
      `${this._API_URL}/refresh`,
      request,
      WITH_CREDENTIALS,
    );
  }

  logout(request: iLogoutRequest): Observable<void> {
    return this._http.post<void>(`${this._API_URL}/logout`, request, WITH_CREDENTIALS);
  }
}
