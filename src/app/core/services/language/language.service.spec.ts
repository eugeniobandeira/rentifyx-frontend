import { TestBed } from '@angular/core/testing';
import { provideTestTranslate } from '@shared/testing/translate-testing.providers';
import { LanguageService } from './language.service';

const STORAGE_KEY = 'rentityx-language';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, 'language', { value: 'pt-BR', configurable: true });
    TestBed.configureTestingModule({ providers: [provideTestTranslate()] });
  });

  it('defaults to pt-BR when nothing is stored', () => {
    const service = TestBed.inject(LanguageService);

    expect(service.currentLanguage()).toBe('pt-BR');
  });

  it('reads a previously stored language', () => {
    localStorage.setItem(STORAGE_KEY, 'en');

    const service = TestBed.inject(LanguageService);

    expect(service.currentLanguage()).toBe('en');
  });

  it('ignores an invalid stored value and falls back to pt-BR', () => {
    localStorage.setItem(STORAGE_KEY, 'fr');

    const service = TestBed.inject(LanguageService);

    expect(service.currentLanguage()).toBe('pt-BR');
  });

  it('setLanguage updates the signal and persists to localStorage', () => {
    const service = TestBed.inject(LanguageService);

    service.setLanguage('en');

    expect(service.currentLanguage()).toBe('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });

  it('exposes the supported languages', () => {
    const service = TestBed.inject(LanguageService);

    expect(service.supportedLanguages).toEqual(['pt-BR', 'en']);
  });
});
