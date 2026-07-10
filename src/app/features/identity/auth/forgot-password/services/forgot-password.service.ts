import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iForgotPasswordRequest } from '../interfaces/forgot-password-request';

const FORGOT_PASSWORD_URL = `${API_BASE_URL}/auth/forgot-password`;

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly _http = inject(HttpClient);

  forgotPassword(request: iForgotPasswordRequest): Observable<void> {
    return this._http.post<void>(FORGOT_PASSWORD_URL, request, { withCredentials: true });
  }
}
