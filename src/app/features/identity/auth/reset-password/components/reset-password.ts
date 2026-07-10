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

type ResetPasswordViewState = 'form' | 'success' | 'invalid-link';

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
  readonly submitting = signal(false);
  readonly banner = signal<string | null>(null);
  readonly isRateLimit = signal(false);

  readonly form: ResetPasswordFormGroup = createResetPasswordFormControl();

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
    const control = this.form.get('newPassword');
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  fieldErrorMessage(): string {
    const control = this.form.get('newPassword');
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

  onSubmit(): void {
    this.banner.set(null);
    this.isRateLimit.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const request: iResetPasswordRequest = {
      email: this._email,
      token: this._token,
      newPassword: this.form.getRawValue().newPassword,
    };

    this._resetPasswordService.resetPassword(request).subscribe({
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

    if (error.kind === 'bad-request' || error.kind === 'not-found') {
      this.viewState.set('invalid-link');
      return;
    }

    this.isRateLimit.set(error.kind === 'rate-limit');
    this.banner.set(error.message);
  }

  private _handleValidationError(error: iClassifiedHttpError): void {
    const errors = error.validationErrors ?? {};
    const messages = errors['newPassword'] ?? errors['NewPassword'] ?? errors['newpassword'];

    if (messages && messages.length > 0) {
      const control = this.form.get('newPassword');
      control?.setErrors({ server: messages.join(' ') });
      control?.markAsTouched();
      return;
    }

    this.banner.set('Something went wrong, try again');
  }
}
