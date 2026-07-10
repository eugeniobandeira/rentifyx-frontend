import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/constants/api-base-url.constant';
import { iUserResponse } from '../interfaces/user-response';
import { iDataExportResponse } from '../interfaces/data-export-response';

const USERS_BASE_URL = `${API_BASE_URL}/users`;

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _http = inject(HttpClient);

  getMe(): Observable<iUserResponse> {
    return this._http.get<iUserResponse>(`${USERS_BASE_URL}/me`);
  }

  deleteMe(): Observable<void> {
    return this._http.delete<void>(`${USERS_BASE_URL}/me`);
  }

  exportMyData(): Observable<iDataExportResponse> {
    return this._http.get<iDataExportResponse>(`${USERS_BASE_URL}/me/data-export`);
  }
}
