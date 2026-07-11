import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const EMAIL_STORAGE_KEY = 'rentityx-session-email';

/**
 * Persists only `email` (in localStorage), purely so SessionService.bootstrap() knows which
 * account to call POST /auth/refresh for after a reload — see .specs/features/identity/context.md
 * → "Email persistence for bootstrap". Email is not sensitive on its own (no token/credential
 * material). The access token is never stored here — SessionService is its sole owner, keeping
 * it in memory via a signal (mandated by api-contracts.md: never localStorage/sessionStorage).
 * The refreshToken itself is never touched here at all: it's an httpOnly cookie the browser
 * manages automatically.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getEmail(): string | null {
    if (!this._isBrowser) {
      return null;
    }
    return this._document.defaultView?.localStorage.getItem(EMAIL_STORAGE_KEY) ?? null;
  }

  setEmail(email: string): void {
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    }
  }

  clear(): void {
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.removeItem(EMAIL_STORAGE_KEY);
    }
  }
}
