# 191 – Roles and permissions

This tutorial shows how an application decides what a signed-in user may do: which links and buttons they see, which pages open for them, and what the server lets them do. You will learn how to:

- give the users permissions by their roles (`permissionsOf`, `grdRolePermissions`);
- ask in the code whether the user may do something (`auth.can('orders.edit')`, `auth.hasRole('admin')`);
- show a link or a button only to a user who may use it (`*grdCan`, with `else` for the others);
- keep a page closed for a user who may not open it, with a page that says so (`grdAuthGuard` with `permission`, `role` and `forbidden`);
- send the requests of the user to the server with the token (`grdAuthInterceptor`), and see that the server checks again (`403 Forbidden`).

It starts from the application of 190 (the sign-in page, the guard, the header) and adds the permissions.

```
npm run tutorial 191
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30191 and sign in as one of three users, all with the password `gridify`:

| User    | Name          | Role     | May                              |
| ------- | ------------- | -------- | -------------------------------- |
| `eva`   | Eva Müller    | `admin`  | everything                       |
| `jan`   | Jan Wagner    | `editor` | everything with the orders       |
| `petra` | Petra Schmidt | `viewer` | look at the orders, nothing more |

The sign-in page has a button for each of them, so you can switch quickly.

## The words first

- **A role** says what kind of user somebody is: `admin`, `editor`, `viewer`. The server gives every user their roles; the application does not choose them.
- **A permission** says what may be done: the name of a thing and an action, `orders.view`, `orders.edit`, `orders.delete`. The application asks for permissions, not for roles: `can('orders.delete')` stays right when a new role gets that permission, `hasRole('editor')` would not.
- **`*`** is every permission, **`orders.*`** every permission of the orders.
- **Three places check**, and only the last one protects anything:
  1. the page hides what the user may not use (`*grdCan`): a comfort, so nobody clicks in vain;
  2. the guard keeps a page closed (`grdAuthGuard`): a comfort, so nobody sees a page that would not work;
  3. **the server** checks every request, and says `403 Forbidden` to a user who may not. This is the real protection: anybody can change the code in their browser, or send a request by hand.

## Step by step

### Step 1: the permissions of the roles

A table says what each role may do. Add `src/app/permissions.ts`:

```ts
/**
 * What each role may do.
 *
 * Every account of the pretend server has a role: `eva` is an `admin`, `jan` an `editor`, `petra` a
 * `viewer`. A permission is the name of a thing and what may be done with it: `orders.view`,
 * `orders.edit`, `orders.delete`. `*` is everything, `orders.*` everything with the orders.
 *
 * The pretend server has the same table (`GRD_DEMO_PERMISSIONS` of the library) and checks every
 * request by it, so the browser and the server agree.
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  editor: ['orders.*', 'reports.view'],
  viewer: ['orders.view', 'reports.view'],
};
```

and give it to `GrdAuth` in `src/app/app.config.ts`:

```ts
provideGrdAuth({
  providers: [demoServer.password],
  // The permissions of a user: here from the roles (the table of permissions.ts). A server may
  // also send permissions with the user (`user.permissions`); GrdAuth takes both.
  permissionsOf: grdRolePermissions(ROLE_PERMISSIONS),
}),
```

`grdRolePermissions(table)` makes the function that gives the permissions of a user: those of all their roles together. `GrdAuth` adds the permissions that the server sent with the user itself (`user.permissions`), if any. In a real application the table often lives on the server, which then sends the permissions with the user; the code of the pages does not change.

### Step 2: ask in the code

The first page (`src/app/home.page.ts`) asks `GrdAuth` what the user may do, and shows the answers in a table:

```ts
protected readonly questions = computed<Question[]>(() => [
  {
    what: 'see the orders',
    code: "auth.can('orders.view')",
    answer: this.auth.can('orders.view'),
  },
  {
    what: 'create an order',
    code: "auth.can('orders.edit')",
    answer: this.auth.can('orders.edit'),
  },
  {
    what: 'delete an order',
    code: "auth.can('orders.delete')",
    answer: this.auth.can('orders.delete'),
  },
  {
    what: 'see the reports',
    code: "auth.can('reports.view')",
    answer: this.auth.can('reports.view'),
  },
  { what: 'administer', code: "auth.hasRole('admin')", answer: this.auth.hasRole('admin') },
]);
```

- **`auth.can('orders.edit')`** is `true` when the user has the permission (or `orders.*`, or `*`). Nobody signed in has no permission at all.
- **`auth.hasRole('admin')`** asks for a role.
- **`auth.permissions()`** is the list of all the permissions of the user (the page shows it).

They read the session, a signal, so in a `computed` or a template the answers follow every sign-in by themselves: sign in as somebody else, and the table changes.

### Step 3: show only what the user may use

`*grdCan` is like `*ngIf` for a permission. The links of the bar in `src/app/app.ts`:

<!-- prettier-ignore -->
```html
<nav>
  <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exact">Home</a>
  <a *grdCan="'orders.view'" routerLink="/orders" routerLinkActive="active">Orders</a>
  <a *grdCan="'orders.edit'" routerLink="/new-order" routerLinkActive="active">New order</a>
  <a *grdCan="{ role: 'admin' }" routerLink="/administration" routerLinkActive="active">
    Administration
  </a>
</nav>
```

- `*grdCan="'orders.view'"` shows the element while the user has the permission (mind the quotes: the value is a text).
- `*grdCan="{ role: 'admin' }"` asks for a role. A rule can also ask for several permissions (`['orders.view', 'reports.view']`, all of them) or for any of them (`{ permission: [...], any: true }`).

With **`else`** the others see something instead. The orders page (`src/app/orders.page.ts`) has a **Delete** button only for who may delete:

<!-- prettier-ignore -->
```html
<grd-button
  *grdCan="'orders.delete'; else noDelete"
  label="Delete"
  (pressed)="remove(order.id)"
/>
<ng-template #noDelete><span class="muted">You may not delete</span></ng-template>
```

### Step 4: a page that only some may open

The guard of 190 only asked for a signed-in user. It can also ask for a permission or a role, and send a user who may not open the page elsewhere. `src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { grdAuthGuard } from '@gridify/studio';
import { AdministrationPage } from './administration.page';
import { ForbiddenPage } from './forbidden.page';
import { HomePage } from './home.page';
import { NewOrderPage } from './new-order.page';
import { OrdersPage } from './orders.page';
import { SignInPage } from './sign-in.page';

/**
 * The guards. Each says what a page needs. Somebody who is not signed in goes to the sign-in page
 * (`signIn`, as in 190); somebody who is signed in but may not open the page goes to `/forbidden`.
 */
const mayViewOrders = grdAuthGuard({
  permission: 'orders.view',
  signIn: '/sign-in',
  forbidden: '/forbidden',
});
const mayEditOrders = grdAuthGuard({
  permission: 'orders.edit',
  signIn: '/sign-in',
  forbidden: '/forbidden',
});
// A role instead of a permission: only an administrator.
const isAdmin = grdAuthGuard({ role: 'admin', signIn: '/sign-in', forbidden: '/forbidden' });

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Home' },
  { path: 'sign-in', component: SignInPage, title: 'Sign in' },
  { path: 'forbidden', component: ForbiddenPage, title: 'Not allowed' },
  { path: 'orders', component: OrdersPage, title: 'Orders', canActivate: [mayViewOrders] },
  { path: 'new-order', component: NewOrderPage, title: 'New order', canActivate: [mayEditOrders] },
  {
    path: 'administration',
    component: AdministrationPage,
    title: 'Administration',
    canActivate: [isAdmin],
  },
  { path: '**', redirectTo: '' },
];
```

The guard now decides in three ways:

1. nobody signed in: to the sign-in page (`signIn`), and back after signing in, as in 190;
2. signed in and allowed: the page opens;
3. signed in but **not allowed**: to `forbidden` (here `/forbidden`). Without `forbidden` the page simply does not open, and the user stays where they were.

`src/app/forbidden.page.ts` says why:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth, grdUserName } from '@gridify/studio';

/** Where a guard sends a user who is signed in but may not open the page (`forbidden: '/forbidden'`). */
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <h1>Not allowed</h1>
    <p>{{ name() }}, your account may not open this page.</p>
    <p>
      Go to the <a routerLink="/">first page</a>, or <a routerLink="/sign-in">sign in</a> as
      somebody else.
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class ForbiddenPage {
  private readonly auth = inject(GrdAuth);
  protected readonly name = computed(() => grdUserName(this.auth.user()));
}
```

The first page has links to every page for everybody (the bar has only those the user may open): sign in as Petra and click **New order** there, to see the guard at work.

### Step 5: the server checks too

The orders now come from the (pretend) server, and the server checks every request. `src/app/demo-server.ts` has the API of the pretend server, with the permission each request needs:

```ts
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
```

`src/app/app.config.ts` sends the requests of the application there:

```ts
// The requests of the application. The order counts:
// 1. grdAuthInterceptor puts the token of the signed-in user on every request of this site
//    (Authorization: Bearer ...), so the server knows who asks.
// 2. grdDemoBackend plays the server: it answers /demo-api/... from demo-server.ts. With a real
//    server, leave it out.
provideHttpClient(
  withInterceptors([grdAuthInterceptor(), grdDemoBackend(demoServer, demoApi)]),
),
```

- **`grdAuthInterceptor()`** puts the token of the signed-in user on every request to the site of the application (`Authorization: Bearer ...`). That is how the server knows who asks. (It also handles a session that the server no longer accepts, `401`: 193 shows that.)
- **`grdDemoBackend(demoServer, demoApi)`** plays the server: it answers `/demo-api/...` from the table above, and checks first, as a real server does: without a valid token `401 Unauthorized`, without the permission `403 Forbidden`. With a real server, this line goes away and the requests go to the network.

The orders page loads the list with `HttpClient`:

```ts
/** GET /demo-api/orders. The interceptor puts the token on the request; the server checks it. */
private async load(): Promise<void> {
  this.orders.set(await firstValueFrom(this.http.get<Order[]>('/demo-api/orders')));
}
```

and deletes an order the same way:

```ts
/** DELETE /demo-api/orders?id=..., then the list again. */
protected async remove(id: number): Promise<void> {
  await firstValueFrom(this.http.delete('/demo-api/orders', { params: { id } }));
  await this.load();
}
```

and it has one button that everybody sees: **Delete the first order anyway**. It sends the same request without asking `*grdCan` first, the way somebody could send it by hand:

```ts
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
```

Sign in as Petra and press it: the server answers `403 Forbidden`, and nothing is deleted. That is the point of the whole tutorial: **the browser hides, the server decides**.

### Step 6: switch users quickly

To try the roles, the sign-in page (`src/app/sign-in.page.ts`) has a button for each user. A button signs in with the same call that the form makes:

```ts
protected async signInAs(username: string): Promise<void> {
  const result = await this.auth.signIn('password', { username, password: 'gridify' });
  if (result.status === 'ok') this.goOn();
}
```

`signIn(providerId, input)` takes the id of the provider (`password`) and the fields of its form. The answer is `ok`, `error` (a wrong password) or `challenge` (a step more, see 192). A user who is signed in already is replaced by the new one.

### Step 7: run it

```
npm run tutorial 191
```

## Try it

1. **Petra (viewer).** On the sign-in page press **Petra (viewer)**. The bar has only **Home** and **Orders**. The table of the first page: she may see the orders and the reports, nothing more.
2. **The orders as Petra.** Open **Orders**: no **New order** link, and _You may not delete_ instead of the **Delete** buttons.
3. **The server as Petra.** Press **Delete the first order anyway**: _The server answered 403 Forbidden_. The order is still there.
4. **The guard as Petra.** On the first page, click **New order** or **Administration** in the list of every page: the _Not allowed_ page.
5. **Jan (editor).** Open **Sign in** (the link on the _Not allowed_ page) and press **Jan (editor)**. The bar gets **New order**, the orders get **Delete** buttons, the first page says _yes_ to everything but _administer_. **Delete the first order anyway** deletes it now.
6. **A new order.** As Jan, open **New order**, type a customer and press **Save**: it is in the list (the pretend server keeps it until F5).
7. **Eva (admin).** Sign in as Eva: **Administration** is in the bar, with the accounts of the pretend server and their permissions.
8. **F5** keeps the user (as in 190); the orders of the pretend server come back as they were at the start.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdAuth, GrdButton, GrdCan, grdUserName } from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdCan, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <grd-app-header productName="Orders" subtitle="Tutorial 191" preferences="theme density">
      <div grdAppHeaderEnd class="who">
        @if (auth.user()) {
          <span>{{ who() }}</span>
          <grd-button label="Sign out" (pressed)="signOut()" />
        } @else {
          <a routerLink="/sign-in">Sign in</a>
        }
      </div>
    </grd-app-header>

    <!--
      A link is there only for who may open its page (*grdCan). That is a comfort, not a lock: the
      guard of the route checks again, and the server checks every request.
    -->
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exact">Home</a>
      <a *grdCan="'orders.view'" routerLink="/orders" routerLinkActive="active">Orders</a>
      <a *grdCan="'orders.edit'" routerLink="/new-order" routerLinkActive="active">New order</a>
      <a *grdCan="{ role: 'admin' }" routerLink="/administration" routerLinkActive="active">
        Administration
      </a>
    </nav>

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: var(--grd-text-main);
      background: var(--grd-bg-main);
    }
    .who {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    nav {
      display: flex;
      gap: 16px;
      padding: 6px 16px;
      border-bottom: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
    nav a.active {
      font-weight: bold;
      text-decoration: none;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);

  /** The link of the first page is marked only on that page. */
  protected readonly exact = { exact: true };

  /** `Signed in as Eva Müller (admin)`: the name and the roles of the user. */
  protected readonly who = computed(() => {
    const user = this.auth.user();
    return user ? `Signed in as ${grdUserName(user)} (${user.roles.join(', ')})` : '';
  });

  constructor() {
    // Signed out here or in another window: back to the first page (see 190).
    this.auth.on('signedOut', () => void this.router.navigateByUrl('/'));
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
```

`src/app/home.page.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth } from '@gridify/studio';

/** One question that the application asks GrdAuth, for the table of the first page. */
interface Question {
  what: string;
  code: string;
  answer: boolean;
}

/** The first page: what the user who is signed in may do, and a link to every page. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Roles and permissions</h1>
    @if (auth.user(); as user) {
      <p>
        Your roles: <code>{{ user.roles.join(', ') }}</code>
      </p>
      <p>
        What they let you do: <code>{{ auth.permissions().join(', ') }}</code>
      </p>
      <!-- The questions of the application, and what GrdAuth answers for this user. -->
      <table>
        <thead>
          <tr>
            <th>May I…</th>
            <th>The question in the code</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          @for (question of questions(); track question.code) {
            <tr>
              <td>{{ question.what }}</td>
              <td>
                <code>{{ question.code }}</code>
              </td>
              <td [class.yes]="question.answer" [class.no]="!question.answer">
                {{ question.answer ? 'yes' : 'no' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <p>Nobody is signed in. <a routerLink="/sign-in">Sign in</a> as one of the users below.</p>
    }

    <h2>Every page</h2>
    <p>
      The bar above has only the pages you may open. These links are there for everybody, so you can
      see what the guards do with a page you may not open:
    </p>
    <ul>
      <li><a routerLink="/orders">Orders</a>: needs <code>orders.view</code></li>
      <li><a routerLink="/new-order">New order</a>: needs <code>orders.edit</code></li>
      <li><a routerLink="/administration">Administration</a>: needs the role <code>admin</code></li>
    </ul>

    <h2>The users</h2>
    <p>Every account has the password <code>gridify</code>.</p>
    <ul>
      <li><code>eva</code> (Eva Müller): <code>admin</code>, may do everything</li>
      <li><code>jan</code> (Jan Wagner): <code>editor</code>, may do everything with the orders</li>
      <li><code>petra</code> (Petra Schmidt): <code>viewer</code>, may only look</li>
    </ul>
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
    .yes {
      color: var(--grd-success-text);
      font-weight: bold;
    }
    .no {
      color: var(--grd-danger-text);
      font-weight: bold;
    }
  `,
})
export class HomePage {
  protected readonly auth = inject(GrdAuth);

  /**
   * The questions. `can` and `hasRole` read the session, a signal, so the answers follow every
   * sign-in and sign-out by themselves.
   */
  protected readonly questions = computed<Question[]>(() => [
    {
      what: 'see the orders',
      code: "auth.can('orders.view')",
      answer: this.auth.can('orders.view'),
    },
    {
      what: 'create an order',
      code: "auth.can('orders.edit')",
      answer: this.auth.can('orders.edit'),
    },
    {
      what: 'delete an order',
      code: "auth.can('orders.delete')",
      answer: this.auth.can('orders.delete'),
    },
    {
      what: 'see the reports',
      code: "auth.can('reports.view')",
      answer: this.auth.can('reports.view'),
    },
    { what: 'administer', code: "auth.hasRole('admin')", answer: this.auth.hasRole('admin') },
  ]);
}
```

`src/app/orders.page.ts`:

```ts
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
```

`src/app/new-order.page.ts`:

```ts
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GrdButton, GrdInput, GrdSpinner } from '@gridify/studio';
import { firstValueFrom } from 'rxjs';

/** A new order. The guard lets in only who may edit the orders (`orders.edit`). */
@Component({
  selector: 'app-new-order',
  imports: [GrdButton, GrdInput, GrdSpinner],
  template: `
    <h1>New order</h1>
    <div class="form">
      <grd-input label="Customer" required [(value)]="customer" />
      <grd-spinner label="Total" [min]="0" [(value)]="total" />
      <grd-button
        label="Save"
        variant="primary"
        [disabled]="!customer().trim()"
        (pressed)="save()"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    .form {
      display: grid;
      gap: 12px;
      max-width: 24em;
    }
  `,
})
export class NewOrderPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly customer = signal('');
  protected readonly total = signal<number | null>(100);

  /** POST /demo-api/orders: the server checks `orders.edit` again. Then back to the list. */
  protected async save(): Promise<void> {
    const order = { customer: this.customer().trim(), total: this.total() ?? 0 };
    await firstValueFrom(this.http.post('/demo-api/orders', order));
    void this.router.navigateByUrl('/orders');
  }
}
```

`src/app/administration.page.ts`:

```ts
import { Component } from '@angular/core';
import { grdRolePermissions, grdUserName } from '@gridify/studio';
import { demoServer } from './demo-server';
import { ROLE_PERMISSIONS } from './permissions';

/** The accounts and what they may do. Only for the role `admin` (see app.routes.ts). */
@Component({
  selector: 'app-administration',
  template: `
    <h1>Administration</h1>
    <p>Only an administrator sees this page. The accounts of the pretend server:</p>
    <table>
      <thead>
        <tr>
          <th>Account</th>
          <th>Name</th>
          <th>Roles</th>
          <th>Permissions</th>
        </tr>
      </thead>
      <tbody>
        @for (account of accounts; track account.username) {
          <tr>
            <td>
              <code>{{ account.username }}</code>
            </td>
            <td>{{ account.name }}</td>
            <td>{{ account.roles }}</td>
            <td>
              <code>{{ account.permissions }}</code>
            </td>
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
  `,
})
export class AdministrationPage {
  /** The permissions of a user by the table of permissions.ts, the same function as in app.config.ts. */
  private readonly permissionsOf = grdRolePermissions(ROLE_PERMISSIONS);

  /** The accounts that sign in with a name and a password (the others belong to 192). */
  protected readonly accounts = demoServer
    .accountList()
    .filter((account) => !account.domain)
    .map((account) => ({
      username: account.username,
      name: grdUserName(account.user),
      roles: account.user.roles.join(', '),
      permissions: this.permissionsOf(account.user).join(', '),
    }));
}
```

`src/app/sign-in.page.ts`:

```ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GrdAuth, GrdButton, GrdLogin, grdUserName } from '@gridify/studio';

/** One user to sign in as with a click, to try the roles quickly. */
interface QuickUser {
  username: string;
  label: string;
}

/** The sign-in page of 190, with a button for each user of the tutorial. */
@Component({
  selector: 'app-sign-in',
  imports: [GrdButton, GrdLogin],
  template: `
    @if (auth.user(); as user) {
      <p class="note">You are signed in as {{ nameOf(user) }}. Sign in as somebody else:</p>
    } @else {
      <grd-login
        heading="Sign in to the orders"
        subtitle="Try eva, jan or petra with the password gridify"
        [preferences]="false"
        (signedIn)="goOn()"
      />
    }
    <!-- A shortcut for the tutorial: sign in as one of the three users at once. -->
    <div class="quick">
      @for (user of quickUsers; track user.username) {
        <grd-button [label]="user.label" (pressed)="signInAs(user.username)" />
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-login {
      --grd-login-min-height: 0;
      flex: 1;
    }
    .note {
      margin: 0;
      padding: 16px 24px 0;
    }
    .quick {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 16px;
    }
  `,
})
export class SignInPage {
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);
  protected readonly nameOf = grdUserName;

  protected readonly quickUsers: QuickUser[] = [
    { username: 'eva', label: 'Eva (admin)' },
    { username: 'jan', label: 'Jan (editor)' },
    { username: 'petra', label: 'Petra (viewer)' },
  ];

  /**
   * Signs in without the form: the same call that the form makes (`signIn` with the id of the
   * provider and what the form asks for). A user who is signed in is replaced by the new one.
   */
  protected async signInAs(username: string): Promise<void> {
    const result = await this.auth.signIn('password', { username, password: 'gridify' });
    if (result.status === 'ok') this.goOn();
  }

  /** On to the page the guard remembered, else to the first page. */
  protected goOn(): void {
    void this.router.navigateByUrl(this.auth.takeReturnUrl('/'));
  }
}
```

## Build it yourself

`npm run tutorial:eject 191 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 190, add `permissions.ts`, replace `demo-server.ts`, `app.config.ts`, `app.routes.ts`, `app.ts`, `home.page.ts`, `orders.page.ts` and `sign-in.page.ts` with the ones above, and add `forbidden.page.ts`, `new-order.page.ts` and `administration.page.ts`.
