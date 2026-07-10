import { inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { PASSWORD_PATTERN } from './reset-password.constants';

type ResetPasswordFormControl = {
  newPassword: FormControl<string>;
};

export function createResetPasswordFormControl(): FormGroup<ResetPasswordFormControl> {
  const fb = inject(NonNullableFormBuilder);

  return fb.group({
    newPassword: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
        Validators.pattern(PASSWORD_PATTERN),
      ],
      nonNullable: true,
    }),
  });
}

export type ResetPasswordFormGroup = ReturnType<typeof createResetPasswordFormControl>;
export type ResetPasswordFormValue = ReturnType<ResetPasswordFormGroup['getRawValue']>;
