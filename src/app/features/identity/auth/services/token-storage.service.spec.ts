import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('returns null for tokens and email when nothing is stored', () => {
    const service = TestBed.inject(TokenStorageService);

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.getEmail()).toBeNull();
  });

  it('setSession persists tokens and email for later get calls', () => {
    const service = TestBed.inject(TokenStorageService);

    service.setSession('access-1', 'refresh-1', 'jane@example.com');

    expect(service.getAccessToken()).toBe('access-1');
    expect(service.getRefreshToken()).toBe('refresh-1');
    expect(service.getEmail()).toBe('jane@example.com');
  });

  it('clear removes tokens and email', () => {
    const service = TestBed.inject(TokenStorageService);
    service.setSession('access-1', 'refresh-1', 'jane@example.com');

    service.clear();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.getEmail()).toBeNull();
  });

  it('never touches localStorage/sessionStorage (mechanism intentionally undecided)', () => {
    localStorage.clear();
    sessionStorage.clear();
    const service = TestBed.inject(TokenStorageService);

    service.setSession('access-1', 'refresh-1', 'jane@example.com');
    service.clear();

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
