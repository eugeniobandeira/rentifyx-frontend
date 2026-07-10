import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iVerifyEmailRequest } from '../interfaces/verify-email-request';

@Injectable({ providedIn: 'root' })
export class VerifyEmailService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/auth/verify-email`;

  verifyEmail(request: iVerifyEmailRequest): Observable<iUserResponse> {
    return this._http.post<iUserResponse>(this._API_URL, request, { withCredentials: true });
  }
}
