import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { LayoutShell } from './layout-shell';

@Component({
  standalone: true,
  imports: [LayoutShell],
  template: `
    <app-layout-shell>
      <p data-testid="projected-marker">projected</p>
    </app-layout-shell>
  `,
})
class HostComponent {}

describe('LayoutShell', () => {
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

  function configure(): ComponentFixture<LayoutShell> {
    TestBed.configureTestingModule({
      imports: [LayoutShell],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionService },
        { provide: ThemeService, useValue: themeService },
      ],
    });
    const fixture = TestBed.createComponent(LayoutShell);
    fixture.detectChanges();
    return fixture;
  }

  it('shows Entrar/Criar conta when logged out', () => {
    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-login-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-register-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-account-link"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-logout-button"]')).toBeFalsy();
  });

  it('shows Minha conta/Sair when authenticated', () => {
    sessionService.isAuthenticated = signal(true);

    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-account-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-logout-button"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-login-link"]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-register-link"]')).toBeFalsy();
  });

  it('shows the guest header while a session is still restoring, even though it will end up authenticated', () => {
    sessionService.isAuthenticated = signal(true);
    sessionService.isRestoringSession = signal(true);

    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-login-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="layout-shell-account-link"]')).toBeFalsy();
  });

  it('Sair calls SessionService.logout() without navigating', () => {
    sessionService.isAuthenticated = signal(true);

    const fixture = configure();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="layout-shell-logout-button"]',
    );
    button.click();

    expect(sessionService.logout).toHaveBeenCalledTimes(1);
  });

  it('the theme toggle button calls ThemeService.toggle()', () => {
    const fixture = configure();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="layout-shell-theme-toggle-button"]',
    );
    button.click();

    expect(themeService.toggle).toHaveBeenCalledTimes(1);
  });

  it('renders the footer with the current year and non-clickable legal labels', () => {
    const fixture = configure();
    const footer = fixture.nativeElement.querySelector('[data-testid="layout-shell-footer"]') as HTMLElement;

    expect(footer.textContent).toContain(`© RentityX ${new Date().getFullYear()}`);
    expect(footer.querySelector('[data-testid="layout-shell-footer-terms"]')?.tagName).toBe('SPAN');
    expect(footer.querySelector('[data-testid="layout-shell-footer-privacy"]')?.tagName).toBe('SPAN');
  });

  it('projects content via ng-content', () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: sessionService },
        { provide: ThemeService, useValue: themeService },
      ],
    });

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="projected-marker"]')).toBeTruthy();
  });
});
