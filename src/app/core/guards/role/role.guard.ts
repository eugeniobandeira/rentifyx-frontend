import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, filter, map, take } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { UserRole } from '@features/identity/user/types/user-role';

/**
 * Gates a route to a specific role (e.g. 'Admin'). Mirrors authGuard's pattern of waiting out
 * SessionService.isRestoringSession() before checking - the same reload-race authGuard already
 * guards against would otherwise make a valid Admin session look unauthorized. The backend's
 * AdminOnly policy is the real enforcement; this is a client-side UX convenience only.
 */
export function roleGuard(requiredRole: UserRole): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const sessionService = inject(SessionService);
    const router = inject(Router);

    return toObservable(sessionService.isRestoringSession).pipe(
      filter((isRestoring) => !isRestoring),
      take(1),
      map(() => {
        const user = sessionService.currentUser();
        if (user?.role === requiredRole) {
          return true;
        }
        return router.createUrlTree(['/']);
      }),
    );
  };
}
