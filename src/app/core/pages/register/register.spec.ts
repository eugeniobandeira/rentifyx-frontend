import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from '@features/identity/auth/services/auth.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { RegisterPage } from './register';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const validFormValue = {
  email: 'jane@example.com',
  taxId: '123456789',
  password: 'Sup3r$ecret!123',
  role: 'Renter' as const,
  consentGiven: true,
};

describe('RegisterPage', () => {
  let authService: { register: ReturnType<typeof vi.fn> };

  function configure(): RegisterPage {
    authService = { register: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('valid submit -> 201 -> swaps to the confirmation view (no route change)', () => {
    const component = configure();
    authService.register.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(authService.register).toHaveBeenCalledWith(validFormValue);
    expect(component.viewState()).toBe('success');
  });

  it('blocks submission client-side when consentGiven is unchecked (fast-fail)', () => {
    const component = configure();

    component.form.setValue({ ...validFormValue, consentGiven: false });
    component.onSubmit();

    expect(authService.register).not.toHaveBeenCalled();
    expect(component.viewState()).toBe('form');
    expect(component.form.get('consentGiven')?.invalid).toBe(true);
  });

  it('422 on a rendered field maps errors[field] onto that control (case-insensitive)', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        title: 'Validation failed',
        status: 422,
        errors: { Email: ['Email is already in a weird format.'] },
        extensions: { correlationId: 'abc-123' },
      },
    });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    const emailControl = component.form.get('email');
    expect(emailControl?.errors?.['server']).toContain('Email is already in a weird format.');
    expect(component.viewState()).toBe('form');
  });

  it('422 on a field not rendered by the form collects into the summary banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        title: 'Validation failed',
        status: 422,
        errors: { someOtherField: ['This backend field is not on the form.'] },
        extensions: { correlationId: 'abc-123' },
      },
    });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.summaryErrors()).toContain('This backend field is not on the form.');
  });

  it('409 shows the backend title in a conflict banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        title: 'Email jane@example.com is already registered.',
        status: 409,
        extensions: { correlationId: 'abc-123' },
      },
    });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Email jane@example.com is already registered.');
  });

  it('429 shows a generic rate-limit banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 429, error: {} });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 0, error: null });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 500, error: {} });
    authService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });
});
