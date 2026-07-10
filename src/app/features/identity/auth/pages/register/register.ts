import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iRegisterRequest } from '@features/identity/auth/interfaces/register-request';
import { iValidationErrorResponse } from '@shared/interfaces/validation-error-response';
import { iApiErrorResponse } from '@shared/interfaces/api-error-response';

const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{}|;:,.<>?]).+$/;

const FORM_FIELD_NAMES = ['email', 'taxId', 'password', 'role', 'consentGiven'] as const;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-bg-canvas flex items-center justify-center px-4 py-8 sm:px-6">
      <div class="w-full max-w-md bg-bg-surface border border-border-default rounded-lg p-6 sm:p-8">
        @if (viewState() === 'success') {
          <div
            class="bg-success-subtle border border-success-border text-success-subtle-foreground rounded-md p-4"
            role="status"
          >
            <h1 class="text-lg font-semibold mb-1">Check your email</h1>
            <p class="text-sm">
              We sent a confirmation link to your email address. Click the link to verify your
              account before signing in.
            </p>
          </div>
        } @else {
          <h1 class="text-xl font-semibold text-text-primary mb-6">Create your account</h1>

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

          @if (summaryErrors().length > 0) {
            <div
              class="mb-4 rounded-md border border-error-border bg-error-subtle text-error-subtle-foreground p-3 text-sm"
              role="alert"
            >
              <ul class="list-disc list-inside">
                @for (message of summaryErrors(); track message) {
                  <li>{{ message }}</li>
                }
              </ul>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
            <div>
              <label for="email" class="block text-sm font-medium text-text-primary mb-1"
                >Email</label
              >
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                class="w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
              />
              @if (isInvalid('email')) {
                <p class="mt-1 text-sm text-error">{{ fieldErrorMessage('email') }}</p>
              }
            </div>

            <div>
              <label for="taxId" class="block text-sm font-medium text-text-primary mb-1"
                >Tax ID</label
              >
              <input
                id="taxId"
                type="text"
                formControlName="taxId"
                autocomplete="off"
                class="w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
              />
              @if (isInvalid('taxId')) {
                <p class="mt-1 text-sm text-error">{{ fieldErrorMessage('taxId') }}</p>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-text-primary mb-1"
                >Password</label
              >
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                class="w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
              />
              @if (isInvalid('password')) {
                <p class="mt-1 text-sm text-error">{{ fieldErrorMessage('password') }}</p>
              } @else {
                <p class="mt-1 text-sm text-text-muted">
                  12-128 characters, with uppercase, lowercase, a digit, and a symbol.
                </p>
              }
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-text-primary mb-1"
                >Role</label
              >
              <select
                id="role"
                formControlName="role"
                class="w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
              >
                <option value="Owner">Owner</option>
                <option value="Renter">Renter</option>
                <option value="Admin">Admin</option>
              </select>
              @if (isInvalid('role')) {
                <p class="mt-1 text-sm text-error">{{ fieldErrorMessage('role') }}</p>
              }
            </div>

            <div class="flex items-start gap-2">
              <input
                id="consentGiven"
                type="checkbox"
                formControlName="consentGiven"
                class="mt-1 h-4 w-4 rounded border-border-default"
              />
              <label for="consentGiven" class="text-sm text-text-secondary">
                I consent to the processing of my personal data.
              </label>
            </div>
            @if (isInvalid('consentGiven')) {
              <p class="text-sm text-error">You must agree before creating an account.</p>
            }

            <button
              type="submit"
              [disabled]="submitting()"
              class="w-full rounded-md bg-brand-default hover:bg-brand-hover active:bg-brand-active text-brand-foreground text-sm font-medium py-2.5 disabled:opacity-60"
            >
              {{ submitting() ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class RegisterPage {
  private readonly _fb = inject(FormBuilder);
  private readonly _authService = inject(AuthService);

  readonly viewState = signal<'form' | 'success'>('form');
  readonly submitting = signal(false);
  readonly banner = signal<string | null>(null);
  readonly isRateLimit = signal(false);
  readonly summaryErrors = signal<string[]>([]);

  readonly form = this._fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    taxId: ['', [Validators.required]],
    password: [
      '',
      [Validators.required, Validators.minLength(12), Validators.maxLength(128), Validators.pattern(PASSWORD_PATTERN)],
    ],
    role: ['Renter' as 'Owner' | 'Renter' | 'Admin', [Validators.required]],
    consentGiven: [false, [Validators.requiredTrue]],
  });

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

    this._authService.register(request).subscribe({
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

    if (err.status === 409) {
      const body = err.error as iApiErrorResponse;
      this.banner.set(body?.title ?? 'This email or tax ID is already registered.');
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
    const summary: string[] = [];
    const errors = body?.errors ?? {};

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
