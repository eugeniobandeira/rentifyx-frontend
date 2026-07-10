import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { decodeJwtExpiry } from '@shared/utils/decode-jwt-expiry.util';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iLoginRequest } from '@features/identity/auth/interfaces/login-request';
import { iLoginResponse } from '@features/identity/auth/interfaces/login-response';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { TokenStorageService } from './token-storage.service';

const REFRESH_SAFETY_MARGIN_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _authService = inject(AuthService);
  private readonly _tokenStorage = inject(TokenStorageService);
  private readonly _router = inject(Router);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _accessTokenSignal = signal<string | null>(null);
  private readonly _currentUserSignal = signal<iUserResponse | null>(null);

  readonly currentUser = this._currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUserSignal() !== null);

  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _inFlightRefresh: Observable<iUserResponse> | null = null;

  accessToken(): string | null {
    return this._accessTokenSignal();
  }

  bootstrap(): void {
    if (!this._isBrowser) {
      return;
    }
    if (!this._tokenStorage.getRefreshToken() || !this._tokenStorage.getEmail()) {
      return;
    }
    this.refresh().subscribe({ error: () => undefined });
  }

  login(request: iLoginRequest): Observable<iUserResponse> {
    return this._authService.login(request).pipe(
      tap((response) => this._applySession(response)),
      map((response) => response.user),
    );
  }

  logout(): Observable<void> {
    const email = this._tokenStorage.getEmail();
    const refreshToken = this._tokenStorage.getRefreshToken();

    if (!email || !refreshToken) {
      this.clearSession();
      void this._router.navigateByUrl('/login');
      return of(undefined);
    }

    return this._authService.logout({ email, refreshToken }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => {
        this.clearSession();
        void this._router.navigateByUrl('/login');
      }),
    );
  }

  refresh(): Observable<iUserResponse> {
    if (this._inFlightRefresh) {
      return this._inFlightRefresh;
    }

    const email = this._tokenStorage.getEmail();
    const refreshToken = this._tokenStorage.getRefreshToken();

    if (!email || !refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No active session to refresh'));
    }

    const request$ = this._authService.refresh({ email, refreshToken }).pipe(
      tap((response) => this._applySession(response)),
      map((response) => response.user),
      catchError((error: unknown) => {
        this.clearSession();
        void this._router.navigateByUrl('/login');
        return throwError(() => error);
      }),
      finalize(() => {
        this._inFlightRefresh = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this._inFlightRefresh = request$;
    return request$;
  }

  clearSession(): void {
    this._currentUserSignal.set(null);
    this._accessTokenSignal.set(null);
    this._tokenStorage.clear();
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  private _applySession(response: iLoginResponse): void {
    this._tokenStorage.setSession(response.accessToken, response.refreshToken, response.user.email);
    this._accessTokenSignal.set(response.accessToken);
    this._currentUserSignal.set(response.user);
    this._scheduleRefresh(response.accessToken);
  }

  private _scheduleRefresh(accessToken: string): void {
    if (!this._isBrowser) {
      return;
    }
    if (this._refreshTimer !== null) {
      clearTimeout(this._refreshTimer);
      this._refreshTimer = null;
    }

    const exp = decodeJwtExpiry(accessToken);
    if (exp === null) {
      return;
    }

    const delay = Math.max(exp * 1000 - Date.now() - REFRESH_SAFETY_MARGIN_MS, 0);
    this._refreshTimer = setTimeout(() => {
      this.refresh().subscribe({ error: () => undefined });
    }, delay);
  }
}
