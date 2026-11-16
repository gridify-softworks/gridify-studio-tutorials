import { Component, computed, inject } from '@angular/core';
import { GrdAuth, grdUserName } from '@gridify/studio';

/** One order of the list. */
interface Order {
  id: number;
  customer: string;
  total: number;
}

/** The orders. Only a signed-in user gets here: the route has the guard (see app.routes.ts). */
@Component({
  selector: 'app-orders',
  template: `
    <h1>Orders</h1>
    <p>Hello, {{ name() }}! Only a signed-in user sees this page.</p>
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th class="number">Total</th>
        </tr>
      </thead>
      <tbody>
        @for (order of orders; track order.id) {
          <tr>
            <td>{{ order.id }}</td>
            <td>{{ order.customer }}</td>
            <td class="number">{{ order.total }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    table {
      border-collapse: collapse;
    }
    th,
    td {
      padding: 4px 12px;
      border-bottom: 1px solid var(--grd-border-color);
      text-align: left;
    }
    .number {
      text-align: right;
    }
  `,
})
export class OrdersPage {
  private readonly auth = inject(GrdAuth);

  /** The name of the user who is signed in. */
  protected readonly name = computed(() => grdUserName(this.auth.user()));

  /** The orders. A real application loads them from its server, which checks the user again. */
  protected readonly orders: Order[] = [
    { id: 1001, customer: 'Northwind', total: 1240 },
    { id: 1002, customer: 'Contoso', total: 310 },
    { id: 1003, customer: 'Fabrikam', total: 5890 },
  ];
}
