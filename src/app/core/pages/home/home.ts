import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <section class="hero">
      <p class="eyebrow">RentityX</p>
      <h1>RentityX Frontend</h1>
      <p class="description">A foundational Angular application shell for the next product modules.</p>
    </section>
  `,
  styles: `
    :host {
      display: block;
      padding: 2rem;
    }

    .hero {
      max-width: 720px;
      margin: 0 auto;
      padding: 2.5rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #111827, #1f2937);
      color: #f9fafb;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16);
    }

    .eyebrow {
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.8rem;
      opacity: 0.8;
      margin-bottom: 0.5rem;
    }

    h1 {
      margin: 0 0 0.75rem;
      font-size: 2.2rem;
    }

    .description {
      margin: 0;
      line-height: 1.6;
      color: #d1d5db;
    }
  `,
})
export class HomePage {}
