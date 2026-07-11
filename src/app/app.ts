import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('rentityx-frontend');

  private readonly _sessionService = inject(SessionService);
  private readonly _router = inject(Router);
  protected readonly isRestoringSession = this._sessionService.isRestoringSession;

  constructor() {
    this._sessionService.bootstrap();

    let wasAuthenticated = false;
    effect(() => {
      const isRestoring = this._sessionService.isRestoringSession();
      const isAuthenticated = this._sessionService.isAuthenticated();

      if (isRestoring) {
        return;
      }
      if (wasAuthenticated && !isAuthenticated) {
        void this._router.navigateByUrl('/login');
      }
      wasAuthenticated = isAuthenticated;
    });
  }
}
