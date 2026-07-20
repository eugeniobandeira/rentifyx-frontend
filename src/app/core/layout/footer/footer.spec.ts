import { TestBed } from '@angular/core/testing';
import { Footer } from './footer';

describe('Footer', () => {
  it('renders the footer with the current year and non-clickable legal labels', () => {
    TestBed.configureTestingModule({ imports: [Footer] });
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('[data-testid="footer"]') as HTMLElement;

    expect(footer.textContent).toContain(`© RentityX ${new Date().getFullYear()}`);
    expect(footer.querySelector('[data-testid="footer-terms"]')?.tagName).toBe('SPAN');
    expect(footer.querySelector('[data-testid="footer-privacy"]')?.tagName).toBe('SPAN');
  });
});
