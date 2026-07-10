import { Injectable } from '@angular/core';

interface iStoredSession {
  accessToken: string;
  refreshToken: string;
  email: string;
}

/**
 * SPEC_DEVIATION (storage mechanism): the concrete browser storage mechanism
 * (memory+localStorage / localStorage / sessionStorage) is an explicitly open
 * decision — see `.specs/features/identity/context.md` → "Open Decision: Token
 * storage strategy". This in-memory placeholder satisfies the fixed get/set/clear
 * interface every other task depends on without defaulting that decision. It does
 * not persist across page reloads; swapping in real persistence later is confined
 * to this file.
 *
 * SPEC_DEVIATION (email storage): design.md's TokenStorageService interface only
 * lists accessToken/refreshToken, but POST /auth/refresh and /auth/logout both
 * require `email` in the body (api-contracts.md). Without persisting email
 * alongside the tokens, SessionService.bootstrap() could never call refresh()
 * after a reload. Storing email here is the minimal fix; it is not sensitive on
 * its own (no token/credential material).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private _session: iStoredSession | null = null;

  getAccessToken(): string | null {
    return this._session?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this._session?.refreshToken ?? null;
  }

  getEmail(): string | null {
    return this._session?.email ?? null;
  }

  setSession(accessToken: string, refreshToken: string, email: string): void {
    this._session = { accessToken, refreshToken, email };
  }

  clear(): void {
    this._session = null;
  }
}
