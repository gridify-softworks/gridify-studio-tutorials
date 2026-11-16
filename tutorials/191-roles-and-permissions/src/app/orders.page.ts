import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdButton, GrdCan } from '@gridify/studio';
import { firstValueFrom } from 'rxjs';
import { Order } from './demo-server';

/**
 * The orders, from the server. Who may see this page decides the guard (`orders.view`); what may be
 * done with an order decides `*grdCan` in the page, and the server on every request.
 */
@Component({
  selector: 'app-orders',
  imports: [GrdButton, GrdCan, RouterLink],
  template: `
    <h1>Orders</h1>
    <!-- Only who may create an order sees the link. -->
    <p *grdCan="'orders.edit'"><a routerLink="/new-order">New order</a></p>

    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th class="number">Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        @for (order of orders(); track order.id) {
          <tr>
            <td>{{ order.id }}</td>
            <td>{{ order.customer }}</td>
            <td class="number">{{ order.total }}</td>
            <td>
              <!-- The button only for who may delete; the others see why there is none. -->
              <grd-button
                *grdCan="'orders.delete'; else noDelete"
                label="Delete"
                (pressed)="remove(order.id)"
              />
              <ng-template #noDelete><span class="muted">You may not delete</span></ng-template>
            </td>
          </tr>
        }
      </tbody>
    </table>

    <!--
      The lesson of the page: hiding a button protects nothing. This button is there for everybody
      and sends the request without asking the browser first. The server says no (403) to a user who
      may not delete.
    -->
    <h2>Ask the server anyway</h2>
    <p>
      This button is there for everybody. It deletes the first order without any check in the
      browser, the way somebody could send the request by hand.
    </p>
    <grd-button label="Delete the first order anyway" (pressed)="removeFirstAnyway()" />
    @if (answer()) {
      <p class="answer">{{ answer() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
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
    .muted {
      opacity: 0.88;
    }
    .answer {
      font-weight: bold;
    }
  `,
})
export class OrdersPage {
  private readonly http = inject(HttpClient);

  /** The orders as the server has them. */
  protected readonly orders = signal<Order[]>([]);
  /** What the server answered to the last "anyway". */
  protected readonly answer = signal('');

  constructor() {
    void this.load();
  }

  /** GET /demo-api/orders. The interceptor puts the token on the request; the server checks it. */
  private async load(): Promise<void> {
    this.orders.set(await firstValueFrom(this.http.get<Order[]>('/demo-api/orders')));
  }

  /** DELETE /demo-api/orders?id=..., then the list again. */
  protected async remove(id: number): Promise<void> {
    await firstValueFrom(this.http.delete('/demo-api/orders', { params: { id } }));
    await this.load();
  }

  /** The same request, from a button that everybody has: the server decides. */
  protected async removeFirstAnyway(): Promise<void> {
    const first = this.orders()[0];
    if (!first) return;
    try {
      await this.remove(first.id);
      this.answer.set(`The server deleted order ${first.id}: your account may delete orders.`);
    } catch (error) {
      const status = (error as HttpErrorResponse).status;
      this.answer.set(
        status === 403
          ? 'The server answered 403 Forbidden: your account may not delete orders.'
          : `The server answered ${status}.`,
      );
    }
  }
}
