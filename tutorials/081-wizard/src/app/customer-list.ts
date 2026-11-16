import { Component, inject } from '@angular/core';
import { GrdButton, GrdTabContext } from '@gridify/studio';
import { Customers, showTab } from './customers';

/** A document: the customers, and the way to a new one. */
@Component({
  selector: 'app-customer-list',
  imports: [GrdButton],
  template: `
    <grd-button label="New customer…" variant="primary" (pressed)="newCustomer()" />
    <table>
      <tr>
        <th>Company</th>
        <th>Country</th>
        <th>Contact</th>
        <th>E-mail</th>
      </tr>
      @for (customer of customers.list(); track $index) {
        <tr>
          <td>{{ customer.company }}</td>
          <td>{{ customer.country }}</td>
          <td>{{ customer.contact }}</td>
          <td>{{ customer.email }}</td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    table {
      border-collapse: collapse;
      margin-top: 12px;
    }
    th,
    td {
      padding: 4px 16px 4px 0;
      text-align: left;
      border-bottom: 1px solid var(--grd-border-color);
    }
  `,
})
export class CustomerList {
  protected readonly customers = inject(Customers);
  /** The tab of this list: through it the list reaches the engine. */
  private readonly tab = inject(GrdTabContext);

  /** The wizard opens in a tab of its own (or the open one is shown). */
  protected newCustomer(): void {
    showTab(this.tab.engine, 'new-customer', 'New customer', 'new-customer');
  }
}
