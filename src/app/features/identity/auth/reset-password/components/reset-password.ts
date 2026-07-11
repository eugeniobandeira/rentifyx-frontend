import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ResetPasswordService } from '../services/reset-password.service';
import { iResetPasswordRequest } from '../interfaces/reset-password-request';
import {
  createResetPasswordFormControl,
  ResetPasswordFormGroup,
} from '../constants/reset-password-form.config';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from '@shared/composables/use-form-submission';

type ResetPasswordViewState = 'form' | 'success' | 'invalid-link';

const FORM_FIELD_NAMES = ['newPassword'] as const;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password.html',
})
export class ResetPasswordPage {
  private readonly _resetPasswordService = inject(ResetPasswordService);
  private readonly _route = inject(ActivatedRoute);

  private _email = '';
  private _token = '';

  readonly viewState = signal<ResetPasswordViewState>('form');

  readonly form: ResetPasswordFormGroup = createResetPasswordFormControl();

  private readonly _formSubmission = useFormSubmission();
  readonly banner = this._formSubmission.banner;
  readonly submitting = this._formSubmission.submitting;
  readonly isRateLimit = this._formSubmission.isRateLimit;

  constructor() {
    const email = this._route.snapshot.queryParamMap.get('email');
    const token = this._route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.viewState.set('invalid-link');
      return;
    }

    this._email = email;
    this._token = token;
  }

  isInvalid(): boolean {
    return this._formSubmission.isInvalid(this.form.get('newPassword'));
  }

  fieldErrorMessage(): string {
    return this._formSubmission.fieldErrorMessage(this.form.get('newPassword'));
  }

  onSubmit(): void {
    this._formSubmission.reset();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._formSubmission.setSubmitting(true);
    const request: iResetPasswordRequest = {
      email: this._email,
      token: this._token,
      newPassword: this.form.getRawValue().newPassword,
    };

    this._resetPasswordService.resetPassword(request).subscribe({
      next: () => {
        this._formSubmission.setSubmitting(false);
        this.viewState.set('success');
      },
      error: (error: iClassifiedHttpError) => {
        this._formSubmission.setSubmitting(false);
        this._handleError(error);
      },
    });
  }

  private _handleError(error: iClassifiedHttpError): void {
    if (error.kind === 'bad-request' || error.kind === 'not-found') {
      this.viewState.set('invalid-link');
      return;
    }

    const unmatched = this._formSubmission.handleError(error, this.form, FORM_FIELD_NAMES);
    if (error.kind === 'validation' && unmatched.length > 0) {
      this._formSubmission.setBanner('Something went wrong, try again');
    }
  }
}
