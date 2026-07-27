import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { roleGuard } from './role.guard';

const adminUser: iUserResponse = {
  id: 'user-1',
  email: 'admin@example.com',
  role: 'Admin',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  essentialConsentGranted: true,
  essentialConsentGivenAt: '2026-01-01T00:00:00Z',
  essentialConsentRevokedAt: null,
  marketingConsentGranted: false,
  marketingConsentGivenAt: null,
  marketingConsentRevokedAt: null,
};

const renterUser: iUserResponse = { ...adminUser, role: 'Renter' };

describe('roleGuard', () => {
  let sessionService: {
    currentUser: ReturnType<typeof signal<iUserResponse | null>>;
    isRestoringSession: ReturnType<typeof signal<boolean>>;
  };

  function configure(isRestoringSession = false): void {
    sessionService = {
      currentUser: signal<iUserResponse | null>(null),
      isRestoringSession: signal(isRestoringSession),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionService }],
    });
  }

  function runGuard(): Promise<boolean | UrlTree> {
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => {
      const result = roleGuard('Admin')(route, state) as Observable<boolean | UrlTree>;
      return firstValueFrom(result);
    });
  }

  it('allows navigation when the current user has the required role', async () => {
    configure();
    sessionService.currentUser.set(adminUser);

    const result = await runGuard();

    expect(result).toBe(true);
  });

  it('redirects to home when the current user has a different role', async () => {
    configure();
    sessionService.currentUser.set(renterUser);

    const result = await runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('redirects to home when there is no current user', async () => {
    configure();

    const result = await runGuard();

    expect(result).toBeInstanceOf(UrlTree);
  });

  it('waits for session restoration to finish before deciding', async () => {
    configure(true);
    sessionService.currentUser.set(adminUser);

    const pending = runGuard();
    sessionService.isRestoringSession.set(false);

    const result = await pending;

    expect(result).toBe(true);
  });
});
