import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { decodeJwtExpiry } from '@shared/utils/decode-jwt-expiry.util';
import { LoginService } from '@features/identity/auth/login/services/login.service';
import { iLoginRequest } from '@features/identity/auth/login/interfaces/login-request';
import { iAuthTokenResponse } from '../interfaces/auth-token-response';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { SessionApiService } from './session-api.service';
import { TokenStorageService } from './token-storage.service';

const REFRESH_SAFETY_MARGIN_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _loginService = inject(LoginService);
  private readonly _sessionApi = inject(SessionApiService);
  private readonly _tokenStorage = inject(TokenStorageService);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _accessTokenSignal = signal<string | null>(null);
  private readonly _currentUserSignal = signal<iUserResponse | null>(null);
  private readonly _isRestoringSessionSignal = signal(false);

  readonly currentUser = this._currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUserSignal() !== null);
  readonly isRestoringSession = this._isRestoringSessionSignal.asReadonly();

  private _refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private _inFlightRefresh: Observable<iUserResponse> | null = null;

  accessToken(): string | null {
    return this._accessTokenSignal();
  }

  bootstrap(): void {
    if (!this._isBrowser) {
      return;
    }
    if (!this._tokenStorage.getEmail()) {
      return;
    }
    this._isRestoringSessionSignal.set(true);
    this.refresh().subscribe({
      error: () => this._isRestoringSessionSignal.set(false),
      complete: () => this._isRestoringSessionSignal.set(false),
    });
  }

  login(request: iLoginRequest): Observable<iUserResponse> {
    return this._loginService.login(request).pipe(
      tap((response) => this._applySession(response)),
      map((response) => response.user),
    );
  }

  logout(): Observable<void> {
    const email = this._tokenStorage.getEmail();

    if (!email) {
      this.clearSession();
      return of(undefined);
    }

    return this._sessionApi.logout({ email }).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.clearSession()),
    );
  }

  refresh(): Observable<iUserResponse> {
    if (this._inFlightRefresh) {
      return this._inFlightRefresh;
    }

    const email = this._tokenStorage.getEmail();

    if (!email) {
      this.clearSession();
      return throwError(() => new Error('No active session to refresh'));
    }

    const request$ = this._sessionApi.refresh({ email }).pipe(
      tap((response) => this._applySession(response)),
      map((response) => response.user),
      catchError((error: unknown) => {
        this.clearSession();
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

  updateCurrentUser(user: iUserResponse): void {
    this._currentUserSignal.set(user);
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

  private _applySession(response: iAuthTokenResponse): void {
    this._tokenStorage.setEmail(response.user.email);
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
