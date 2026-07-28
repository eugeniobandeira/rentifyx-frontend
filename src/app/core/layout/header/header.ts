import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { LanguageService } from '@core/services/language/language.service';
import { Language } from '@core/types/language';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
})
export class Header {
  private readonly _sessionService = inject(SessionService);
  private readonly _languageService = inject(LanguageService);

  protected readonly isAuthenticated = this._sessionService.isAuthenticated;
  protected readonly isRestoringSession = this._sessionService.isRestoringSession;
  protected readonly isAdmin = computed(() => this._sessionService.currentUser()?.role === 'Admin');

  protected readonly currentLanguage = this._languageService.currentLanguage;
  protected readonly supportedLanguages = this._languageService.supportedLanguages;

  protected logout(): void {
    this._sessionService.logout().subscribe();
  }

  protected onLanguageChange(event: Event): void {
    const language = (event.target as HTMLSelectElement).value as Language;
    this._languageService.setLanguage(language);
  }
}
