export interface iRegisterRequest {
  email: string;
  taxId: string;
  password: string;
  role: 'Owner' | 'Renter' | 'Admin';
  consentGiven: true;
}
