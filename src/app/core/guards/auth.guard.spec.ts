import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let sessionService: { isAuthenticated: ReturnType<typeof vi.fn> };

  function configure(): void {
    sessionService = { isAuthenticated: vi.fn() };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionService }],
    });
  }

  function runGuard(url: string) {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => authGuard(route, state));
  }

  it('allows navigation when the user is authenticated', () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(true);

    const result = runGuard('/dashboard');

    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when the user is not authenticated', () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(false);

    const result = runGuard('/dashboard');

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/login?returnUrl=%2Fdashboard');
  });

  it('encodes the returnUrl for nested paths with query params', () => {
    configure();
    sessionService.isAuthenticated.mockReturnValue(false);

    const result = runGuard('/units/123?tab=details');

    expect(result).toBeInstanceOf(UrlTree);
    const urlTree = result as UrlTree;
    expect(urlTree.toString()).toBe('/login?returnUrl=%2Funits%2F123%3Ftab%3Ddetails');
  });
});
