import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iCategoryResponse } from '../interfaces/category-response';
import { iCreateCategoryRequest } from '../interfaces/create-category-request';
import { iUpdateCategoryRequest } from '../interfaces/update-category-request';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.assetRegistryApiUrl}/categories`;

  list(): Observable<iCategoryResponse[]> {
    return this._http.get<iCategoryResponse[]>(this._API_URL);
  }

  create(request: iCreateCategoryRequest): Observable<iCategoryResponse> {
    return this._http.post<iCategoryResponse>(this._API_URL, request);
  }

  update(id: string, request: iUpdateCategoryRequest): Observable<iCategoryResponse> {
    return this._http.patch<iCategoryResponse>(`${this._API_URL}/${id}`, request);
  }
}
