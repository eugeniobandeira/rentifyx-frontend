import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { Header } from './header';

describe('Header', () => {
  let sessionService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    isRestoringSession: ReturnType<typeof signal<boolean>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let themeService: { isDark: ReturnType<typeof signal<boolean>>; toggle: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionService = {
      isAuthenticated: signal(false),
      isRestoringSession: signal(false),
      logout: vi.fn().mockReturnValue(of(undefined)),
    };
    themeService = { isDark: signal(false), toggle: vi.fn() };
  });

  function configure(): ComponentFixture<Header> {
    TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionService },
        { provide: ThemeService, useValue: themeService },
      ],
    });
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    return fixture;
  }

  it('shows Entrar/Criar conta when logged out', () => {
    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="header-login-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-register-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-account-link"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-logout-button"]')).toBeFalsy();
  });

  it('shows Minha conta/Sair when authenticated', () => {
    sessionService.isAuthenticated = signal(true);

    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="header-account-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-logout-button"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-login-link"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-register-link"]')).toBeFalsy();
  });

  it('shows the guest header while a session is still restoring, even though it will end up authenticated', () => {
    sessionService.isAuthenticated = signal(true);
    sessionService.isRestoringSession = signal(true);

    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="header-login-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="header-account-link"]')).toBeFalsy();
  });

  it('Sair calls SessionService.logout() without navigating', () => {
    sessionService.isAuthenticated = signal(true);

    const fixture = configure();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="header-logout-button"]',
    );
    button.click();

    expect(sessionService.logout).toHaveBeenCalledTimes(1);
  });

  it('the theme toggle button calls ThemeService.toggle()', () => {
    const fixture = configure();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="header-theme-toggle-button"]',
    );
    button.click();

    expect(themeService.toggle).toHaveBeenCalledTimes(1);
  });
});
