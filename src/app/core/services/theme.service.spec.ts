import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'rentityx-color-scheme';

function mockMatchMedia(matches: boolean): {
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
} {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener,
      removeEventListener,
    }),
  });
  return { addEventListener, removeEventListener };
}

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to the system color-scheme preference when nothing is stored', () => {
    mockMatchMedia(true);
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setMode persists the choice and applies the "dark" class', () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    service.setMode('dark');

    expect(service.isDark()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle flips between light and dark', () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({});

    const service = TestBed.inject(ThemeService);
    service.setMode('light');

    service.toggle();
    expect(service.isDark()).toBe(true);

    service.toggle();
    expect(service.isDark()).toBe(false);
  });

  it('removes the matchMedia change listener when the service is destroyed', () => {
    const { addEventListener, removeEventListener } = mockMatchMedia(false);
    TestBed.configureTestingModule({});

    TestBed.inject(ThemeService);

    expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    const registeredHandler = addEventListener.mock.calls[0][1];

    TestBed.resetTestingModule();

    expect(removeEventListener).toHaveBeenCalledWith('change', registeredHandler);
  });
});
