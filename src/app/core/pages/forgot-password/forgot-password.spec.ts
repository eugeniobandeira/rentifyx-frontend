import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { ForgotPasswordPage } from './forgot-password';

const validFormValue = {
  email: 'jane@example.com',
};

describe('ForgotPasswordPage', () => {
  let authService: { forgotPassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authService = { forgotPassword: vi.fn() };
  });

  function configure(): ForgotPasswordPage {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('valid submit -> 204 -> swaps to the identical confirmation view', () => {
    const component = configure();
    authService.forgotPassword.mockReturnValue(of(undefined));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(authService.forgotPassword).toHaveBeenCalledWith(validFormValue);
    expect(component.viewState()).toBe('success');
  });

  it('blocks submission client-side when email is empty (fast-fail)', () => {
    const component = configure();

    component.form.setValue({ email: '' });
    component.onSubmit();

    expect(authService.forgotPassword).not.toHaveBeenCalled();
    expect(component.viewState()).toBe('form');
    expect(component.form.get('email')?.invalid).toBe(true);
  });

  it('422 shows an inline field error on the email control and does NOT show the success view', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        title: 'Validation failed',
        status: 422,
        errors: { Email: ['Email is not a valid format.'] },
        extensions: { correlationId: 'abc-123' },
      },
    });
    authService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    const emailControl = component.form.get('email');
    expect(emailControl?.errors?.['server']).toContain('Email is not a valid format.');
    expect(component.viewState()).toBe('form');
  });

  it('429 shows a generic rate-limit banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 429, error: {} });
    authService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
    expect(component.viewState()).toBe('form');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 0, error: null });
    authService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 500, error: {} });
    authService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });
});
