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
  readonly submitting = signal(false);
  readonly banner = signal<string | null>(null);
  readonly isRateLimit = signal(false);

  readonly form: ForgotPasswordFormGroup = createForgotPasswordFormControl();

  isInvalid(controlName: (typeof FORM_FIELD_NAMES)[number]): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  fieldErrorMessage(controlName: (typeof FORM_FIELD_NAMES)[number]): string {
    const control = this.form.get(controlName);
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
    return 'This field is invalid.';
  }

  onSubmit(): void {
    this.banner.set(null);
    this.isRateLimit.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();
    const request: iForgotPasswordRequest = {
      email: value.email,
    };

    this._forgotPasswordService.forgotPassword(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.viewState.set('success');
      },
      error: (error: iClassifiedHttpError) => {
        this.submitting.set(false);
        this._handleError(error);
      },
    });
  }

  private _handleError(error: iClassifiedHttpError): void {
    if (error.kind === 'validation') {
      this._handleValidationError(error);
      return;
    }

    this.isRateLimit.set(error.kind === 'rate-limit');
    this.banner.set(error.message);
  }

  private _handleValidationError(error: iClassifiedHttpError): void {
    const errors = error.validationErrors ?? {};

    for (const [field, messages] of Object.entries(errors)) {
      const matchedControlName = FORM_FIELD_NAMES.find(
        (name) => name.toLowerCase() === field.toLowerCase(),
      );
      if (matchedControlName) {
        const control = this.form.get(matchedControlName);
        control?.setErrors({ server: messages.join(' ') });
        control?.markAsTouched();
      }
    }
  }
}
