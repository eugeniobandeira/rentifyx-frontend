import { FormControl, FormGroup } from '@angular/forms';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from './use-form-submission';

function buildError(overrides: Partial<iClassifiedHttpError>): iClassifiedHttpError {
  return {
    kind: 'server',
    status: 500,
    message: 'Something went wrong.',
    correlationId: null,
    validationErrors: null,
    ...overrides,
  };
}

describe('useFormSubmission', () => {
  it('defaults submitting/banner/isRateLimit to false/null/false', () => {
    const submission = useFormSubmission();

    expect(submission.submitting()).toBe(false);
    expect(submission.banner()).toBeNull();
    expect(submission.isRateLimit()).toBe(false);
  });

  it('setSubmitting toggles the submitting signal', () => {
    const submission = useFormSubmission();

    submission.setSubmitting(true);
    expect(submission.submitting()).toBe(true);

    submission.setSubmitting(false);
    expect(submission.submitting()).toBe(false);
  });

  it('setBanner sets a custom message and optional rate-limit flag', () => {
    const submission = useFormSubmission();

    submission.setBanner('Custom message.');
    expect(submission.banner()).toBe('Custom message.');
    expect(submission.isRateLimit()).toBe(false);

    submission.setBanner('Rate limited.', true);
    expect(submission.banner()).toBe('Rate limited.');
    expect(submission.isRateLimit()).toBe(true);
  });

  it('reset clears banner and isRateLimit', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    submission.handleError(buildError({ kind: 'rate-limit', message: 'Too many attempts.' }), form, [
      'email',
    ]);
    expect(submission.banner()).toBe('Too many attempts.');
    expect(submission.isRateLimit()).toBe(true);

    submission.reset();

    expect(submission.banner()).toBeNull();
    expect(submission.isRateLimit()).toBe(false);
  });

  it('handleError sets banner and isRateLimit for a rate-limit error', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    submission.handleError(buildError({ kind: 'rate-limit', message: 'Slow down.' }), form, ['email']);

    expect(submission.isRateLimit()).toBe(true);
    expect(submission.banner()).toBe('Slow down.');
  });

  it('handleError sets banner without isRateLimit for a non-rate-limit, non-validation error', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    submission.handleError(buildError({ kind: 'server', message: 'Server error.' }), form, ['email']);

    expect(submission.isRateLimit()).toBe(false);
    expect(submission.banner()).toBe('Server error.');
  });

  it('applyValidationErrors maps a matched field onto its FormControl as a "server" error', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    const unmatched = submission.applyValidationErrors(
      buildError({
        kind: 'validation',
        validationErrors: { email: ['Email is already taken.'] },
      }),
      form,
      ['email'],
    );

    expect(form.get('email')?.errors).toEqual({ server: 'Email is already taken.' });
    expect(form.get('email')?.touched).toBe(true);
    expect(unmatched).toEqual([]);
  });

  it('applyValidationErrors matches field names case-insensitively', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    submission.applyValidationErrors(
      buildError({ kind: 'validation', validationErrors: { Email: ['Invalid.'] } }),
      form,
      ['email'],
    );

    expect(form.get('email')?.errors).toEqual({ server: 'Invalid.' });
  });

  it('applyValidationErrors returns messages for fields with no matching control', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    const unmatched = submission.applyValidationErrors(
      buildError({
        kind: 'validation',
        validationErrors: { taxId: ['Tax ID is invalid.'] },
      }),
      form,
      ['email'],
    );

    expect(unmatched).toEqual(['Tax ID is invalid.']);
  });

  it('handleError delegates validation-kind errors to applyValidationErrors', () => {
    const submission = useFormSubmission();
    const form = new FormGroup({ email: new FormControl('') });

    const unmatched = submission.handleError(
      buildError({ kind: 'validation', validationErrors: { email: ['Bad email.'] } }),
      form,
      ['email'],
    );

    expect(form.get('email')?.errors).toEqual({ server: 'Bad email.' });
    expect(unmatched).toEqual([]);
    expect(submission.banner()).toBeNull();
  });

  describe('isInvalid', () => {
    it('is false for a valid, untouched control', () => {
      const control = new FormControl('a@b.com', { nonNullable: true });
      expect(useFormSubmission().isInvalid(control)).toBe(false);
    });

    it('is false for an invalid but pristine/untouched control', () => {
      const control = new FormControl('', { nonNullable: true, validators: [] });
      control.setErrors({ required: true });
      expect(useFormSubmission().isInvalid(control)).toBe(false);
    });

    it('is true for an invalid, touched control', () => {
      const control = new FormControl('', { nonNullable: true });
      control.setErrors({ required: true });
      control.markAsTouched();
      expect(useFormSubmission().isInvalid(control)).toBe(true);
    });

    it('is false for a null control', () => {
      expect(useFormSubmission().isInvalid(null)).toBe(false);
    });
  });

  describe('fieldErrorMessage', () => {
    function controlWithErrors(errors: Record<string, unknown>): FormControl {
      const control = new FormControl('');
      control.setErrors(errors);
      return control;
    }

    it('returns an empty string for a control with no errors', () => {
      expect(useFormSubmission().fieldErrorMessage(new FormControl(''))).toBe('');
    });

    it('prioritizes a server error message', () => {
      const control = controlWithErrors({ server: 'Custom server message.', required: true });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('Custom server message.');
    });

    it('maps required', () => {
      const control = controlWithErrors({ required: true });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('This field is required.');
    });

    it('maps email', () => {
      const control = controlWithErrors({ email: true });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('Enter a valid email address.');
    });

    it('maps maxlength with the required length', () => {
      const control = controlWithErrors({ maxlength: { requiredLength: 100 } });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('Must be at most 100 characters.');
    });

    it('maps minlength with the required length', () => {
      const control = controlWithErrors({ minlength: { requiredLength: 8 } });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('Must be at least 8 characters.');
    });

    it('maps pattern', () => {
      const control = controlWithErrors({ pattern: true });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe(
        'Must contain uppercase, lowercase, a digit, and a symbol.',
      );
    });

    it('falls back to a generic message for an unrecognized error key', () => {
      const control = controlWithErrors({ somethingElse: true });
      expect(useFormSubmission().fieldErrorMessage(control)).toBe('This field is invalid.');
    });
  });
});
