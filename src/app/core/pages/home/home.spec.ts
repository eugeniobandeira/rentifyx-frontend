import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { HomePage } from './home';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  essentialConsentGranted: true,
  essentialConsentGivenAt: '2026-01-01T00:00:00Z',
  essentialConsentRevokedAt: null,
  marketingConsentGranted: false,
  marketingConsentGivenAt: null,
  marketingConsentRevokedAt: null,
};

describe('HomePage', () => {
  let sessionService: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    currentUser: ReturnType<typeof signal<iUserResponse | null>>;
  };

  beforeEach(() => {
    sessionService = { isAuthenticated: signal(false), currentUser: signal(null) };
  });

  function configure(): ComponentFixture<HomePage> {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionService }],
    });
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    return fixture;
  }

  it('shows guest actions (login/register) when not authenticated', () => {
    const fixture = configure();

    expect(fixture.nativeElement.querySelector('[data-testid="home-guest-actions"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="home-authenticated-actions"]'),
    ).toBeFalsy();
  });

  it('shows a welcome message and account link when authenticated', () => {
    sessionService.isAuthenticated = signal(true);
    sessionService.currentUser = signal(user);

    const fixture = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('jane@example.com');
    expect(fixture.nativeElement.querySelector('[data-testid="home-account-link"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="home-guest-actions"]')).toBeFalsy();
  });
});
