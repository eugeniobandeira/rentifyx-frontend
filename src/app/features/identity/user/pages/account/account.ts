import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { UserService } from '@features/identity/user/services/user.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';

type AccountStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule],
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

              <div class="mt-6 border-t border-border-default pt-6">
                <h2 class="text-sm font-semibold text-text-primary">Your data</h2>
                @if (exportBanner()) {
                  <p class="mt-2 text-sm text-error" role="alert">{{ exportBanner() }}</p>
                }
                <button
                  type="button"
                  [disabled]="exporting()"
                  (click)="exportData()"
                  class="mt-3 w-full rounded-md border border-border-default bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-canvas disabled:opacity-60"
                >
                  {{ exporting() ? 'Preparing export…' : 'Export my data' }}
                </button>
              </div>

              <div class="mt-6 border-t border-error-border pt-6">
                <h2 class="text-sm font-semibold text-error">Delete account</h2>
                <p class="mt-1 text-sm text-text-secondary">
                  This permanently anonymizes your account and cannot be undone. Type
                  <span class="font-medium text-text-primary">{{ user.email }}</span> to confirm.
                </p>
                @if (deleteBanner()) {
                  <p class="mt-2 text-sm text-error" role="alert">{{ deleteBanner() }}</p>
                }
                <input
                  type="text"
                  [(ngModel)]="deleteConfirmText"
                  autocomplete="off"
                  class="mt-3 w-full rounded-md border border-border-default bg-bg-surface text-text-primary px-3 py-2 text-sm focus:outline-none focus:border-border-focus"
                />
                <button
                  type="button"
                  [disabled]="!canDelete() || deleting()"
                  (click)="deleteAccount()"
                  class="mt-3 w-full rounded-md bg-error px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-50"
                >
                  {{ deleting() ? 'Deleting…' : 'Delete my account' }}
                </button>
              </div>
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
  private readonly _sessionService = inject(SessionService);
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);

  protected readonly status = signal<AccountStatus>('loading');
  readonly user = signal<iUserResponse | null>(null);

  readonly exporting = signal(false);
  readonly exportBanner = signal<string | null>(null);

  readonly deleting = signal(false);
  readonly deleteBanner = signal<string | null>(null);
  deleteConfirmText = '';

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

  canDelete(): boolean {
    return this.deleteConfirmText.trim().length > 0 && this.deleteConfirmText === this.user()?.email;
  }

  exportData(): void {
    this.exportBanner.set(null);
    this.exporting.set(true);

    this._userService.exportMyData().subscribe({
      next: (data) => {
        this.exporting.set(false);
        this._downloadJson(data, 'rentityx-data-export.json');
      },
      error: () => {
        this.exporting.set(false);
        this.exportBanner.set("Couldn't export your data, try again later.");
      },
    });
  }

  deleteAccount(): void {
    if (!this.canDelete()) {
      return;
    }

    this.deleteBanner.set(null);
    this.deleting.set(true);

    this._userService.deleteMe().subscribe({
      next: () => {
        this._sessionService.clearSession();
        void this._router.navigateByUrl('/login');
      },
      error: () => {
        this.deleting.set(false);
        this.deleteBanner.set("Couldn't delete your account, try again later.");
      },
    });
  }

  private _downloadJson(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = this._document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
