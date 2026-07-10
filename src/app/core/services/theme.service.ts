import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ColorSchemeMode } from '@core/interfaces/color-scheme-mode';

const STORAGE_KEY = 'rentityx-color-scheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly mode = signal<ColorSchemeMode>(this.readStoredMode());
  private readonly systemPrefersDark = signal(this.readSystemPreference());

  readonly isDark = computed(() => {
    const mode = this.mode();
    return mode === 'system' ? this.systemPrefersDark() : mode === 'dark';
  });

  constructor() {
    this.applyToDocument(this.isDark());
    if (this.isBrowser) {
      this.watchSystemPreference();
    }
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  setMode(mode: ColorSchemeMode): void {
    this.mode.set(mode);
    if (this.isBrowser) {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, mode);
    }
    this.applyToDocument(this.isDark());
  }

  private readStoredMode(): ColorSchemeMode {
    if (!this.isBrowser) {
      return 'system';
    }
    const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  }

  private readSystemPreference(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false;
  }

  private watchSystemPreference(): void {
    const mediaQuery = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery?.addEventListener('change', (event) => {
      this.systemPrefersDark.set(event.matches);
      if (this.mode() === 'system') {
        this.applyToDocument(this.isDark());
      }
    });
  }

  private applyToDocument(isDark: boolean): void {
    this.document.documentElement.classList.toggle('dark', isDark);
  }
}
