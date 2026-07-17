import { UserRole } from '../types/user-role';
import { UserStatus } from '../types/user-status';

export interface iUserResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  essentialConsentGranted: boolean;
  essentialConsentGivenAt: string | null;
  essentialConsentRevokedAt: string | null;
  marketingConsentGranted: boolean;
  marketingConsentGivenAt: string | null;
  marketingConsentRevokedAt: string | null;
}
