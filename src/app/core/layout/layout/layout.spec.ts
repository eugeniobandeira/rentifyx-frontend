import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { SessionService } from '@features/identity/auth/session/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { Layout } from './layout';

@Component({
  standalone: true,
  imports: [Layout],
  template: `
    <app-layout>
      <p data-testid="projected-marker">projected</p>
    </app-layout>
  `,
})
class HostComponent {}

describe('Layout', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([]),
        {
          provide: SessionService,
          useValue: { isAuthenticated: signal(false), isRestoringSession: signal(false) },
        },
        { provide: ThemeService, useValue: { isDark: signal(false), toggle: vi.fn() } },
      ],
    });
  });

  it('renders the header and footer around projected content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="header"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="footer"]')).toBeTruthy();
  });

  it('projects content via ng-content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="projected-marker"]')).toBeTruthy();
  });
});
