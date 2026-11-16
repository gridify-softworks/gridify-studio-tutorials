import { Component, input } from '@angular/core';

/** An invoice. Its tab is opened with the class and the key together, and nothing else registers the key (see `openInvoice` in `app.ts`). */
@Component({
  selector: 'app-invoice',
  template: `
    <h3>Invoice {{ number() }}</h3>
    <p>3 items, 1,250 EUR, due in 14 days.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Invoice {
  readonly number = input.required<string>();
}
