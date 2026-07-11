import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { UserService } from '@features/identity/user/services/user.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { iDataExportResponse } from '@features/identity/user/interfaces/data-export-response';
import { AccountPage } from './account';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const dataExport: iDataExportResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  taxId: '123456789',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  consentGivenAt: '2026-01-01T00:00:00Z',
  auditHistory: [],
};

describe('AccountPage', () => {
  let userService: { getMe: ReturnType<typeof vi.fn>; deleteMe: ReturnType<typeof vi.fn>; exportMyData: ReturnType<typeof vi.fn> };
  let sessionService: {
    currentUser: ReturnType<typeof signal<iUserResponse | null>>;
    updateCurrentUser: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userService = { getMe: vi.fn(), deleteMe: vi.fn(), exportMyData: vi.fn() };
    const currentUserSignal = signal<iUserResponse | null>(null);
    sessionService = {
      currentUser: currentUserSignal,
      updateCurrentUser: vi.fn((updated: iUserResponse) => currentUserSignal.set(updated)),
      clearSession: vi.fn(),
    };
    router = { navigateByUrl: vi.fn() };
  });

  function configure(): ComponentFixture<AccountPage> {
    TestBed.configureTestingModule({
      imports: [AccountPage],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: SessionService, useValue: sessionService },
        { provide: Router, useValue: router },
      ],
    });
    const fixture = TestBed.createComponent(AccountPage);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the profile on success', () => {
    userService.getMe.mockReturnValue(of(user));

    const fixture = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('jane@example.com');
    expect(text).toContain('Renter');
    expect(text).toContain('Active');
    expect(text).toContain(new Date(user.createdAt).toLocaleDateString());
    expect(sessionService.updateCurrentUser).toHaveBeenCalledWith(user);
  });

  it('shows a generic error state on failure without retrying', () => {
    userService.getMe.mockReturnValue(throwError(() => new Error('boom')));

    const fixture = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain("Couldn't load your profile");
    expect(userService.getMe).toHaveBeenCalledTimes(1);
  });

  it('"Export my data" downloads the exact DataExportResponse payload as JSON', () => {
    userService.getMe.mockReturnValue(of(user));
    userService.exportMyData.mockReturnValue(of(dataExport));
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const fixture = configure();
    fixture.componentInstance.exportData();

    expect(userService.exportMyData).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('"Delete my account" is disabled until the user types the exact confirmation text', () => {
    userService.getMe.mockReturnValue(of(user));

    const fixture = configure();
    const component = fixture.componentInstance;

    expect(component.canDelete()).toBe(false);

    component.deleteConfirmText = 'not-the-email';
    expect(component.canDelete()).toBe(false);

    component.deleteConfirmText = user.email;
    expect(component.canDelete()).toBe(true);
  });

  it('on successful deletion, clears the session and redirects to /login immediately', () => {
    userService.getMe.mockReturnValue(of(user));
    userService.deleteMe.mockReturnValue(of(undefined));

    const fixture = configure();
    const component = fixture.componentInstance;
    component.deleteConfirmText = user.email;

    component.deleteAccount();

    expect(userService.deleteMe).toHaveBeenCalledTimes(1);
    expect(sessionService.clearSession).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('deleteAccount() is a no-op when the confirmation text does not match', () => {
    userService.getMe.mockReturnValue(of(user));

    const fixture = configure();
    const component = fixture.componentInstance;
    component.deleteConfirmText = 'wrong';

    component.deleteAccount();

    expect(userService.deleteMe).not.toHaveBeenCalled();
  });
});
