import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-shell.html',
})
export class LayoutShell {
  private readonly _sessionService = inject(SessionService);
  protected readonly themeService = inject(ThemeService);

  protected readonly isAuthenticated = this._sessionService.isAuthenticated;
  protected readonly isRestoringSession = this._sessionService.isRestoringSession;

  protected readonly currentYear = new Date().getFullYear();

  protected logout(): void {
    this._sessionService.logout().subscribe();
  }
}
