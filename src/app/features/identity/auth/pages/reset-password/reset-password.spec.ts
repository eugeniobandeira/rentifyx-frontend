import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { ResetPasswordPage } from './reset-password';

const VALID_PASSWORD = 'Sup3r$ecret!123';

describe('ResetPasswordPage', () => {
  let authService: { resetPassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { resetPassword: vi.fn() };
  });

  function configure(
    paramsMap: Record<string, string | null>,
  ): ComponentFixture<ResetPasswordPage> {
    TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
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

    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the form when email/token are present, and shows the success view with a /login link on 204 submit', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    expect(component.viewState()).toBe('form');
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();

    authService.resetPassword.mockReturnValue(of(undefined));

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(authService.resetPassword).toHaveBeenCalledWith({
      email: 'jane@example.com',
      token: 'valid-token',
      newPassword: VALID_PASSWORD,
    });
    expect(component.viewState()).toBe('success');

    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/login"]');
    expect(link).toBeTruthy();
    expect((fixture.nativeElement.textContent as string).toLowerCase()).toMatch(
      /success|password.*(reset|updated|changed)/,
    );
  });

  it('shows the generic "link no longer valid" view immediately, without a form, when email/token query params are missing', () => {
    const fixture = configure({});
    const component = fixture.componentInstance;

    expect(component.viewState()).toBe('invalid-link');
    expect(fixture.nativeElement.querySelector('form')).toBeFalsy();
    expect(authService.resetPassword).not.toHaveBeenCalled();

    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    expect(text).toMatch(/no longer valid|expired/);
  });

  it('shows the SAME generic "link no longer valid" view on a 400 (invalid/expired token) submit response', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'expired-token' });
    const component = fixture.componentInstance;

    authService.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 400 })));

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.viewState()).toBe('invalid-link');
    fixture.detectChanges();
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    expect(text).toMatch(/no longer valid|expired/);
  });

  it('shows the SAME generic "link no longer valid" view on a 404 (user not found) submit response, without revealing the reason', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'unknown-token' });
    const component = fixture.componentInstance;

    authService.resetPassword.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.viewState()).toBe('invalid-link');
    fixture.detectChanges();
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    expect(text).toMatch(/no longer valid|expired/);
    expect(text).not.toContain('not found');
  });

  it('422 on newPassword maps the server error onto the field, keeping the form view', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    const error = new HttpErrorResponse({
      status: 422,
      error: {
        title: 'Validation failed',
        status: 422,
        errors: { newPassword: ['Password is too weak.'] },
        extensions: { correlationId: 'abc-123' },
      },
    });
    authService.resetPassword.mockReturnValue(throwError(() => error));

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.viewState()).toBe('form');
    expect(component.form.get('newPassword')?.errors?.['server']).toContain(
      'Password is too weak.',
    );
  });

  it('rejects a password that fails the strength pattern client-side, without calling the service', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    component.form.setValue({ newPassword: 'alllowercase12' });
    component.onSubmit();

    expect(authService.resetPassword).not.toHaveBeenCalled();
    expect(component.viewState()).toBe('form');
    expect(component.form.get('newPassword')?.invalid).toBe(true);
  });

  it('429 shows a generic rate-limit banner', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    authService.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 429, error: {} })),
    );

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    authService.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0, error: null })),
    );

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const fixture = configure({ email: 'jane@example.com', token: 'valid-token' });
    const component = fixture.componentInstance;

    authService.resetPassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: {} })),
    );

    component.form.setValue({ newPassword: VALID_PASSWORD });
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });
});
