import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { iRegisterRequest } from '../interfaces/register-request';
import { FORM_FIELD_NAMES } from '../constants/register.constants';
import { createRegisterFormControl, RegisterFormGroup } from '../constants/register-form.config';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly _registerService = inject(RegisterService);

  readonly viewState = signal<'form' | 'success'>('form');
  readonly submitting = signal(false);
  readonly banner = signal<string | null>(null);
  readonly isRateLimit = signal(false);
  readonly summaryErrors = signal<string[]>([]);

  readonly form: RegisterFormGroup = createRegisterFormControl();

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
    this.summaryErrors.set([]);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();
    const request: iRegisterRequest = {
      email: value.email,
      taxId: value.taxId,
      password: value.password,
      role: value.role,
      consentGiven: true,
    };

    this._registerService.register(request).subscribe({
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
    const summary: string[] = [];
    const errors = error.validationErrors ?? {};

    for (const [field, messages] of Object.entries(errors)) {
      const matchedControlName = FORM_FIELD_NAMES.find(
        (name) => name.toLowerCase() === field.toLowerCase(),
      );
      if (matchedControlName) {
        const control = this.form.get(matchedControlName);
        control?.setErrors({ server: messages.join(' ') });
        control?.markAsTouched();
      } else {
        summary.push(...messages);
      }
    }

    this.summaryErrors.set(summary);
  }
}
