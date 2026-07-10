import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iResetPasswordRequest } from '@features/identity/auth/interfaces/reset-password-request';
import { iValidationErrorResponse } from '@shared/interfaces/validation-error-response';

type ResetPasswordViewState = 'form' | 'success' | 'invalid-link';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{}|;:,.<>?]).+$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-bg-canvas flex items-center justify-center px-4 py-8 sm:px-6">
      <div class="w-full max-w-md bg-bg-surface border border-border-default rounded-lg p-6 sm:p-8">
        @switch (viewState()) {
          @case ('invalid-link') {
            <div
              class="rounded-md border border-error-border bg-error-subtle p-4 text-error-subtle-foreground"
              role="alert"
            >
              <h1 class="text-lg font-semibold">This link is no longer valid</h1>
              <p class="mt-2 text-sm">
                This password reset link has expired or is no longer valid. Please request a new
                one or return to login.
              </p>
            </div>
            <a routerLink="/login" class="mt-6 inline-block text-sm font-medium text-brand-default">
              Back to login
            </a>
          }
          @case ('success') {
            <div
              class="rounded-md border border-success-border bg-success-subtle p-4 text-success-subtle-foreground"
              role="status"
            >
              <h1 class="text-lg font-semibold">Password reset</h1>
              <p class="mt-2 text-sm">
                Your password has been successfully reset. You can now sign in with your new
                password.
              </p>
            </div>
            <a
              routerLink="/login"
              class="mt-6 inline-block w-full rounded-md bg-brand-default px-4 py-2 text-center text-sm font-medium text-brand-foreground hover:bg-brand-hover"
            >
              Go to login
            </a>
          }
          @case ('form') {
            <h1 class="text-xl font-semibold text-text-primary mb-6">Reset your password</h1>

            @if (banner()) {
              <div
                class="mb-4 rounded-md border p-3 text-sm"
                [class.bg-error-subtle]="!isRateLimit()"
                [class.border-error-border]="!isRateLimit()"
                [class.text-error-subtle-foreground]="!isRateLimit()"
                [class.bg-warning-subtle]="isRateLimit()"
                [class.border-warning-border]="isRateLimit()"
                [class.text-warning-subtle-foreground]="isRateLimit()"
                role="alert"
              >
                {{ banner() }}
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
              <div>
                <label for="newPassword" class="block text-sm font-medium text-text-primary mb-1"
                  >New password</label
                >
                <input
                  id="newPassword"
                  type="password"
                  formControlName="newPassword"
                  autocomplete="new-password"
                  class="w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
                />
                @if (isInvalid()) {
                  <p class="mt-1 text-sm text-error">{{ fieldErrorMessage() }}</p>
                } @else {
                  <p class="mt-1 text-sm text-text-muted">
                    12-128 characters, with uppercase, lowercase, a digit, and a symbol.
                  </p>
                }
              </div>

              <button
                type="submit"
                [disabled]="submitting()"
                class="w-full rounded-md bg-brand-default hover:bg-brand-hover active:bg-brand-active text-brand-foreground text-sm font-medium py-2.5 disabled:opacity-60"
              >
                {{ submitting() ? 'Resetting…' : 'Reset password' }}
              </button>
            </form>
          }
        }
      </div>
    </div>
  `,
})
export class ResetPasswordPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);

  private _email = '';
  private _token = '';

  readonly viewState = signal<ResetPasswordViewState>('form');
  readonly submitting = signal(false);
  readonly banner = signal<string | null>(null);
  readonly isRateLimit = signal(false);

  readonly form = this._fb.nonNullable.group({
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(12),
        Validators.maxLength(128),
        Validators.pattern(PASSWORD_PATTERN),
      ],
    ],
  });

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

    this._authService.resetPassword(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.viewState.set('success');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this._handleError(err);
      },
    });
  }

  private _handleError(err: HttpErrorResponse): void {
    if (err.status === 422) {
      this._handleValidationError(err.error as iValidationErrorResponse);
      return;
    }

    if (err.status === 400 || err.status === 404) {
      this.viewState.set('invalid-link');
      return;
    }

    if (err.status === 429) {
      this.isRateLimit.set(true);
      this.banner.set('Too many attempts — try again shortly');
      return;
    }

    if (err.status === 0) {
      this.banner.set("Couldn't reach the server, check your connection");
      return;
    }

    this.banner.set('Something went wrong, try again');
  }

  private _handleValidationError(body: iValidationErrorResponse): void {
    const errors = body?.errors ?? {};
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
