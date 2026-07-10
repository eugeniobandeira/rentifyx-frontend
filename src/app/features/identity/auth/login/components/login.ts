import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { iApiErrorResponse } from '@shared/interfaces/api-error-response';
import { SessionService } from '@core/services/session.service';

const RATE_LIMIT_BANNER = 'Too many attempts — try again shortly';
const NETWORK_ERROR_BANNER = "Couldn't reach the server, check your connection";
const SERVER_ERROR_BANNER = 'Something went wrong, try again';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-8">
      <div class="w-full max-w-sm rounded-lg border border-border-default bg-bg-surface p-6 shadow-sm sm:p-8">
        <h1 class="mb-6 text-xl font-semibold text-text-primary">Sign in</h1>

        @if (banner()) {
          <div
            class="mb-4 rounded-md border px-4 py-3 text-sm"
            [class]="
              isRateLimit()
                ? 'bg-warning-subtle text-warning-subtle-foreground border-warning-border'
                : 'bg-error-subtle text-error-subtle-foreground border-error-border'
            "
            role="alert"
          >
            {{ banner() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4" novalidate>
          <div class="flex flex-col gap-1">
            <label for="email" class="text-sm font-medium text-text-primary">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-text-primary focus:border-border-focus focus:outline-none"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="text-sm font-medium text-text-primary">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-text-primary focus:border-border-focus focus:outline-none"
            />
          </div>

          <button
            type="submit"
            [disabled]="submitting()"
            class="mt-2 rounded-md bg-brand-default px-4 py-2 font-medium text-brand-foreground hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign in
          </button>
        </form>

        <p class="mt-4 text-sm text-text-secondary">
          Don't have an account? <a routerLink="/register" class="text-brand-default hover:underline">Register</a>
        </p>
      </div>
    </section>
  `,
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
      error: (error: unknown) => {
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

  private _handleError(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      this.banner.set(SERVER_ERROR_BANNER);
      return;
    }

    if (error.status === 401) {
      const body = error.error as iApiErrorResponse | null;
      this.banner.set(body?.title ?? SERVER_ERROR_BANNER);
      return;
    }

    if (error.status === 429) {
      this.isRateLimit.set(true);
      this.banner.set(RATE_LIMIT_BANNER);
      return;
    }

    if (error.status === 0) {
      this.banner.set(NETWORK_ERROR_BANNER);
      return;
    }

    this.banner.set(SERVER_ERROR_BANNER);
  }
}
