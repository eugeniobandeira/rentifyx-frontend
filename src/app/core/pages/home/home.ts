import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionService } from '@features/identity/auth/session/services/session.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.html',
})
export class HomePage {
  private readonly _sessionService = inject(SessionService);

  protected readonly isAuthenticated = this._sessionService.isAuthenticated;
  protected readonly currentUser = this._sessionService.currentUser;
}
