import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iRegisterRequest } from '../interfaces/register-request';

const REGISTER_URL = `${API_BASE_URL}/auth/register`;

@Injectable({ providedIn: 'root' })
export class RegisterService {
  private readonly _http = inject(HttpClient);

  register(request: iRegisterRequest): Observable<iUserResponse> {
    return this._http.post<iUserResponse>(REGISTER_URL, request, { withCredentials: true });
  }
}
