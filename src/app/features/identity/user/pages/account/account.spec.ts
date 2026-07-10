import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserService } from '@features/identity/user/services/user.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { AccountPage } from './account';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('AccountPage', () => {
  let userService: { getMe: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userService = { getMe: vi.fn() };
  });

  function configure(): ComponentFixture<AccountPage> {
    TestBed.configureTestingModule({
      imports: [AccountPage],
      providers: [{ provide: UserService, useValue: userService }],
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
  });

  it('shows a generic error state on failure without retrying', () => {
    userService.getMe.mockReturnValue(throwError(() => new Error('boom')));

    const fixture = configure();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain("Couldn't load your profile");
    expect(userService.getMe).toHaveBeenCalledTimes(1);
  });
});
