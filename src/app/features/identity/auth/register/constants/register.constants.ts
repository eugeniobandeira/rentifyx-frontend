import { UserRole } from '@features/identity/user/types/user-role';

export const FORM_FIELD_NAMES = ['email', 'taxId', 'password', 'role', 'consentGiven'] as const;

export const DEFAULT_REGISTER_ROLE: UserRole = 'Renter';
