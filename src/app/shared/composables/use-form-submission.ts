import { AbstractControl, FormGroup } from '@angular/forms';
import { signal } from '@angular/core';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

function fieldErrorMessage(control: AbstractControl | null): string {
  const errors = control?.errors;
  if (!errors) {
    return '';
  }
  if (errors['server']) {
    return errors['server'];
  }
  if (errors['required']) {
    return 'This field is required.';
  }
  if (errors['email']) {
    return 'Enter a valid email address.';
  }
  if (errors['maxlength']) {
    return `Must be at most ${errors['maxlength'].requiredLength} characters.`;
  }
  if (errors['minlength']) {
    return `Must be at least ${errors['minlength'].requiredLength} characters.`;
  }
  if (errors['pattern']) {
    return 'Must contain uppercase, lowercase, a digit, and a symbol.';
  }
  return 'This field is invalid.';
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
    fieldErrorMessage,
    applyValidationErrors,
    handleError,
  };
}

export type UseFormSubmission = ReturnType<typeof useFormSubmission>;
