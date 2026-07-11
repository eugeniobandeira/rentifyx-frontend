import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { BaseHttpService } from '@shared/services/base-http.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iRegisterRequest } from '../interfaces/register-request';

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly _baseHttp = inject(BaseHttpService);
  private readonly _API_URL = `${environment.apiUrl}/auth/register`;

  register(request: iRegisterRequest): Observable<iUserResponse> {
    return this._baseHttp.post<iUserResponse, iRegisterRequest>(this._API_URL, request, {
      withCredentials: true,
    });
  }
}
