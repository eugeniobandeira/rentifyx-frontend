import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { SessionService } from '@features/identity/auth/session/services/session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly _formBuilder = inject(FormBuilder);
  private readonly _sessionService = inject(SessionService);
  private readonly _router = inject(Router);
  private readonly _route = inject(ActivatedRoute);

  readonly form = this._formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly banner = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly isRateLimit = signal(false);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.banner.set(null);
    this.isRateLimit.set(false);
    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();

    this._sessionService.login({ email, password }).subscribe({
      next: () => {
        this.submitting.set(false);
        this._navigateAfterLogin();
      },
      error: (error: iClassifiedHttpError) => {
        this.submitting.set(false);
        this._handleError(error);
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

  private _handleError(error: iClassifiedHttpError): void {
    this.isRateLimit.set(error.kind === 'rate-limit');
    this.banner.set(error.message);
  }
}
