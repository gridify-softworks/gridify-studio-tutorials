import { Component, inject } from '@angular/core';
import { INVOICES } from './invoices';
import { Links } from './links';

/** The tool on the left: a link to every invoice. */
@Component({
  selector: 'app-invoice-list',
  template: `
    <ul>
      @for (invoice of invoices; track invoice.id) {
        <li>
          <!--
            A real link: it has an address (href), so the browser can open it in a new tab, copy
            it or bookmark it. A plain click is caught and opens the invoice here.
          -->
          <a [href]="links.href(invoice.id)" (click)="links.open(invoice.id, $event)">
            Invoice {{ invoice.id }}
          </a>
          <span>{{ invoice.customer }}</span>
        </li>
      }
    </ul>
    <p class="hint">Ctrl+click opens an invoice in a new tab of the browser.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      flex-direction: column;
      padding: 6px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
      font-weight: bold;
    }
    span,
    .hint {
      opacity: 0.88;
    }
  `,
})
export class InvoiceList {
  protected readonly links = inject(Links);
  protected readonly invoices = INVOICES;
}
