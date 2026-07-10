export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{}|;:,.<>?]).+$/;

export const FORM_FIELD_NAMES = ['email', 'taxId', 'password', 'role', 'consentGiven'] as const;
