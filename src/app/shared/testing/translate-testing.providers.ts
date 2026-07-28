import { Provider } from '@angular/core';
import {
  TranslateLoader,
  TranslationObject,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';

class StubTranslateLoader implements TranslateLoader {
  constructor(private readonly _translations: TranslationObject) {}

  getTranslation() {
    return of(this._translations);
  }
}

/**
 * Provides a synchronous, no-network TranslateService for specs that render a component using
 * the `translate` pipe/directive or a service that injects TranslateService. Pass `translations`
 * only when a test asserts on actual rendered text; testid-only assertions don't need it.
 */
export function provideTestTranslate(translations: TranslationObject = {}): Provider[] {
  return provideTranslateService({
    loader: provideTranslateLoader(() => new StubTranslateLoader(translations)),
    lang: 'pt-BR',
    fallbackLang: 'pt-BR',
  });
}
