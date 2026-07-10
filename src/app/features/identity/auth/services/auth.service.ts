import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iRegisterRequest } from '../interfaces/register-request';
import { iLoginRequest } from '../interfaces/login-request';
import { iLoginResponse } from '../interfaces/login-response';
import { iRefreshRequest } from '../interfaces/refresh-request';
import { iLogoutRequest } from '../interfaces/logout-request';
import { iVerifyEmailRequest } from '../interfaces/verify-email-request';
import { iForgotPasswordRequest } from '../interfaces/forgot-password-request';
import { iResetPasswordRequest } from '../interfaces/reset-password-request';

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _http = inject(HttpClient);

  register(request: iRegisterRequest): Observable<iUserResponse> {
    return this._http.post<iUserResponse>(`${AUTH_BASE_URL}/register`, request);
  }

  login(request: iLoginRequest): Observable<iLoginResponse> {
    return this._http.post<iLoginResponse>(`${AUTH_BASE_URL}/login`, request);
  }

  refresh(request: iRefreshRequest): Observable<iLoginResponse> {
    return this._http.post<iLoginResponse>(`${AUTH_BASE_URL}/refresh`, request);
  }

  logout(request: iLogoutRequest): Observable<void> {
    return this._http.post<void>(`${AUTH_BASE_URL}/logout`, request);
  }

  verifyEmail(request: iVerifyEmailRequest): Observable<iUserResponse> {
    return this._http.post<iUserResponse>(`${AUTH_BASE_URL}/verify-email`, request);
  }

  forgotPassword(request: iForgotPasswordRequest): Observable<void> {
    return this._http.post<void>(`${AUTH_BASE_URL}/forgot-password`, request);
  }

  resetPassword(request: iResetPasswordRequest): Observable<void> {
    return this._http.post<void>(`${AUTH_BASE_URL}/reset-password`, request);
  }
}
