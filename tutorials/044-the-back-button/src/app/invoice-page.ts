import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { findInvoice, totalOf } from './invoices';
import { Links } from './links';

/** A document: one invoice. The bridge opens it with the number from the address (see app.ts). */
@Component({
  selector: 'app-invoice-page',
  imports: [CurrencyPipe],
  template: `
    @if (invoice(); as invoice) {
      <h2>Invoice {{ invoice.id }}</h2>
      <p>{{ invoice.customer }}, {{ invoice.date }}</p>
      <table>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
        @for (line of invoice.lines; track line.item) {
          <tr>
            <td>{{ line.item }}</td>
            <td>{{ line.quantity }}</td>
            <td>{{ line.price | currency: 'EUR' }}</td>
            <td>{{ line.quantity * line.price | currency: 'EUR' }}</td>
          </tr>
        }
        <tr>
          <th colspan="3">Total</th>
          <th>{{ total() | currency: 'EUR' }}</th>
        </tr>
      </table>
      <!-- The link that would go by e-mail: it opens this invoice in a new tab of the browser. -->
      <p>A link to this invoice:</p>
      <p>
        <a [href]="links.href(invoice.id)" target="_blank">{{ link() }}</a>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    h2 {
      margin: 0 0 4px;
    }
    table {
      border-collapse: collapse;
      margin: 12px 0;
    }
    th,
    td {
      padding: 4px 12px 4px 0;
      text-align: left;
      border-bottom: 1px solid var(--grd-border-color);
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class InvoicePage {
  /** The number of the invoice: the input that the resolver of the bridge gives the tab. */
  readonly id = input.required<string>();

  protected readonly links = inject(Links);
  protected readonly invoice = computed(() => findInvoice(this.id()));
  protected readonly total = computed(() => {
    const invoice = this.invoice();
    return invoice ? totalOf(invoice) : 0;
  });
  /** The whole address of the link, as it would be sent by e-mail. */
  protected readonly link = computed(() => new URL(this.links.href(this.id()), location.href).href);
}
