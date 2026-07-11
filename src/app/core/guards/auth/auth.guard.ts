import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  return toObservable(sessionService.isRestoringSession).pipe(
    filter((isRestoringSession) => !isRestoringSession),
    take(1),
    map(() => {
      if (sessionService.isAuthenticated()) {
        return true;
      }

      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};
