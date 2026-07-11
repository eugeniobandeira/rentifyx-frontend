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

  it('returns null for email when nothing is stored', () => {
    const service = configure();

    expect(service.getEmail()).toBeNull();
  });

  it('setEmail persists email in localStorage', () => {
    const service = configure();

    service.setEmail('jane@example.com');

    expect(service.getEmail()).toBe('jane@example.com');
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBe('jane@example.com');
  });

  it('clear removes the persisted email', () => {
    const service = configure();
    service.setEmail('jane@example.com');

    service.clear();

    expect(service.getEmail()).toBeNull();
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBeNull();
  });

  it('never touches localStorage when running on the server (SSR no-op)', () => {
    const service = configure('server');

    service.setEmail('jane@example.com');

    expect(service.getEmail()).toBeNull();
    expect(localStorage.getItem(EMAIL_STORAGE_KEY)).toBeNull();
  });
});
