import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iVerifyEmailRequest } from '../interfaces/verify-email-request';

const VERIFY_EMAIL_URL = `${API_BASE_URL}/auth/verify-email`;

@Injectable({ providedIn: 'root' })
export class VerifyEmailService {
  private readonly _http = inject(HttpClient);

  verifyEmail(request: iVerifyEmailRequest): Observable<iUserResponse> {
    return this._http.post<iUserResponse>(VERIFY_EMAIL_URL, request, { withCredentials: true });
  }
}
