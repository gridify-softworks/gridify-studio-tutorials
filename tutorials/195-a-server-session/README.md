# 195 – A session on the server

This tutorial shows the sign-in with a server of your own: the server keeps the session in a cookie, has its own sign-in page, and the application only asks it who is signed in (`grdSessionProvider`). The server is played in the page, so you can see every request it gets. You will learn how to:

- set up the provider of a session that the server keeps (`grdSessionProvider` with `me`, `login`, `refresh` and `logout`);
- what the server has to answer to each of these addresses;
- start the sign-in at the page of the server (`auth.begin`), and finish it when the user comes back (`auth.complete`);
- renew the session and end it (`auth.refresh()`, `auth.signOut()`).

It continues the series 190–194, which used the pretend server of the library (`GrdDemoAuth`); here the server is your own, and the application has no token at all.

```
npm run tutorial 195
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30195 and watch the tool _Requests_ on the right.

## The words first

- **A cookie** is a small piece of data that the server gives the browser (`Set-Cookie`), and that the browser sends back with every request to that server. A cookie of a session says "this is Alice". An `HttpOnly` cookie is not seen by any script of the page, so nothing in the page can steal it.
- **A session on the server**: the server signs the user in (at its own page, or at an identity provider of the company), sets the cookie, and later tells the application who it is (`/api/me`). The application never sees a password or a token.
- **A redirect**: the browser leaves the application for the sign-in page of the server, and the server sends it back (`?returnUrl=/`). Here the page of the server is shown over the application instead, so the tutorial needs no real server.

## Step by step

### Step 1: the provider

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdSessionProvider, provideGrdAuth } from '@gridify/studio';
import { server } from './pretend-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [
        // The session is kept by the server, in a cookie. The application only asks who it is.
        grdSessionProvider({
          me: '/api/me', // GET: 200 with the user, or 401 for nobody
          login: '/auth/login', // the sign-in page of the server (it gets ?returnUrl=…)
          label: 'Sign in at Example Corp', // the text of the button of the provider
          refresh: '/api/refresh', // POST: a new end of the session
          logout: '/api/logout', // POST: the end of the session
          // Only for this tutorial: the pretend server answers instead of the network, and shows its
          // sign-in page instead of leaving the application. A real application leaves both out.
          fetch: server.fetch,
          navigate: server.navigate,
        }),
      ],
    }),
  ],
};
```

- **`me`** is the address that says who is signed in: a `GET` that carries the cookie. The server answers `200` with the user, or `401` for nobody.
- **`login`** is the sign-in page of the server. With it the provider has a button (`label`), and `begin` takes the browser there, with `?returnUrl=…`.
- **`refresh`** (a `POST`) gives the session a new end; **`logout`** (a `POST`) ends it on the server.
- **`fetch` and `navigate`** are only for this tutorial: the pretend server answers instead of the network, and shows its sign-in page instead of leaving the application. A real application leaves them out.

### Step 2: what the server answers

`src/app/pretend-server.ts` is the backend, played in the page. It is what your server has to do:

```ts
import { signal } from '@angular/core';

/** A user of the server, with the password (a real server keeps only a hash of it). */
interface ServerUser {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: string[];
  readonly password: string;
}

const USERS: readonly ServerUser[] = [
  {
    id: 'u-alice',
    name: 'alice',
    displayName: 'Alice Brown',
    email: 'alice@example.com',
    roles: ['editor'],
    password: 'secret',
  },
  {
    id: 'u-tomas',
    name: 'tomas',
    displayName: 'Tomáš Novák',
    email: 'tomas@example.com',
    roles: ['viewer'],
    password: 'secret',
  },
];

/** How long a session lasts, in seconds. */
const LIFETIME = 10 * 60;

/**
 * The cookie of the session. A real server sets it itself (`Set-Cookie`, HttpOnly: no script reads
 * it). The pretend server keeps the name of the user in localStorage instead, so that it lasts
 * across F5 like a cookie.
 */
const COOKIE = 'tutorial-195-cookie';

/** An answer of the server, as fetch gives it. */
function answer(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * The backend of the application, played in the page. It does what a real server does for
 * grdSessionProvider: it answers four addresses, and it has a sign-in page of its own.
 */
export class PretendServer {
  /** Every request that came, the newest first: the tool Requests shows them. */
  readonly log = signal<readonly string[]>([]);
  /** The sign-in page of the server is open (with the address it was opened at), or `null`. */
  readonly page = signal<string | null>(null);

  /** The user of the cookie, or `null`: nobody is signed in. */
  private user(): ServerUser | null {
    const name = localStorage.getItem(COOKIE);
    return USERS.find((user) => user.name === name) ?? null;
  }

  /** What /api/me and /api/refresh answer: who is signed in, and for how long. Never the password. */
  private session(user: ServerUser): unknown {
    const { id, name, displayName, email, roles } = user;
    return { user: { id, name, displayName, email, roles }, expiresIn: LIFETIME };
  }

  /** The requests of the provider come here instead of to the network (the option `fetch`). */
  readonly fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    const user = this.user();
    let response: Response;
    if (
      (method === 'GET' && path === '/api/me') ||
      (method === 'POST' && path === '/api/refresh')
    ) {
      // Who is signed in: 200 with the user, or 401 for nobody.
      response = user ? answer(200, this.session(user)) : answer(401);
    } else if (method === 'POST' && path === '/api/logout') {
      // The end of the session: the server takes the cookie away.
      localStorage.removeItem(COOKIE);
      response = answer(204);
    } else {
      response = answer(404);
    }
    this.write(`${method} ${path} → ${response.status}${user ? ` (${user.name})` : ''}`);
    return response;
  }) as typeof fetch;

  /** The provider sends the browser to the sign-in page of the server (the option `navigate`). */
  readonly navigate = (url: string): void => {
    this.write(`The browser goes to ${url}`);
    this.page.set(url);
  };

  /** The form of the sign-in page: the right password sets the cookie. */
  signIn(name: string, password: string): boolean {
    const user = USERS.find((candidate) => candidate.name === name.trim().toLowerCase());
    if (!user || user.password !== password) return false;
    localStorage.setItem(COOKIE, user.name);
    this.write(`POST /auth/login → 302, the cookie is set (${user.name})`);
    return true;
  }

  /** Where the sign-in page sends the user back: the `returnUrl` it was given. */
  returnUrl(): string {
    const address = new URL(this.page() ?? '/', location.href);
    return address.searchParams.get('returnUrl') ?? '/';
  }

  /** The sign-in page goes away (the user went back to the application). */
  closePage(): void {
    this.page.set(null);
  }

  private write(line: string): void {
    this.log.update((log) => [`${new Date().toLocaleTimeString()}  ${line}`, ...log]);
  }
}

/** The one server of the tutorial. */
export const server = new PretendServer();
```

- **`/api/me`** answers `{ user: { id, name, displayName, email, roles }, expiresIn: 600 }`: the user (only `id` and `name` are needed) and how many seconds the session has left (or `expiresAt`, a time). Nobody: `401`. The provider takes only the fields it knows, with the right types: an answer is data from outside.
- **`/api/refresh`** answers the same, with a new end. **`/api/logout`** takes the cookie away and answers `204`.
- **The sign-in page** checks the password, sets the cookie and sends the browser back to `returnUrl`.

### Step 3: the sign-in page of the server

`src/app/server-page.ts` plays the page of the server. When the password is right, the user goes back to the application:

```ts
/** The server checks the password and sets the cookie, then sends the user back. */
protected async signIn(event: Event): Promise<void> {
  event.preventDefault();
  if (!server.signIn(this.name(), this.password())) {
    this.wrong.set(true);
    return;
  }
  const back = server.returnUrl();
  server.closePage();
  // Back in the application: GrdAuth asks /api/me, and the cookie answers. (After a real
  // redirect the application starts again, and its first /api/me does the same.)
  await this.auth.complete('session', back);
}
```

**`auth.complete('session', …)`** tells `GrdAuth` that the user is back: it asks `/api/me`, and the cookie answers. (After a real redirect the application starts again, and its first `/api/me`, the silent sign-in, does the same.)

### Step 4: the application

`src/app/app.ts` has a button that starts the sign-in, and shows the page of the server while it is open:

<!-- prettier-ignore -->
```html
<div grdAppHeaderEnd class="who">
  @if (auth.user(); as user) {
    <span>{{ nameOf(user) }}</span>
    <grd-button label="Sign out" (pressed)="auth.signOut()" />
  } @else {
    <!-- begin() starts the sign-in of the provider: here it sends the browser to the server. -->
    <grd-button label="Sign in" variant="primary" (pressed)="auth.begin('session')" />
  }
</div>
```

**`auth.begin('session')`** starts the sign-in of the provider `session` (the id of `grdSessionProvider`): it sends the browser to `login`. The page of the user (`src/app/orders-page.ts`) shows what the server said, and has the buttons **Renew the session** (`auth.refresh()`) and **Sign out** (`auth.signOut()`).

### Step 5: run it

```
npm run tutorial 195
```

## Try it

1. **The start.** The tool _Requests_ says `GET /api/me → 401`: the silent sign-in asked the server, and nobody is signed in.
2. **Sign in.** Press **Sign in**: _The browser goes to …/auth/login?returnUrl=%2F_, and the page of the server shows. Type `alice` and a wrong password: _The name or the password is not correct._ Type `secret`: the cookie is set, the user is back, and `GET /api/me → 200 (alice)`.
3. **What the server said.** The page shows the e-mail and the roles from the server, the end of the session, and `accessToken()`: `null`, there is no token in the page.
4. **Renew.** Press **Renew the session**: `POST /api/refresh → 200`, and the end of the session moves on. (`GrdAuth` does it by itself before the end.)
5. **F5.** Alice is still signed in: the first request after the start, `GET /api/me`, carries the cookie.
6. **Sign out.** `POST /api/logout → 204`: the cookie is gone, and nobody is signed in. Sign in as `tomas` (a viewer, with a Czech name).

## With a real server

- **The cookie** is set by the server: `HttpOnly` (no script reads it), `Secure`, `SameSite=Lax` or `Strict`. The requests that change something must be protected against forged requests: `SameSite` does most of it, a CSRF token goes with `headers` of the provider.
- **A server on another address** (`api.example.com`): `credentials: 'include'`, and the server has to allow the origin of the application (CORS).
- **The requests of the application** (the orders) carry the cookie by themselves: `grdAuthInterceptor` is not needed for a cookie, only for a token.
- **The sign-in page** may be the server's own form, a single sign-on of the company (the browser is signed in already, and `restore()` finds the session without a button: leave `login` out), or an identity provider that the server talks to (the pattern called a backend for the frontend).
- **A sign-in form of the application** instead of a page of the server: the form sends the name and the password to the server in a request, and the server sets the same cookie (`grdCredentialsProvider`, see 196).
- **An identity provider without a server of your own** (Microsoft Entra ID, Google, Keycloak): `grdOidcProvider({ id, label, authority, clientId, redirectUri, scope })`, the Authorization Code flow with PKCE; the playground (Services › Auth › Providers) plays it.

## Build it yourself

`npm run tutorial:eject 195 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `pretend-server.ts`, `server-page.ts`, `orders-page.ts` and `requests-tool.ts` to `src/app`, and replace `app.config.ts` and `app.ts` with the ones of this tutorial. With a real server, leave out `pretend-server.ts` and `server-page.ts`, and the options `fetch` and `navigate`.
