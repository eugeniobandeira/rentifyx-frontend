import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iAuthTokenResponse } from '@features/identity/auth/session/interfaces/auth-token-response';
import { iLoginRequest } from '../interfaces/login-request';

const LOGIN_URL = `${API_BASE_URL}/auth/login`;

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly _http = inject(HttpClient);

  login(request: iLoginRequest): Observable<iAuthTokenResponse> {
    return this._http.post<iAuthTokenResponse>(LOGIN_URL, request, { withCredentials: true });
  }
}
