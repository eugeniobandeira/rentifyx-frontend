import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { useFormSubmission } from '@shared/composables/use-form-submission';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { createLoginFormControl, LoginFormGroup } from '../constants/login-form.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly _sessionService = inject(SessionService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  readonly form: LoginFormGroup = createLoginFormControl();

  private readonly _formSubmission = useFormSubmission();
  readonly banner = this._formSubmission.banner;
  readonly submitting = this._formSubmission.submitting;
  readonly isRateLimit = this._formSubmission.isRateLimit;

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this._formSubmission.reset();
    this._formSubmission.setSubmitting(true);

    const { email, password } = this.form.getRawValue();

    this._sessionService.login({ email, password }).subscribe({
      next: () => {
        this._formSubmission.setSubmitting(false);
        this._navigateAfterLogin();
      },
      error: (error: iClassifiedHttpError) => {
        this._formSubmission.setSubmitting(false);
        this._formSubmission.handleError(error, this.form, ['email', 'password']);
      },
    });
  }

  private _navigateAfterLogin(): void {
    const returnUrl = this._route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && this._isSafeReturnUrl(returnUrl)) {
      void this._router.navigateByUrl(returnUrl);
      return;
    }
    void this._router.navigateByUrl('/');
  }

  private _isSafeReturnUrl(url: string): boolean {
    if (!url.startsWith('/')) {
      return false;
    }
    if (url.startsWith('//')) {
      return false;
    }
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
      return false;
    }
    return true;
  }
}
