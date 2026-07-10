import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '@features/identity/auth/services/auth.service';

type VerifyEmailStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-screen items-center justify-center bg-bg-canvas px-4 py-12">
      <div class="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-6 sm:p-8">
        @switch (status()) {
          @case ('loading') {
            <p class="text-center text-text-secondary">Verifying your email…</p>
          }
          @case ('success') {
            <div
              class="rounded-md border border-success-border bg-success-subtle p-4 text-success-subtle-foreground"
            >
              <h1 class="text-lg font-semibold">Email verified</h1>
              <p class="mt-2 text-sm">Your account has been successfully verified.</p>
            </div>
            <a
              routerLink="/login"
              class="mt-6 inline-block w-full rounded-md bg-brand-default px-4 py-2 text-center text-sm font-medium text-brand-foreground hover:bg-brand-hover"
            >
              Go to login
            </a>
          }
          @case ('error') {
            <div
              class="rounded-md border border-error-border bg-error-subtle p-4 text-error-subtle-foreground"
            >
              <h1 class="text-lg font-semibold">This link is no longer valid</h1>
              <p class="mt-2 text-sm">
                This verification link has expired or is no longer valid. Please request a new
                one or return to login.
              </p>
            </div>
            <a routerLink="/login" class="mt-6 inline-block text-sm font-medium text-brand-default">
              Back to login
            </a>
          }
        }
      </div>
    </section>
  `,
})
export class VerifyEmailPage {
  private readonly _route = inject(ActivatedRoute);
  private readonly _authService = inject(AuthService);

  protected readonly status = signal<VerifyEmailStatus>('loading');

  constructor() {
    const email = this._route.snapshot.queryParamMap.get('email');
    const token = this._route.snapshot.queryParamMap.get('token');

    if (!email || !token) {
      this.status.set('error');
      return;
    }

    this._authService.verifyEmail({ email, token }).subscribe({
      next: () => this.status.set('success'),
      error: () => this.status.set('error'),
    });
  }
}
