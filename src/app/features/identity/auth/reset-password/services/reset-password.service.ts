import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iResetPasswordRequest } from '../interfaces/reset-password-request';

@Injectable({ providedIn: 'root' })
export class ResetPasswordService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/auth/reset-password`;

  resetPassword(request: iResetPasswordRequest): Observable<void> {
    return this._http.post<void>(this._API_URL, request, { withCredentials: true });
  }
}
