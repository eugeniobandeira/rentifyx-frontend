import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iLoginResponse } from '@features/identity/auth/interfaces/login-response';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { SessionService } from './session.service';
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

function buildLoginResponse(expiresInSeconds: number): iLoginResponse {
  return { accessToken: buildToken(expiresInSeconds), refreshToken: 'refresh-token', user };
}

describe('SessionService', () => {
  let authService: { login: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn> };
  let tokenStorage: {
    getAccessToken: ReturnType<typeof vi.fn>;
    getRefreshToken: ReturnType<typeof vi.fn>;
    getEmail: ReturnType<typeof vi.fn>;
    setSession: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  function configure(platform: 'browser' | 'server' = 'browser'): SessionService {
    authService = { login: vi.fn(), logout: vi.fn(), refresh: vi.fn() };
    tokenStorage = {
      getAccessToken: vi.fn().mockReturnValue(null),
      getRefreshToken: vi.fn().mockReturnValue(null),
      getEmail: vi.fn().mockReturnValue(null),
      setSession: vi.fn(),
      clear: vi.fn(),
    };
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TokenStorageService, useValue: tokenStorage },
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });

    return TestBed.inject(SessionService);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('login() persists tokens via TokenStorageService and sets currentUser', () => {
    const service = configure();
    const response = buildLoginResponse(900);
    authService.login.mockReturnValue(of(response));

    service.login({ email: user.email, password: 'secret' }).subscribe();

    expect(tokenStorage.setSession).toHaveBeenCalledWith(
      response.accessToken,
      response.refreshToken,
      user.email,
    );
    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe(response.accessToken);
  });

  it('logout() calls AuthService.logout then clears state regardless of the response', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    authService.logout.mockReturnValue(of(undefined));

    service.logout().subscribe();

    expect(authService.logout).toHaveBeenCalledWith({
      email: user.email,
      refreshToken: 'refresh-token',
    });
    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('logout() clears local state even when the backend call errors', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    authService.logout.mockReturnValue(throwError(() => new Error('network error')));

    service.logout().subscribe();

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('bootstrap() restores the session when a refresh token and email are persisted', () => {
    const service = configure();
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    tokenStorage.getEmail.mockReturnValue(user.email);
    authService.refresh.mockReturnValue(of(buildLoginResponse(900)));

    service.bootstrap();

    expect(authService.refresh).toHaveBeenCalledWith({
      email: user.email,
      refreshToken: 'refresh-token',
    });
    expect(service.currentUser()).toEqual(user);
  });

  it('bootstrap() stays logged out when no refresh token is persisted', () => {
    const service = configure();
    tokenStorage.getRefreshToken.mockReturnValue(null);

    service.bootstrap();

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('bootstrap() no-ops on the server (SSR)', () => {
    const service = configure('server');
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    tokenStorage.getEmail.mockReturnValue(user.email);

    service.bootstrap();

    expect(authService.refresh).not.toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
  });

  it('refresh() deduplicates concurrent callers into a single in-flight request', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    const subject = new Subject<iLoginResponse>();
    authService.refresh.mockReturnValue(subject.asObservable());

    const first = service.refresh();
    const second = service.refresh();
    expect(first).toBe(second);

    let firstResult: iUserResponse | undefined;
    let secondResult: iUserResponse | undefined;
    first.subscribe((value) => (firstResult = value));
    second.subscribe((value) => (secondResult = value));

    subject.next(buildLoginResponse(900));
    subject.complete();

    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual(user);
    expect(secondResult).toEqual(user);
  });

  it('a failed refresh() clears the session and does not retry', () => {
    const service = configure();
    tokenStorage.getEmail.mockReturnValue(user.email);
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    authService.refresh.mockReturnValue(throwError(() => new Error('401')));

    service.refresh().subscribe({ error: () => undefined });

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(service.currentUser()).toBeNull();
    expect(authService.refresh).toHaveBeenCalledTimes(1);
  });

  it('schedules a proactive refresh ~60s before the access token expires', () => {
    vi.useFakeTimers();
    const service = configure();
    authService.login.mockReturnValue(of(buildLoginResponse(120)));
    service.login({ email: user.email, password: 'secret' }).subscribe();

    tokenStorage.getEmail.mockReturnValue(user.email);
    tokenStorage.getRefreshToken.mockReturnValue('refresh-token');
    authService.refresh.mockReturnValue(of(buildLoginResponse(900)));

    vi.advanceTimersByTime(60_000);

    expect(authService.refresh).toHaveBeenCalledTimes(1);
  });
});
