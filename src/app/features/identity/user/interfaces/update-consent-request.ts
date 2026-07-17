import { ConsentPurpose } from '../types/consent-purpose';

export interface iUpdateConsentRequest {
  purpose: ConsentPurpose;
  granted: boolean;
}
