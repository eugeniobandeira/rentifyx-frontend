import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { LoginService } from '@features/identity/auth/login/services/login.service';
import { iAuthTokenResponse } from '../interfaces/auth-token-response';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { SessionService } from './session.service';
import { SessionApiService } from './session-api.service';
import { TokenStorageService } from './token-storage.service';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

function buildToken(expiresInSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const toBase64Url = (value: string) =>
    btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify({ sub: user.id, exp }));
  return `${header}.${body}.signature`;
}

function buildAuthTokenResponse(expiresInSeconds: number): iAuthTokenResponse {
  return { accessToken: buildToken(expiresInSeconds), user };
}

describe('SessionService', () => {
  let loginService: { login: ReturnType<typeof vi.fn> };
  let sessionApi: { logout: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn> };
  let tokenStorage: {
    getEmail: ReturnType<typeof vi.fn>;
    setEmail: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };

  function configure(platform: 'browser' | 'server' = 'browser'): SessionService {
    loginService = { login: vi.fn() };
    sessionApi = { logout: vi.fn(), refresh: vi.fn() };
    tokenStorage = {
      getEmail: vi.fn().mockReturnValue(null),
      setEmail: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: SessionApiService, useValue: sessionApi },
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });

    return TestBed.inject(SessionService);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('login() persists the accessToken+email via TokenStorageService and sets currentUser', () => {
    const service = configure();
    const response = buildAuthTokenResponse(900);
    loginService.login.mockReturnValue(of(response));

    service.login({ email: user.email, password: 'secret' }).subscribe();

    expect(tokenStorage.setEmail).toHaveBeenCalledWith(user.email);
    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe(response.accessToken);
  });

  it('updateCurrentUser() overwrites currentUser without touching the token/email', () => {
    const service = configure();
    const updated: iUserResponse = { ...user, email: 'jane.new@example.com' };

    service.updateCurrentUser(updated);

    expect(service.currentUser()).toEqual(updated);
    expect(tokenStorage.setEmail).not.toHaveBeenCalled();
  });

  it('logout() calls SessionApiService.logout with just email, then clears state regardless of the response', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.logout.mockReturnValue(of(undefined));

    service.logout().subscribe();

    expect(sessionApi.logout).toHaveBeenCalledWith({ email: user.email });
    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('logout() clears local state even when the backend call errors', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.logout.mockReturnValue(throwError(() => new Error('network error')));

    service.logout().subscribe();

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('bootstrap() restores the session via POST /auth/refresh when an email is persisted', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.refresh.mockReturnValue(of(buildAuthTokenResponse(900)));

    service.bootstrap();

    expect(sessionApi.refresh).toHaveBeenCalledWith({ email: user.email });
    expect(service.currentUser()).toEqual(user);
  });

  it('bootstrap() stays logged out and makes no API call when no email is persisted', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(null);

    service.bootstrap();

    expect(sessionApi.refresh).not.toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('bootstrap() no-ops on the server (SSR)', () => {
    const service = configure('server');
    tokenStorage.getEmail.mockReturnValue(user.email);

    service.bootstrap();

    expect(sessionApi.refresh).not.toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('isRestoringSession toggles true then false while bootstrap()\'s refresh is in flight', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    const subject = new Subject<iAuthTokenResponse>();
    sessionApi.refresh.mockReturnValue(subject.asObservable());

    expect(service.isRestoringSession()).toBe(false);
    service.bootstrap();
    expect(service.isRestoringSession()).toBe(true);

    subject.next(buildAuthTokenResponse(900));
    subject.complete();

    expect(service.isRestoringSession()).toBe(false);
  });

  it('isRestoringSession resolves to false even when bootstrap()\'s refresh fails', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.refresh.mockReturnValue(throwError(() => new Error('422')));

    service.bootstrap();

    expect(service.isRestoringSession()).toBe(false);
  });

  it('isRestoringSession never flips true when no email is persisted (no API call)', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(null);

    service.bootstrap();

    expect(service.isRestoringSession()).toBe(false);
  });

  it('refresh() deduplicates concurrent callers into a single in-flight request', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    const subject = new Subject<iAuthTokenResponse>();
    sessionApi.refresh.mockReturnValue(subject.asObservable());

    const first = service.refresh();
    const second = service.refresh();
    expect(first).toBe(second);

    let firstResult: iUserResponse | undefined;
    let secondResult: iUserResponse | undefined;
    first.subscribe((value) => (firstResult = value));
    second.subscribe((value) => (secondResult = value));

    subject.next(buildAuthTokenResponse(900));
    subject.complete();

    expect(sessionApi.refresh).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(user);
    expect(secondResult).toEqual(user);
  });

  it('a failed refresh() (422) clears the session and does not retry', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.refresh.mockReturnValue(throwError(() => new Error('422')));

    service.refresh().subscribe({ error: () => undefined });

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
    expect(sessionApi.refresh).toHaveBeenCalledTimes(1);
  });

  it('schedules a proactive refresh ~60s before the access token expires', () => {
    vi.useFakeTimers();
    const service = configure();
    loginService.login.mockReturnValue(of(buildAuthTokenResponse(120)));
    service.login({ email: user.email, password: 'secret' }).subscribe();

    tokenStorage.getEmail.mockReturnValue(user.email);
    sessionApi.refresh.mockReturnValue(of(buildAuthTokenResponse(900)));

    vi.advanceTimersByTime(60_000);

    expect(sessionApi.refresh).toHaveBeenCalledTimes(1);
  });
});
