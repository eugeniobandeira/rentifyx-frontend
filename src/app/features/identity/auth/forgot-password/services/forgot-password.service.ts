import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iForgotPasswordRequest } from '../interfaces/forgot-password-request';

@Injectable({ providedIn: 'root' })
export class ForgotPasswordService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/auth/forgot-password`;

  forgotPassword(request: iForgotPasswordRequest): Observable<void> {
    return this._http.post<void>(this._API_URL, request, { withCredentials: true });
  }
}
