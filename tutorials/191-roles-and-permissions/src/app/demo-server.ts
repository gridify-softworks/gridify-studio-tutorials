import { HttpRequest } from '@angular/common/http';
import { GrdDemoAuth, GrdDemoRoute } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190): the accounts of the library (`eva`, `jan`, `petra`,
 * all with the password `gridify`) and the session kept across F5.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-191-session' });

/** One order. */
export interface Order {
  id: number;
  customer: string;
  total: number;
}

/** The orders the pretend server keeps (in memory: F5 brings the first three back). */
const orders: Order[] = [
  { id: 1001, customer: 'Northwind', total: 1240 },
  { id: 1002, customer: 'Contoso', total: 310 },
  { id: 1003, customer: 'Fabrikam', total: 5890 },
];

/**
 * The API of the pretend server: what it answers, and the permission it wants for it. `grdDemoBackend`
 * (in app.config.ts) answers the requests to `/demo-api/...` from here. It checks first, as a real
 * server does: a request without a valid session gets 401, a user without the permission 403.
 */
export const demoApi: Record<string, GrdDemoRoute> = {
  // GET /demo-api/orders: the list. Everybody who may see the orders. A copy, as a real server
  // sends a new list every time: the page keeps it in a signal, and a signal does not announce
  // the same array twice.
  'GET /demo-api/orders': { permission: 'orders.view', reply: () => [...orders] },
  // POST /demo-api/orders: a new order. Only who may edit the orders.
  'POST /demo-api/orders': {
    permission: 'orders.edit',
    reply: (request: HttpRequest<unknown>) => {
      const order = {
        ...(request.body as Omit<Order, 'id'>),
        id: Math.max(...orders.map((o) => o.id), 1000) + 1,
      };
      orders.push(order);
      return order;
    },
  },
  // DELETE /demo-api/orders?id=1001: one order away. Only who may delete orders.
  'DELETE /demo-api/orders': {
    permission: 'orders.delete',
    reply: (request: HttpRequest<unknown>) => {
      const id = Number(request.params.get('id'));
      const index = orders.findIndex((order) => order.id === id);
      if (index >= 0) orders.splice(index, 1);
      return { deleted: id };
    },
  },
};
