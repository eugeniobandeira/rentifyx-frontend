import { inject } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';

// Mirrors rentifyx-asset-registry-api's ValidationConstants.AssetRules exactly, not guessed.
export const ASSET_TITLE_MIN_LENGTH = 3;
export const ASSET_TITLE_MAX_LENGTH = 100;
export const ASSET_DESCRIPTION_MIN_LENGTH = 10;
export const ASSET_DESCRIPTION_MAX_LENGTH = 2000;

type CreateAssetFormControl = {
  title: FormControl<string>;
  description: FormControl<string>;
  price: FormControl<number | null>;
  categoryId: FormControl<string>;
};

export function createCreateAssetFormControl(): FormGroup<CreateAssetFormControl> {
  const fb = inject(NonNullableFormBuilder);

  return fb.group({
    title: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(ASSET_TITLE_MIN_LENGTH),
        Validators.maxLength(ASSET_TITLE_MAX_LENGTH),
      ],
      nonNullable: true,
    }),
    description: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(ASSET_DESCRIPTION_MIN_LENGTH),
        Validators.maxLength(ASSET_DESCRIPTION_MAX_LENGTH),
      ],
      nonNullable: true,
    }),
    price: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.01)],
    }),
    categoryId: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
}

export type CreateAssetFormGroup = ReturnType<typeof createCreateAssetFormControl>;
export type CreateAssetFormValue = ReturnType<CreateAssetFormGroup['getRawValue']>;
