import { inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { UserRole } from '@features/identity/user/types/user-role';
import { DEFAULT_REGISTER_ROLE, PASSWORD_PATTERN } from './register.constants';

type RegisterFormControl = {
  email: FormControl<string>;
  taxId: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<UserRole>;
  consentGiven: FormControl<boolean>;
};

export function createRegisterFormControl(): FormGroup<RegisterFormControl> {
  const fb = inject(NonNullableFormBuilder);

  return fb.group({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email, Validators.maxLength(320)],
      nonNullable: true,
    }),
    taxId: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
        Validators.pattern(PASSWORD_PATTERN),
      ],
      nonNullable: true,
    }),
    role: new FormControl<UserRole>(DEFAULT_REGISTER_ROLE, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    consentGiven: new FormControl(false, {
      validators: [Validators.requiredTrue],
      nonNullable: true,
    }),
  });
}

export type RegisterFormGroup = ReturnType<typeof createRegisterFormControl>;
export type RegisterFormValue = ReturnType<RegisterFormGroup['getRawValue']>;
