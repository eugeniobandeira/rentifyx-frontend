import { AbstractControl, FormGroup } from '@angular/forms';
import { inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

function fieldErrorMessage(translate: TranslateService, control: AbstractControl | null): string {
  const errors = control?.errors;
  if (!errors) {
    return '';
  }
  if (errors['server']) {
    return errors['server'];
  }
  if (errors['required']) {
    return translate.instant('common.validation.required');
  }
  if (errors['email']) {
    return translate.instant('common.validation.email');
  }
  if (errors['maxlength']) {
    return translate.instant('common.validation.maxlength', {
      length: errors['maxlength'].requiredLength,
    });
  }
  if (errors['minlength']) {
    return translate.instant('common.validation.minlength', {
      length: errors['minlength'].requiredLength,
    });
  }
  if (errors['pattern']) {
    return translate.instant('common.validation.pattern');
  }
  return translate.instant('common.validation.generic');
}

function isInvalid(control: AbstractControl | null): boolean {
  return !!control && control.invalid && (control.dirty || control.touched);
}

/**
 * Shared submitting/banner/rate-limit + field-error-message + server-validation-mapping toolkit
 * for the identity feature's reactive-form pages (login/register/forgot-password/reset-password).
 * It's a toolkit, not a controller: a page whose error handling needs an extra branch (e.g.
 * redirecting to an "invalid link" view for a specific error kind) checks that case itself first,
 * then falls through to `handleError` for everything else.
 */
export function useFormSubmission() {
  const _translate = inject(TranslateService);
  const _submitting = signal(false);
  const _banner = signal<string | null>(null);
  const _isRateLimit = signal(false);

  function reset(): void {
    _banner.set(null);
    _isRateLimit.set(false);
  }

  function setSubmitting(value: boolean): void {
    _submitting.set(value);
  }

  function setBanner(message: string, isRateLimit = false): void {
    _isRateLimit.set(isRateLimit);
    _banner.set(message);
  }

  function applyValidationErrors(
    error: iClassifiedHttpError,
    form: FormGroup,
    fieldNames: readonly string[],
  ): string[] {
    const unmatched: string[] = [];
    const errors = error.validationErrors ?? {};

    for (const [field, messages] of Object.entries(errors)) {
      const matchedControlName = fieldNames.find((name) => name.toLowerCase() === field.toLowerCase());
      if (matchedControlName) {
        const control = form.get(matchedControlName);
        control?.setErrors({ server: messages.join(' ') });
        control?.markAsTouched();
      } else {
        unmatched.push(...messages);
      }
    }

    return unmatched;
  }

  function handleError(
    error: iClassifiedHttpError,
    form: FormGroup,
    fieldNames: readonly string[],
  ): string[] {
    if (error.kind === 'validation') {
      return applyValidationErrors(error, form, fieldNames);
    }

    _isRateLimit.set(error.kind === 'rate-limit');
    _banner.set(error.message);
    return [];
  }

  return {
    submitting: _submitting.asReadonly(),
    banner: _banner.asReadonly(),
    isRateLimit: _isRateLimit.asReadonly(),
    reset,
    setSubmitting,
    setBanner,
    isInvalid,
    fieldErrorMessage: (control: AbstractControl | null) => fieldErrorMessage(_translate, control),
    applyValidationErrors,
    handleError,
  };
}

export type UseFormSubmission = ReturnType<typeof useFormSubmission>;
