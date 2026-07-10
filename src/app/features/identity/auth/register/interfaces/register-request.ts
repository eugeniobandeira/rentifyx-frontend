import { UserRole } from '@features/identity/user/types/user-role';

export interface iRegisterRequest {
  email: string;
  taxId: string;
  password: string;
  role: UserRole;
  consentGiven: true;
}
