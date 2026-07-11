import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class HomePage {
  private readonly _sessionService = inject(SessionService);
  protected readonly themeService = inject(ThemeService);

  protected readonly isAuthenticated = this._sessionService.isAuthenticated;
  protected readonly currentUser = this._sessionService.currentUser;
}
