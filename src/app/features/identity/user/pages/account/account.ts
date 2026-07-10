import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UserService } from '@features/identity/user/services/user.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';

type AccountStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-screen items-start justify-center bg-bg-canvas px-4 py-12">
      <div class="w-full max-w-md rounded-lg border border-border-default bg-bg-surface p-6 sm:p-8">
        @switch (status()) {
          @case ('loading') {
            <p class="text-center text-text-secondary">Loading your profile…</p>
          }
          @case ('loaded') {
            @if (user(); as user) {
              <h1 class="text-lg font-semibold text-text-primary">Your profile</h1>
              <dl class="mt-4 space-y-3 text-sm">
                <div>
                  <dt class="text-text-muted">Email</dt>
                  <dd class="text-text-primary">{{ user.email }}</dd>
                </div>
                <div>
                  <dt class="text-text-muted">Role</dt>
                  <dd class="text-text-primary">{{ user.role }}</dd>
                </div>
                <div>
                  <dt class="text-text-muted">Status</dt>
                  <dd class="text-text-primary">{{ user.status }}</dd>
                </div>
                <div>
                  <dt class="text-text-muted">Member since</dt>
                  <dd class="text-text-primary">{{ createdAtDisplay() }}</dd>
                </div>
              </dl>
            }
          }
          @case ('error') {
            <div
              class="rounded-md border border-error-border bg-error-subtle p-4 text-error-subtle-foreground"
            >
              <h1 class="text-lg font-semibold">Couldn't load your profile</h1>
              <p class="mt-2 text-sm">Please try again later.</p>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class AccountPage {
  private readonly _userService = inject(UserService);

  protected readonly status = signal<AccountStatus>('loading');
  protected readonly user = signal<iUserResponse | null>(null);

  constructor() {
    this._userService.getMe().subscribe({
      next: (user) => {
        this.user.set(user);
        this.status.set('loaded');
      },
      error: () => this.status.set('error'),
    });
  }

  protected createdAtDisplay(): string {
    const user = this.user();
    return user ? new Date(user.createdAt).toLocaleDateString() : '';
  }
}
