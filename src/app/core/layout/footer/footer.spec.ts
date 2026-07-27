import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

describe('Footer', () => {
  function configure(): ComponentFixture<Footer> {
    TestBed.configureTestingModule({ imports: [Footer], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the current year in the copyright line', () => {
    const fixture = configure();
    const footer = fixture.nativeElement.querySelector('[data-testid="footer"]') as HTMLElement;

    expect(footer.textContent).toContain(`© RentityX ${new Date().getFullYear()}`);
  });

  it('renders Legal and Resources links', () => {
    const fixture = configure();
    const footer = fixture.nativeElement.querySelector('[data-testid="footer"]') as HTMLElement;

    expect(footer.querySelector('[data-testid="footer-terms"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-privacy"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-refund"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-help"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-how-to-cancel"]')?.tagName).toBe('A');
  });

  it('renders the support link and social links', () => {
    const fixture = configure();
    const footer = fixture.nativeElement.querySelector('[data-testid="footer"]') as HTMLElement;

    expect(footer.querySelector('[data-testid="footer-support-link"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-facebook-link"]')?.tagName).toBe('A');
    expect(footer.querySelector('[data-testid="footer-instagram-link"]')?.tagName).toBe('A');
  });
});
