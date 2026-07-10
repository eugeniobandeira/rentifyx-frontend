import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SessionService } from '@core/services/session.service';
import { iUserResponse } from '@features/identity/user/interfaces/user-response';
import { LoginPage } from './login';

const user: iUserResponse = {
  id: 'user-1',
  email: 'jane@example.com',
  role: 'Renter',
  status: 'Active',
  createdAt: '2026-01-01T00:00:00Z',
};

const validFormValue = {
  email: 'jane@example.com',
  password: 'Sup3r$ecret!123',
};

describe('LoginPage', () => {
  let sessionService: { login: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  function configure(paramsMap: Record<string, string | null> = {}): LoginPage {
    sessionService = { login: vi.fn() };
    router = { navigateByUrl: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: SessionService, useValue: sessionService },
        { provide: Router, useValue: router },
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

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('valid submit -> success -> navigates to a safe returnUrl when present', () => {
    const component = configure({ returnUrl: '/units/123?tab=details' });
    sessionService.login.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(sessionService.login).toHaveBeenCalledWith(validFormValue);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/units/123?tab=details');
  });

  it('valid submit -> success -> navigates home when returnUrl is absent', () => {
    const component = configure();
    sessionService.login.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('valid submit -> success -> navigates home when returnUrl is an external/absolute URL (open-redirect prevention)', () => {
    const component = configure({ returnUrl: 'https://evil.example.com' });
    sessionService.login.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('valid submit -> success -> navigates home when returnUrl is a protocol-relative URL (//evil.example.com)', () => {
    const component = configure({ returnUrl: '//evil.example.com' });
    sessionService.login.mockReturnValue(of(user));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('401 renders the backend exact title text in the error banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        title: 'Account is locked due to too many failed attempts.',
        status: 401,
        extensions: { correlationId: 'abc-123' },
      },
    });
    sessionService.login.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Account is locked due to too many failed attempts.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('a different 401 title (invalid credentials) is rendered verbatim too', () => {
    const component = configure();
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        title: 'Invalid email or password.',
        status: 401,
        extensions: { correlationId: 'abc-123' },
      },
    });
    sessionService.login.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Invalid email or password.');
  });

  it('429 shows a generic rate-limit banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 429, error: {} });
    sessionService.login.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Too many attempts — try again shortly');
  });

  it('network/timeout error (status 0) shows a generic connectivity banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 0, error: null });
    sessionService.login.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe("Couldn't reach the server, check your connection");
  });

  it('500 shows a generic server-error banner', () => {
    const component = configure();
    const error = new HttpErrorResponse({ status: 500, error: {} });
    sessionService.login.mockReturnValue(throwError(() => error));

    component.form.setValue(validFormValue);
    component.onSubmit();

    expect(component.banner()).toBe('Something went wrong, try again');
  });

  it('blocks submission client-side when the form is invalid (fast-fail, no request sent)', () => {
    const component = configure();

    component.form.setValue({ email: 'not-an-email', password: '' });
    component.onSubmit();

    expect(sessionService.login).not.toHaveBeenCalled();
  });
});
