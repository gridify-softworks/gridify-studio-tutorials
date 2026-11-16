# 190 – A sign-in page

This tutorial shows how to let users sign in before they may open a page, with the sign-in screen of the library. You will learn how to:

- set up signing in (`provideGrdAuth`), here with a pretend server (`GrdDemoAuth`), so the tutorial needs no backend;
- protect a page with a guard (`grdAuthGuard`): somebody who is not signed in is sent to the sign-in page first;
- show the sign-in screen (`grd-login`) and bring the user back to the page they wanted (`takeReturnUrl`);
- show who is signed in and sign out (`GrdAuth.user()`, `signOut()`), also when another window of the browser signs out;
- stay signed in after F5.

It is the first tutorial of the series about signing in (190–197). The next one starts from this application and adds what a user may do (191). The others are applications of their own, each about one thing: the steps of a sign-in such as a one-time code (192), a session that ends during work (193), the user menu with the profile (194), a session that a server of your own keeps (195), a sign-in form against that server (196), and pages of your own in the profile (197).

```
npm run tutorial 190
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30190. The application has two pages: **Home**, which anybody may see, and **Orders**, which only a signed-in user may see. Sign in as `eva` with the password `gridify`.

## The words first

Signing in has a few words of its own. They are short, and the rest of the series uses them all the time:

- **The server** decides who may sign in. It checks the name and the password and remembers who is signed in. A real application has its own backend for that; this tutorial has a pretend one (`GrdDemoAuth`).
- **A provider** is one way to sign in: a name and a password, a company directory, a button that goes to Microsoft or Google. The application gives `GrdAuth` a list of providers, and the sign-in screen draws a form (or a button) for each of them.
- **The session** is "who is signed in now". `GrdAuth` holds it as signals: `user()` is the user or `null`, `isAuthenticated()` says whether somebody is signed in. A signal in a template or a `computed` follows every change by itself.
- **The silent sign-in** happens when the application starts: `GrdAuth` asks the server whether somebody is still signed in from the last visit. So F5 does not sign you out.
- **A guard** stands in front of a page (a route of the Angular router) and decides whether it opens.

## Step by step

The application is a small Angular application with the router: a header, a row of links and the place of the pages. The steps add the sign-in to it.

### Step 1: a pretend server

`GrdAuth` signs users in through providers. A real application has a provider that asks its own server (`grdSessionProvider`, for a session that the server keeps in a cookie), an identity provider (`grdOidcProvider`, Microsoft or Google), or a provider of its own. This tutorial has no server, so it takes `GrdDemoAuth`, the pretend server of the library, made for demos and tests. Add `src/app/demo-server.ts`:

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial.
 *
 * A real application signs its users in through its own backend. This tutorial has none, so the
 * library's `GrdDemoAuth` plays the server: it knows a few accounts, checks the password, answers
 * after a short pause (350 ms, as a real server would) and keeps the session.
 *
 * - Sign in as `eva` with the password `gridify` (every account of the demo has this password).
 * - `storageKey` keeps the session in `localStorage`, the way a real server keeps a cookie: after F5
 *   you are still signed in. Only a demo does this; a real server keeps the session in an
 *   `HttpOnly` cookie, which no script can read.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-190-session' });
```

- Without `accounts` the pretend server has its own: `eva` (Eva Müller), `jan`, `petra` and a few more, all with the password `gridify`. The next tutorials use them.
- **`storageKey`** keeps the session in `localStorage`, as a real server keeps a cookie: the session lasts across a reload, every window of the browser has the same one, and signing out takes it away. Without it, F5 signs everybody out.

The server hands out its providers. `demoServer.password` is the one with a name and a password.

### Step 2: tell the application about it

`provideGrdAuth` in `src/app/app.config.ts` lists the providers:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGrdAuth } from '@gridify/studio';
import { routes } from './app.routes';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The pages of the application, and which of them need a signed-in user (see app.routes.ts).
    provideRouter(routes),
    // The sign-in. `providers` are the ways to sign in; here one: a name and a password, which the
    // pretend server checks. Before the application starts, GrdAuth asks the server whether somebody
    // is still signed in from the last visit (the "silent sign-in"), so F5 does not sign you out.
    provideGrdAuth({ providers: [demoServer.password] }),
  ],
};
```

That is all the setup. `provideGrdAuth` makes the service `GrdAuth` know the provider, and it runs the silent sign-in before the first page is shown, so the guard of the next step already knows whether somebody is signed in.

### Step 3: protect the page

`src/app/app.routes.ts` has the three pages, and the guard on the orders:

```ts
import { Routes } from '@angular/router';
import { grdAuthGuard } from '@gridify/studio';
import { HomePage } from './home.page';
import { OrdersPage } from './orders.page';
import { SignInPage } from './sign-in.page';

/**
 * The guard of a page that needs a signed-in user. Somebody who is not signed in does not get the
 * page: the guard sends them to `/sign-in?returnUrl=/orders` and remembers `/orders`, so the sign-in
 * page can bring them back there. A signed-in user gets the page at once.
 */
const signedIn = grdAuthGuard({ signIn: '/sign-in' });

export const routes: Routes = [
  // Anybody may see the first page and the sign-in page.
  { path: '', component: HomePage, title: 'Home' },
  { path: 'sign-in', component: SignInPage, title: 'Sign in' },
  // The orders only for somebody who is signed in.
  { path: 'orders', component: OrdersPage, title: 'Orders', canActivate: [signedIn] },
  // An address that does not exist goes to the first page.
  { path: '**', redirectTo: '' },
];
```

What the guard does, in order:

1. It waits for the silent sign-in (so after F5 it does not send a signed-in user away by mistake).
2. Somebody is signed in: the page opens.
3. Nobody is signed in: the page does not open. The guard remembers the address (`/orders`) and goes to `/sign-in?returnUrl=%2Forders` instead.

`grdAuthGuard` takes more, which 191 uses: a permission or a role the user needs, and the page for a user who is signed in but may not see the page.

### Step 4: the sign-in page

`src/app/sign-in.page.ts` shows the sign-in screen of the library:

```ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GrdAuth, GrdLogin, grdUserName } from '@gridify/studio';

/**
 * The sign-in page. The guard sends somebody here who opened a page that needs a user
 * (`/sign-in?returnUrl=/orders`); anybody may also open it by the link in the header.
 */
@Component({
  selector: 'app-sign-in',
  imports: [GrdLogin, RouterLink],
  template: `
    @if (auth.user(); as user) {
      <!-- Somebody is signed in already: no form, only a way on. -->
      <p class="done">You are signed in as {{ nameOf(user) }}.</p>
      <p class="done">Go to the <a routerLink="/orders">orders</a>.</p>
    } @else {
      <!--
        The whole sign-in screen: the fields of the provider (a name and a password), the button,
        the wait while the server answers, and the errors. (signedIn) comes once the server has
        let the user in. [preferences]="false": the header has the selects of the theme already.
      -->
      <grd-login
        heading="Sign in to the orders"
        subtitle="Try eva with the password gridify"
        [preferences]="false"
        (signedIn)="signedIn()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    grd-login {
      /* The screen fills the place of the page, under the header (it would fill the window). */
      --grd-login-min-height: 100%;
      height: 100%;
    }
    .done {
      margin: 0;
      padding: 16px 24px 0;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class SignInPage {
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);
  protected readonly nameOf = grdUserName;

  /**
   * Somebody signed in. The guard remembered the page they wanted (`/orders`); `takeReturnUrl`
   * gives it once and forgets it. Without one (the page was opened by the link) the orders.
   */
  protected signedIn(): void {
    void this.router.navigateByUrl(this.auth.takeReturnUrl('/orders'));
  }
}
```

- **`<grd-login>`** is the whole screen: it draws a form for every provider (here one, with **Username** and **Password**), sends what was typed to `GrdAuth`, shows the wait while the server answers, and the errors (a wrong password: _The name or the password is not correct._). It never says whether the name exists: a wrong name and a wrong password are the same text, so nobody can find out the names of the accounts.
- **`(signedIn)`** comes once the server has let the user in. The page then goes on to the address the guard remembered: **`takeReturnUrl('/orders')`** gives it once and forgets it, and gives `/orders` when nothing was remembered (the page was opened by the link in the header).
- **The address to return to is never trusted** as it is: it comes from the address bar, so anybody could put another one there. `GrdAuth` keeps only a path of this site (`/orders`), never `https://evil.example`.
- **Somebody who is signed in already** gets no form, only a link on.
- The CSS makes the screen fill the place of the page under the header (`--grd-login-min-height: 100%`); without it, the screen fills the whole window, which is right for an application whose sign-in page has no header.

### Step 5: who is signed in, and Sign out

The header of `src/app/app.ts` shows who is signed in, with a button that signs out, or a link to the sign-in page:

<!-- prettier-ignore -->
```html
<div grdAppHeaderEnd class="who">
  @if (auth.user(); as user) {
    <span>Signed in as {{ nameOf(user) }}</span>
    <grd-button label="Sign out" (pressed)="signOut()" />
  } @else {
    <a routerLink="/sign-in">Sign in</a>
  }
</div>
```

`auth.user()` is a signal, so the header changes by itself when somebody signs in or out. `grdUserName(user)` is the name to show: the display name (`Eva Müller`), else the sign-in name (`eva`).

Signing out is one call:

```ts
protected signOut(): void {
  void this.auth.signOut();
}
```

### Step 6: signed out somewhere else

The user can sign out in another window of the browser: the windows sign out together (the session is the same), so this window is signed out too, and it should not keep showing the orders. The constructor of `App` listens to that:

```ts
constructor() {
  // Somebody signed out: here (the button) or in another window of the browser (the windows sign
  // out together). No page that needs a user may stay on the screen, so the application goes to
  // the first page. `on` gives a function that stops listening; the root component lives as long
  // as the application, so it never needs to.
  this.auth.on('signedOut', () => void this.router.navigateByUrl('/'));
}
```

`signedOut` comes for every sign-out: by the button here or in another window. The application then goes to the first page. A session that **ends** (its time is up, the server forgets it) is not a sign-out: the user stays known, the event is `expired`, and 193 shows how an application keeps the work on the screen and asks for a new sign-in.

### Step 7: run it

```
npm run tutorial 190
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **Nobody yet.** The header has **Sign in**, the first page says _Nobody is signed in_.
2. **The guard.** Click **Orders**. You are on the sign-in page, and the address is `/sign-in?returnUrl=%2Forders`.
3. **A wrong password.** Type `eva` and `wrong`, press Enter. The screen says _The name or the password is not correct._, empties the password and puts the cursor there.
4. **Signing in.** Type `gridify` and press Enter. You are on the orders: the page you wanted, not the first page. The header says _Signed in as Eva Müller_.
5. **F5.** You are still signed in, still on the orders.
6. **Two windows.** Open http://localhost:30190/orders in a second tab: signed in there too. Press **Sign out** in the second tab: both tabs go to the first page, nobody is signed in in either.
7. **The sign-in page by the link.** Click **Sign in** in the header and sign in: you are on the orders (there was no page to return to, so the orders it is).
8. **Three wrong passwords** lock the account of the pretend server: try it with `jan` (the next tutorials show the other accounts).
9. **See it.** In the developer tools, _Application › Local storage › http://localhost:30190_ has `tutorial-190-session` while somebody is signed in: the session of the pretend server (who, a token and its end). A real server keeps it in a cookie that no script can read.

## With a real server

Only the provider changes. Everything else of this tutorial (the guard, the screen, the header) stays as it is.

- **A session that the server keeps in a cookie** (the usual case for a backend of your own): `grdSessionProvider({ me: '/api/me', login: '/auth/login', logout: '/api/logout' })`. The page has no token at all, so a script has nothing to steal.
- **An identity provider** (Microsoft Entra ID, Google, Keycloak): `grdOidcProvider({ id, label, authority, clientId, redirectUri, scope })`. The sign-in screen draws it as a button that goes there and comes back.
- **A provider of your own**: an object with `authenticate(input)` (check what was typed), `restore()` (the silent sign-in) and `signOut()`. The Help of the playground (_Sign-in_) has one with its fake backend.

And one rule for all of them: **the check in the browser is a comfort**. The guard keeps a page from opening, but whoever knows the address of the server can still ask it for the orders. The server must check the user on every request.

## The code

`src/app/app.ts`:

```ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdAuth, GrdButton, grdUserName } from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <grd-app-header productName="Orders" subtitle="Tutorial 190" preferences="theme density">
      <!-- Who is signed in. auth.user() is a signal: this part follows every sign-in and sign-out. -->
      <div grdAppHeaderEnd class="who">
        @if (auth.user(); as user) {
          <span>Signed in as {{ nameOf(user) }}</span>
          <grd-button label="Sign out" (pressed)="signOut()" />
        } @else {
          <a routerLink="/sign-in">Sign in</a>
        }
      </div>
    </grd-app-header>

    <!-- The pages. The router marks the link of the page that is shown (routerLinkActive). -->
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exact">Home</a>
      <a routerLink="/orders" routerLinkActive="active">Orders</a>
    </nav>

    <main>
      <!-- The router puts the page of the address here. -->
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
  /** The session: who is signed in (`user()`), signing in and out. */
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);

  /** The name to show: the display name of the user (`Eva Müller`), else the sign-in name. */
  protected readonly nameOf = grdUserName;

  /** The link of the first page (`/`) is marked only on that page, not on every page under it. */
  protected readonly exact = { exact: true };

  constructor() {
    // Somebody signed out: here (the button) or in another window of the browser (the windows sign
    // out together). No page that needs a user may stay on the screen, so the application goes to
    // the first page. `on` gives a function that stops listening; the root component lives as long
    // as the application, so it never needs to.
    this.auth.on('signedOut', () => void this.router.navigateByUrl('/'));
  }

  /** Ends the session: here at once, then on the server. The handler above goes to the first page. */
  protected signOut(): void {
    void this.auth.signOut();
  }
}
```

`src/app/home.page.ts`:

```ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth } from '@gridify/studio';

/** The first page. Anybody may see it. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Welcome</h1>
    @if (auth.isAuthenticated()) {
      <p>You are signed in. Open the <a routerLink="/orders">orders</a>.</p>
    } @else {
      <p>
        Nobody is signed in. Open the <a routerLink="/orders">orders</a>: the application sends you
        to the sign-in page first, and back to the orders once you are signed in.
      </p>
      <p>Sign in as <code>eva</code> with the password <code>gridify</code>.</p>
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
  `,
})
export class HomePage {
  protected readonly auth = inject(GrdAuth);
}
```

`src/app/orders.page.ts`:

```ts
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
```

`src/main.ts`, `src/index.html` and `src/styles.scss` are the ones of every tutorial (`src/styles.scss` takes the styles of the library: `@use '@gridify/studio/styles';`).

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 190 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21). `ng new` makes the router part as well: `app.routes.ts` and `provideRouter(routes)` in `app.config.ts`.

   ```
   npx @angular/cli@21 new sign-in --style=scss --ssr=false --skip-tests
   cd sign-in
   ```

2. Install the library as in 010 (step 2 there, also about the `.npmrc`).
3. Write `src/styles.scss`: `@use '@gridify/studio/styles';`, the full height of the page (`html, body { height: 100%; margin: 0; }`) and the font (`font-family: var(--grd-font-main)`).
4. Add the files of this tutorial to `src/app` (`demo-server.ts`, `app.config.ts`, `app.routes.ts`, `app.ts`, `home.page.ts`, `orders.page.ts`, `sign-in.page.ts`). The template of `App` is inline, so `app.html` and `app.scss` can go.
5. Run it: `ng serve`.
