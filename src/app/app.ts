import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  protected readonly isRestoringSession = this._sessionService.isRestoringSession;

  constructor() {
    this._sessionService.bootstrap();
  }
}
