import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { UserService } from '@features/identity/user/services/user.service';
import { ConsentService } from '@features/identity/user/services/consent/consent.service';
import { iConsentResponse } from '@features/identity/user/interfaces/consent-response';
import { ConsentPurpose } from '@features/identity/user/types/consent-purpose';
import { useFormSubmission } from '@shared/composables/use-form-submission';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
})
export class AccountPage {
  private readonly _userService = inject(UserService);
  private readonly _consentService = inject(ConsentService);
  private readonly _sessionService = inject(SessionService);
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);

  private readonly _formSubmission = useFormSubmission();
  protected readonly submitting = this._formSubmission.submitting;
  protected readonly banner = this._formSubmission.banner;

  readonly user = this._sessionService.currentUser;

  readonly exporting = signal(false);
  readonly exportBanner = signal<string | null>(null);

  readonly deleting = signal(false);
  readonly deleteBanner = signal<string | null>(null);
  deleteConfirmText = '';

  readonly consentSubmitting = signal(false);
  readonly consentBanner = signal<string | null>(null);

  constructor() {
    this._formSubmission.setSubmitting(true);
    this._userService.getMe().subscribe({
      next: (user) => {
        this._sessionService.updateCurrentUser(user);
        this._formSubmission.setSubmitting(false);
      },
      error: () => {
        this._formSubmission.setSubmitting(false);
        this._formSubmission.setBanner("Couldn't load your profile, please try again later.");
      },
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

  toggleEssentialConsent(): void {
    const user = this.user();
    if (!user) {
      return;
    }

    const nextGranted = !user.essentialConsentGranted;
    if (!nextGranted && !confirm('Revoking essential consent may affect core account functionality. Continue?')) {
      return;
    }

    this._updateConsent('Essential', nextGranted);
  }

  toggleMarketingConsent(): void {
    const user = this.user();
    if (!user) {
      return;
    }

    this._updateConsent('Marketing', !user.marketingConsentGranted);
  }

  private _updateConsent(purpose: ConsentPurpose, granted: boolean): void {
    const user = this.user();
    if (!user) {
      return;
    }

    this.consentBanner.set(null);
    this.consentSubmitting.set(true);

    this._consentService.updateConsent(purpose, granted).subscribe({
      next: (consent) => {
        this.consentSubmitting.set(false);
        this._sessionService.updateCurrentUser({ ...user, ...this._toUserConsentFields(consent) });
      },
      error: () => {
        this.consentSubmitting.set(false);
        this.consentBanner.set("Couldn't update your consent, try again later.");
      },
    });
  }

  private _toUserConsentFields(consent: iConsentResponse) {
    return {
      essentialConsentGranted: consent.essentialGranted,
      essentialConsentGivenAt: consent.essentialGrantedAt,
      essentialConsentRevokedAt: consent.essentialRevokedAt,
      marketingConsentGranted: consent.marketingGranted,
      marketingConsentGivenAt: consent.marketingGrantedAt,
      marketingConsentRevokedAt: consent.marketingRevokedAt,
    };
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
