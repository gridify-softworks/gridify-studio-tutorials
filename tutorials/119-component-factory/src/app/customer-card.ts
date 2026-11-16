import { Component, input } from '@angular/core';
import type { Customer } from './customer-server';

/** The card of a customer. It only shows what it is given: the factory in `app.ts` asks the server and hands the customer in. */
@Component({
  selector: 'app-customer-card',
  template: `
    <h2>{{ customer().name }}</h2>
    <dl>
      <dt>Company</dt>
      <dd>{{ customer().company }}</dd>
      <dt>City</dt>
      <dd>{{ customer().city }}</dd>
      <dt>Customer since</dt>
      <dd>{{ customer().since }}</dd>
    </dl>
    <p class="note">Loaded from the server at {{ loadedAt }}.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    h2 {
      font-size: 1.1rem;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
    }
    dt {
      opacity: 0.88;
    }
    dd {
      margin: 0;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class CustomerCard {
  readonly customer = input.required<Customer>();
  protected readonly loadedAt = new Date().toLocaleTimeString();
}
