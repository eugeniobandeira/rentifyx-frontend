import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { BaseHttpService } from '@shared/services/base-http.service';
import { iAuthTokenResponse } from '@features/identity/auth/session/interfaces/auth-token-response';
import { iLoginRequest } from '../interfaces/login-request';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly _baseHttp = inject(BaseHttpService);
  private readonly _API_URL = `${environment.apiUrl}/auth/login`;

  login(request: iLoginRequest): Observable<iAuthTokenResponse> {
    return this._baseHttp.post<iAuthTokenResponse, iLoginRequest>(this._API_URL, request, {
      withCredentials: true,
    });
  }
}
