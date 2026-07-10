import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { UserService } from '@features/identity/user/services/user.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';

type AccountStatus = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
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
