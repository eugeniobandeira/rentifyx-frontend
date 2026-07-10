import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iAuthTokenResponse } from '@features/identity/auth/session/interfaces/auth-token-response';
import { iLoginRequest } from '../interfaces/login-request';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/auth/login`;

  login(request: iLoginRequest): Observable<iAuthTokenResponse> {
    return this._http.post<iAuthTokenResponse>(this._API_URL, request, { withCredentials: true });
  }
}
