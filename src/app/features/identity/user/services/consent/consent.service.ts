import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@app/environment/environment';
import { iConsentResponse } from '../../interfaces/consent-response';
import { iUpdateConsentRequest } from '../../interfaces/update-consent-request';
import { ConsentPurpose } from '../../types/consent-purpose';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly _http = inject(HttpClient);
  private readonly _API_URL = `${environment.apiUrl}/users/me/consent`;

  getConsent(): Observable<iConsentResponse> {
    return this._http.get<iConsentResponse>(this._API_URL);
  }

  updateConsent(purpose: ConsentPurpose, granted: boolean): Observable<iConsentResponse> {
    const request: iUpdateConsentRequest = { purpose, granted };
    return this._http.put<iConsentResponse>(this._API_URL, request);
  }
}
