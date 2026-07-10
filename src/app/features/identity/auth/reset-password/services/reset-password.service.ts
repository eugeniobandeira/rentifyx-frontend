import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iResetPasswordRequest } from '../interfaces/reset-password-request';

const RESET_PASSWORD_URL = `${API_BASE_URL}/auth/reset-password`;

@Injectable({ providedIn: 'root' })
export class ResetPasswordService {
  private readonly _http = inject(HttpClient);

  resetPassword(request: iResetPasswordRequest): Observable<void> {
    return this._http.post<void>(RESET_PASSWORD_URL, request, { withCredentials: true });
  }
}
