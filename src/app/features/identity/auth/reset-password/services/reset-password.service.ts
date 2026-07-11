import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { BaseHttpService } from '@shared/services/base-http.service';
import { iResetPasswordRequest } from '../interfaces/reset-password-request';

@Injectable({ providedIn: 'root' })
export class ResetPasswordService {
  private readonly _baseHttp = inject(BaseHttpService);
  private readonly _API_URL = `${environment.apiUrl}/auth/reset-password`;

  resetPassword(request: iResetPasswordRequest): Observable<void> {
    return this._baseHttp.post<void, iResetPasswordRequest>(this._API_URL, request, {
      withCredentials: true,
    });
  }
}
