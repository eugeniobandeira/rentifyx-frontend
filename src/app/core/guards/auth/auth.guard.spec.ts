import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let sessionService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    isRestoringSession: ReturnType<typeof signal<boolean>>;
  };

  function configure(isRestoringSession = false): void {
    sessionService = {
      isAuthenticated: vi.fn(),
      isRestoringSession: signal(isRestoringSession),
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionService }],
    });
  }

  function runGuard(url: string): Promise<boolean | UrlTree> {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => {
      const result = authGuard(route, state) as Observable<boolean | UrlTree>;
      return firstValueFrom(result);
    });
  }

  it('allows navigation when the user is authenticated', async () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(true);

    const result = await runGuard('/dashboard');

    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when the user is not authenticated', async () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(false);

    const result = await runGuard('/dashboard');

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('encodes the returnUrl for nested paths with query params', async () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(false);

    const result = await runGuard('/units/123?tab=details');

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/login?returnUrl=%2Funits%2F123%3Ftab%3Ddetails');
  });

  it('waits for session restoration to finish before deciding', async () => {
    configure(true);
    sessionService.isAuthenticated.mockReturnValue(true);

    const pending = runGuard('/dashboard');
    sessionService.isRestoringSession.set(false);

    const result = await pending;

    expect(result).toBe(true);
  });
});
