import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

const EMAIL_STORAGE_KEY = 'rentityx-session-email';

describe('TokenStorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function configure(platform: 'browser' | 'server' = 'browser'): TokenStorageService {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(TokenStorageService);
  }

  it('returns null for accessToken and email when nothing is stored', () => {
    const service = configure();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getEmail()).toBeNull();
  });

  it('setSession persists accessToken in memory and email in localStorage', () => {
    const service = configure();

    service.setSession('access-1', 'jane@example.com');

    expect(service.getAccessToken()).toBe('access-1');
    expect(service.getEmail()).toBe('jane@example.com');
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBe('jane@example.com');
  });

  it('clear removes both the in-memory accessToken and the persisted email', () => {
    const service = configure();
    service.setSession('access-1', 'jane@example.com');

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getEmail()).toBeNull();
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBeNull();
  });

  it('never touches localStorage when running on the server (SSR no-op)', () => {
    const service = configure('server');

    service.setSession('access-1', 'jane@example.com');

    expect(service.getEmail()).toBeNull();
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBeNull();
  });

  it('never persists the accessToken to localStorage (memory-only, mandated by api-contracts.md)', () => {
    const service = configure();

    service.setSession('access-1', 'jane@example.com');

    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe(EMAIL_STORAGE_KEY);
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).not.toBe('access-1');
  });
});
