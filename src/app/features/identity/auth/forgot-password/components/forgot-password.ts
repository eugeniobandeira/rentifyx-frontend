import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgot-password.service';
import { iForgotPasswordRequest } from '../interfaces/forgot-password-request';
import { FORM_FIELD_NAMES } from '../constants/forgot-password.constants';
import {
  createForgotPasswordFormControl,
  ForgotPasswordFormGroup,
} from '../constants/forgot-password-form.config';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from '@shared/composables/use-form-submission';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordPage {
  private readonly _forgotPasswordService = inject(ForgotPasswordService);

  readonly viewState = signal<'form' | 'success'>('form');
  readonly summaryErrors = signal<string[]>([]);

  readonly form: ForgotPasswordFormGroup = createForgotPasswordFormControl();

  private readonly _formSubmission = useFormSubmission();
  readonly banner = this._formSubmission.banner;
  readonly submitting = this._formSubmission.submitting;
  readonly isRateLimit = this._formSubmission.isRateLimit;

  isInvalid(controlName: (typeof FORM_FIELD_NAMES)[number]): boolean {
    return this._formSubmission.isInvalid(this.form.get(controlName));
  }

  fieldErrorMessage(controlName: (typeof FORM_FIELD_NAMES)[number]): string {
    return this._formSubmission.fieldErrorMessage(this.form.get(controlName));
  }

  onSubmit(): void {
    this._formSubmission.reset();
    this.summaryErrors.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._formSubmission.setSubmitting(true);
    const value = this.form.getRawValue();
    const request: iForgotPasswordRequest = {
      email: value.email,
    };

    this._forgotPasswordService.forgotPassword(request).subscribe({
      next: () => {
        this._formSubmission.setSubmitting(false);
        this.viewState.set('success');
      },
      error: (error: iClassifiedHttpError) => {
        this._formSubmission.setSubmitting(false);
        const unmatched = this._formSubmission.handleError(error, this.form, FORM_FIELD_NAMES);
        this.summaryErrors.set(unmatched);
      },
    });
  }
}
