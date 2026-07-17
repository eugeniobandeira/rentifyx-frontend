import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegisterService } from '../services/register.service';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { RegisterPage } from './register';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
  essentialConsentGranted: true,
  essentialConsentGivenAt: '2026-01-01T00:00:00Z',
  essentialConsentRevokedAt: null,
  marketingConsentGranted: false,
  marketingConsentGivenAt: null,
  marketingConsentRevokedAt: null,
};

const validFormValue = {
  email: 'jane@example.com',
  taxId: '123456789',
  password: 'Sup3r$ecret!123',
  role: 'Renter' as const,
  consentGiven: true,
};

function classifiedError(overrides: Partial<iClassifiedHttpError>): iClassifiedHttpError {
  return {
    kind: 'server',
    status: 500,
    message: 'Something went wrong, try again',
    correlationId: null,
    validationErrors: null,
    ...overrides,
  };
}

describe('RegisterPage', () => {
  let registerService: { register: ReturnType<typeof vi.fn> };

  function configure(): RegisterPage {
    registerService = { register: vi.fn() };

    TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [{ provide: RegisterService, useValue: registerService }],
    });

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('valid submit -> 201 -> swaps to the confirmation view (no route change)', () => {
    const component = configure();
    registerService.register.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(registerService.register).toHaveBeenCalledWith(validFormValue);
    expect(component.viewState()).toBe('success');
  });

  it('blocks submission client-side when consentGiven is unchecked (fast-fail)', () => {
    const component = configure();

    component.form.setValue({ ...validFormValue, consentGiven: false });
    component.onSubmit();

    expect(registerService.register).not.toHaveBeenCalled();
    expect(component.viewState()).toBe('form');
    expect(component.form.get('consentGiven')?.invalid).toBe(true);
  });

  it('422 on a rendered field maps errors[field] onto that control (case-insensitive)', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'validation',
      status: 422,
      message: 'Validation failed',
      correlationId: 'abc-123',
      validationErrors: { Email: ['Email is already in a weird format.'] },
    });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    const emailControl = component.form.get('email');
    expect(emailControl?.errors?.['server']).toContain('Email is already in a weird format.');
    expect(component.viewState()).toBe('form');
  });

  it('422 on a field not rendered by the form collects into the summary banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'validation',
      status: 422,
      message: 'Validation failed',
      correlationId: 'abc-123',
      validationErrors: { someOtherField: ['This backend field is not on the form.'] },
    });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.summaryErrors()).toContain('This backend field is not on the form.');
  });

  it('409 shows the backend title in a conflict banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'conflict',
      status: 409,
      message: 'Email jane@example.com is already registered.',
      correlationId: 'abc-123',
    });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Email jane@example.com is already registered.');
  });

  it('429 shows a generic rate-limit banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'rate-limit',
      status: 429,
      message: 'Too many attempts — try again shortly',
    });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'network',
      status: 0,
      message: "Couldn't reach the server, check your connection",
    });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const component = configure();
    const error = classifiedError({ kind: 'server', status: 500 });
    registerService.register.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });
});
