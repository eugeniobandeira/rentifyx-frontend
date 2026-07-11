import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ForgotPasswordService } from '../services/forgot-password.service';
import { iClassifiedHttpError } from '@shared/interfaces/classified-http-error';
import { ForgotPasswordPage } from './forgot-password';

const validFormValue = {
  email: 'jane@example.com',
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

describe('ForgotPasswordPage', () => {
  let forgotPasswordService: { forgotPassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    forgotPasswordService = { forgotPassword: vi.fn() };
  });

  function configure(): ForgotPasswordPage {
    TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [{ provide: ForgotPasswordService, useValue: forgotPasswordService }],
    });

    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('valid submit -> 204 -> swaps to the identical confirmation view', () => {
    const component = configure();
    forgotPasswordService.forgotPassword.mockReturnValue(of(undefined));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(forgotPasswordService.forgotPassword).toHaveBeenCalledWith(validFormValue);
    expect(component.viewState()).toBe('success');
  });

  it('blocks submission client-side when email is empty (fast-fail)', () => {
    const component = configure();

    component.form.setValue({ email: '' });
    component.onSubmit();

    expect(forgotPasswordService.forgotPassword).not.toHaveBeenCalled();
    expect(component.viewState()).toBe('form');
    expect(component.form.get('email')?.invalid).toBe(true);
  });

  it('422 shows an inline field error on the email control and does NOT show the success view', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'validation',
      status: 422,
      message: 'Validation failed',
      correlationId: 'abc-123',
      validationErrors: { Email: ['Email is not a valid format.'] },
    });
    forgotPasswordService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    const emailControl = component.form.get('email');
    expect(emailControl?.errors?.['server']).toContain('Email is not a valid format.');
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
    forgotPasswordService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.summaryErrors()).toContain('This backend field is not on the form.');
  });

  it('429 shows a generic rate-limit banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'rate-limit',
      status: 429,
      message: 'Too many attempts — try again shortly',
    });
    forgotPasswordService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
    expect(component.viewState()).toBe('form');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const component = configure();
    const error = classifiedError({
      kind: 'network',
      status: 0,
      message: "Couldn't reach the server, check your connection",
    });
    forgotPasswordService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const component = configure();
    const error = classifiedError({ kind: 'server', status: 500 });
    forgotPasswordService.forgotPassword.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });
});
