import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const EMAIL_STORAGE_KEY = 'rentityx-session-email';

/**
 * accessToken lives in memory only — mandated by api-contracts.md (never localStorage/
 * sessionStorage). The refreshToken itself is never touched here at all: it's an httpOnly
 * cookie the browser manages automatically. Only `email` is persisted (in localStorage),
 * purely so SessionService.bootstrap() knows which account to call POST /auth/refresh for
 * after a reload — see .specs/features/identity/context.md → "Email persistence for bootstrap".
 * Email is not sensitive on its own (no token/credential material).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private _accessToken: string | null = null;

  getAccessToken(): string | null {
    return this._accessToken;
  }

  getEmail(): string | null {
    if (!this._isBrowser) {
      return null;
    }
    return this._document.defaultView?.localStorage.getItem(EMAIL_STORAGE_KEY) ?? null;
  }

  setSession(accessToken: string, email: string): void {
    this._accessToken = accessToken;
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    }
  }

  clear(): void {
    this._accessToken = null;
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.removeItem(EMAIL_STORAGE_KEY);
    }
  }
}
