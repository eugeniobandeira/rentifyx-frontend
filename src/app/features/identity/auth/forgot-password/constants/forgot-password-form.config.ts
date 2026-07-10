import { inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';

type ForgotPasswordFormControl = {
  email: FormControl<string>;
};

export function createForgotPasswordFormControl(): FormGroup<ForgotPasswordFormControl> {
  const fb = inject(NonNullableFormBuilder);

  return fb.group({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email, Validators.maxLength(320)],
      nonNullable: true,
    }),
  });
}

export type ForgotPasswordFormGroup = ReturnType<typeof createForgotPasswordFormControl>;
export type ForgotPasswordFormValue = ReturnType<ForgotPasswordFormGroup['getRawValue']>;
