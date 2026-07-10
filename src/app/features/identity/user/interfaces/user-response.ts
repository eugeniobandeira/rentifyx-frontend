export type UserRole = 'Owner' | 'Renter' | 'Admin';
export type UserStatus = 'PendingVerification' | 'Active' | 'Deleted';

export interface iUserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
