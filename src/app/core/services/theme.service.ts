import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ColorSchemeMode } from '@core/types/color-scheme-mode';

const STORAGE_KEY = 'rentityx-color-scheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _document = inject(DOCUMENT);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _mode = signal<ColorSchemeMode>(this._readStoredMode());
  private readonly _systemPrefersDark = signal(this._readSystemPreference());

  readonly isDark = computed(() => {
    const mode = this._mode();
    return mode === 'system' ? this._systemPrefersDark() : mode === 'dark';
  });

  constructor() {
    this._applyToDocument(this.isDark());
    if (this._isBrowser) {
      this._watchSystemPreference();
    }
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  setMode(mode: ColorSchemeMode): void {
    this._mode.set(mode);
    if (this._isBrowser) {
      this._document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    }
    this._applyToDocument(this.isDark());
  }

  private _readStoredMode(): ColorSchemeMode {
    if (!this._isBrowser) {
      return 'system';
    }
    const stored = this._document.defaultView?.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  private _readSystemPreference(): boolean {
    if (!this._isBrowser) {
      return false;
    }
    return this._document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private _watchSystemPreference(): void {
    const mediaQuery = this._document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery?.addEventListener('change', (event) => {
      this._systemPrefersDark.set(event.matches);
      if (this._mode() === 'system') {
        this._applyToDocument(this.isDark());
      }
    });
  }

  private _applyToDocument(isDark: boolean): void {
    this._document.documentElement.classList.toggle('dark', isDark);
  }
}
