import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iUserResponse } from '../interfaces/user-response';
import { iDataExportResponse } from '../interfaces/data-export-response';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/users`;

  getMe(): Observable<iUserResponse> {
    return this._http.get<iUserResponse>(`${this._API_URL}/me`);
  }

  deleteMe(): Observable<void> {
    return this._http.delete<void>(`${this._API_URL}/me`);
  }

  exportMyData(): Observable<iDataExportResponse> {
    return this._http.get<iDataExportResponse>(`${this._API_URL}/me/data-export`);
  }
}
