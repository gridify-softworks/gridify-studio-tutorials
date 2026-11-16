import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { GrdButton } from '@gridify/studio';
import { firstValueFrom } from 'rxjs';
import { EventLog } from './event-log';

/** One order, as the pretend server sends it. */
interface Order {
  id: number;
  customer: string;
  total: number;
}

/** Orders from the server: a request that meets a session the server no longer knows. */
@Component({
  selector: 'app-orders-panel',
  imports: [GrdButton],
  template: `
    <h2>Orders</h2>
    <grd-button label="Load the orders" (pressed)="load()" />
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <ul>
      @for (order of orders(); track order.id) {
        <li>{{ order.id }} {{ order.customer }}: {{ order.total }}</li>
      }
    </ul>
  `,
  styles: `
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
  `,
})
export class OrdersPanel {
  private readonly http = inject(HttpClient);
  private readonly log = inject(EventLog);

  protected readonly orders = signal<Order[]>([]);
  protected readonly message = signal('');

  /**
   * GET /demo-api/orders. When the server no longer knows the session it answers 401, and
   * grdAuthInterceptor takes over: it ends the session here, opens the sign-in window and, once the
   * user has signed in, sends the same request again. This code sees only the end of it: the
   * orders, or an error when the window was closed without signing in.
   */
  protected async load(): Promise<void> {
    this.message.set('Loading…');
    try {
      const orders = await firstValueFrom(this.http.get<Order[]>('/demo-api/orders'));
      this.orders.set(orders);
      this.message.set(`${orders.length} orders, loaded at ${new Date().toLocaleTimeString()}.`);
      this.log.write('The orders came.');
    } catch (error) {
      this.orders.set([]);
      const status = (error as HttpErrorResponse).status;
      this.message.set(`No orders (${status}): the sign-in window was closed without signing in.`);
      this.log.write(`The request of the orders failed: ${status}.`);
    }
  }
}
