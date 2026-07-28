import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Language } from '@core/types/language';

const STORAGE_KEY = 'rentityx-language';
const SUPPORTED_LANGUAGES: readonly Language[] = ['pt-BR', 'en'];
const DEFAULT_LANGUAGE: Language = 'pt-BR';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _translate = inject(TranslateService);
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _currentLanguage = signal<Language>(this._readStoredLanguage());

  readonly currentLanguage = this._currentLanguage.asReadonly();
  readonly supportedLanguages = SUPPORTED_LANGUAGES;

  init(): Promise<unknown> {
    return firstValueFrom(this._translate.use(this._currentLanguage()));
  }

  setLanguage(language: Language): void {
    this._currentLanguage.set(language);
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.setItem(STORAGE_KEY, language);
    }
    this._translate.use(language);
  }

  private _readStoredLanguage(): Language {
    if (!this._isBrowser) {
      return DEFAULT_LANGUAGE;
    }
    const stored = this._document.defaultView?.localStorage.getItem(STORAGE_KEY);
    if (stored === 'pt-BR' || stored === 'en') {
      return stored;
    }
    const browserLanguage = this._document.defaultView?.navigator.language;
    return browserLanguage?.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE;
  }
}
