export interface iConsentResponse {
  essentialGranted: boolean;
  essentialGrantedAt: string | null;
  essentialRevokedAt: string | null;
  marketingGranted: boolean;
  marketingGrantedAt: string | null;
  marketingRevokedAt: string | null;
}
