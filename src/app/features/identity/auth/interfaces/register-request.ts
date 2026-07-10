export interface RegisterRequest {
  email: string;
  taxId: string;
  password: string;
  role: 'Owner' | 'Renter' | 'Admin';
  consentGiven: true;
}
