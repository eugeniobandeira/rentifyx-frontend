import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { BaseHttpService } from '@shared/services/base-http.service';
import { iAuthTokenResponse } from '../../interfaces/auth-token-response';
import { iRefreshRequest } from '../../interfaces/refresh-request';
import { iLogoutRequest } from '../../interfaces/logout-request';

@Injectable({ providedIn: 'root' })
export class SessionApiService {
  private readonly _baseHttp = inject(BaseHttpService);
  private readonly _API_URL = `${environment.apiUrl}/auth`;

  refresh(request: iRefreshRequest): Observable<iAuthTokenResponse> {
    return this._baseHttp.post<iAuthTokenResponse, iRefreshRequest>(
      `${this._API_URL}/refresh`,
      request,
      { withCredentials: true },
    );
  }

  logout(request: iLogoutRequest): Observable<void> {
    return this._baseHttp.post<void, iLogoutRequest>(`${this._API_URL}/logout`, request, {
      withCredentials: true,
    });
  }
}
