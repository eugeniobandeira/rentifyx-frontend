import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { VerifyEmailPage } from './verify-email';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('VerifyEmailPage', () => {
  let authService: { verifyEmail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { verifyEmail: vi.fn() };
  });

  function configure(paramsMap: Record<string, string | null>): ComponentFixture<VerifyEmailPage> {
    TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => paramsMap[key] ?? null,
              },
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();
    return fixture;
  }

  it('calls AuthService.verifyEmail with the email/token query params and renders the success view on 200', () => {
    authService.verifyEmail.mockReturnValue(of(user));

    const fixture = configure({ email: user.email, token: 'valid-token' });

    expect(authService.verifyEmail).toHaveBeenCalledWith({
      email: user.email,
      token: 'valid-token',
    });

    const text = fixture.nativeElement.textContent as string;
    expect(text.toLowerCase()).toContain('verified');
    const link = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
  });

  it('renders the generic invalid-link error view on a 400 response (expired/invalid token)', () => {
    authService.verifyEmail.mockReturnValue(
      throwError(() => ({ status: 400 })),
    );

    const fixture = configure({ email: user.email, token: 'expired-token' });

    const text = fixture.nativeElement.textContent as string;
    expect(text.toLowerCase()).toMatch(/no longer valid|expired/);
    const link = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
  });

  it('renders the SAME generic invalid-link error view on a 404 response (anti-enumeration)', () => {
    authService.verifyEmail.mockReturnValue(
      throwError(() => ({ status: 404 })),
    );

    const fixture = configure({ email: user.email, token: 'unknown-token' });

    const text = fixture.nativeElement.textContent as string;
    expect(text.toLowerCase()).toMatch(/no longer valid|expired/);
    expect(text.toLowerCase()).not.toContain('not found');
    expect(text.toLowerCase()).not.toContain('user not found');
  });

  it('shows the error view without calling AuthService.verifyEmail when query params are missing', () => {
    const fixture = configure({});

    expect(authService.verifyEmail).not.toHaveBeenCalled();

    const text = fixture.nativeElement.textContent as string;
    expect(text.toLowerCase()).toMatch(/no longer valid|expired/);
  });
});
