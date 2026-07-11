import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

interface iBaseHttpRequestOptions {
  withCredentials?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BaseHttpService {
  private readonly _http = inject(HttpClient);

  post<TResponse, TRequest = unknown>(
    url: string,
    body: TRequest,
    options?: iBaseHttpRequestOptions,
  ): Observable<TResponse> {
    return this._http.post<TResponse>(url, body, options);
  }
}
