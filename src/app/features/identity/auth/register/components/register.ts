import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RegisterService } from '../services/register.service';
import { iRegisterRequest } from '../interfaces/register-request';
import { FORM_FIELD_NAMES } from '../constants/register.constants';
import { createRegisterFormControl, RegisterFormGroup } from '../constants/register-form.config';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from '@shared/composables/use-form-submission';

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
  readonly summaryErrors = signal<string[]>([]);

  readonly form: RegisterFormGroup = createRegisterFormControl();

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
    const request: iRegisterRequest = {
      email: value.email,
      taxId: value.taxId,
      password: value.password,
      role: value.role,
      consentGiven: true,
    };

    this._registerService.register(request).subscribe({
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
