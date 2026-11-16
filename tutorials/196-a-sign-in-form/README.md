# 196 – A sign-in form and your own server

This tutorial shows the sign-in form of the application against a server of your own: the sign-in screen of the library draws the form, the provider sends what was typed to the server, and the server checks it, keeps the session in a cookie and tells the application who is signed in (`grdCredentialsProvider`). The server is played in the page, so you can see every request it gets. You will learn how to:

- set up the provider of a sign-in form (`grdCredentialsProvider` with `login`, `me`, `refresh` and `logout`) and put the sign-in screen of the library on a page (`grd-login`);
- what the server answers to a sign-in: the user, one step more, or a refusal;
- refuse without telling whether a name exists, lock a name after three wrong passwords (`423` with `Retry-After`), and ask for a code as a second step (`challenge` with a `ticket`);
- keep the session in a cookie: F5 asks the server who is signed in, and the session is renewed and ended (`auth.refresh()`, `auth.signOut()`).

It is the twin of 195. There the server had a sign-in page of its own, and the browser went to it; here the form is the application's, and what the user types goes to the server in a request.

```
npm run tutorial 196
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30196 and watch the tool _Requests_ on the right.

## The words first

- **The sign-in form** is the screen of the library (`grd-login`). It draws the fields that the provider asks for and passes what was typed to `GrdAuth`; it decides nothing.
- **The provider** (`grdCredentialsProvider`) sends the fields to the server and reads what comes back. **The server decides**: it checks the password, counts the wrong ones, and keeps the session.
- **A cookie** (as in 195): the server sets it in the answer of the sign-in, and the browser sends it with every request to that server. An `HttpOnly` cookie is not seen by any script of the page, so there is no token in the page to steal.
- **A step** is what a server asks for after the right password: the one-time code of a second factor, a new password, the terms of use. The answer is `{ challenge: … }` with a `ticket`, which comes back with the answer of the user.

## Step by step

### Step 1: the provider

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdCredentialsProvider, provideGrdAuth } from '@gridify/studio';
import { server } from './pretend-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [
        // The sign-in form of the application. The provider sends what was typed to the server,
        // which checks it and keeps the session in a cookie.
        grdCredentialsProvider({
          login: '/api/login', // POST the fields: the user (and the cookie), a step, or a refusal
          me: '/api/me', // GET at the start: who is signed in, or 401 for nobody
          refresh: '/api/refresh', // POST: a new end of the session
          logout: '/api/logout', // POST: the end of the session
          // Only for this tutorial: the pretend server answers instead of the network. A real
          // application leaves it out.
          fetch: server.fetch,
        }),
      ],
    }),
  ],
};
```

- **`login`** is the address of the sign-in: a `POST` with the fields as they were typed (`{"username": "alice", "password": "secret"}`). The answer is the user (the server sets the cookie in it), one step more, or a refusal. The answer of a step goes there too, with `ticket` and `step` (another address: `answer`).
- **`me`** is the address that says who is signed in: a `GET` that carries the cookie, asked when the application starts, so that F5 keeps the user. The server answers `200` with the user, or `401` for nobody.
- **`refresh`** (a `POST`) gives the session a new end; **`logout`** (a `POST`) ends it on the server.
- **The fields** are the ones of the library: a name (`username`) and a password (`password`). A server that asks for an e-mail, a domain or the number of a customer gives `fields`.
- **`fetch`** is only for this tutorial: the pretend server answers instead of the network. A real application leaves it out.

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
  /** After the password, the server asks for a code of a second factor. */
  readonly secondFactor?: boolean;
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
    secondFactor: true,
  },
];

/** The code of the second factor. A real one comes from an app of the user and changes. */
const CODE = '123456';
/** How long a session lasts, in seconds. */
const LIFETIME = 10 * 60;
/** Three wrong passwords for a name lock it for 30 seconds. */
const ATTEMPTS = 3;
const LOCK = 30;
/** How long the ticket of a second step is good for, in seconds. */
const TICKET_LIFETIME = 5 * 60;

/**
 * The cookie of the session. A real server sets it itself, in the answer of the sign-in
 * (`Set-Cookie`, HttpOnly: no script reads it). The pretend server keeps the name of the user in
 * localStorage instead, so that it lasts across F5 like a cookie.
 */
const COOKIE = 'tutorial-196-cookie';

/** An answer of the server, as fetch gives it. */
function answer(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** An answer, and what the log says about it after the status. */
interface Reply {
  readonly response: Response;
  readonly note: string;
}

/** What a request sent, for the log: the fields by their names, the secrets hidden. */
function sentText(sent: Readonly<Record<string, string>>): string {
  const fields = Object.entries(sent).map(
    ([name, value]) => `${name}=${name === 'password' || name === 'code' ? '•••' : value}`,
  );
  return fields.length ? ` ${fields.join(' ')}` : '';
}

/**
 * The backend of the application, played in the page. It does what a real server does for
 * grdCredentialsProvider: it checks what the sign-in form sends, asks for a second step when the
 * user has one, counts the wrong passwords, and keeps the session in a cookie.
 */
export class PretendServer {
  /** Every request that came, the newest first: the tool Requests shows them. */
  readonly log = signal<readonly string[]>([]);

  /** The wrong passwords of each name: how many, and until when they count. */
  private readonly wrong = new Map<string, { count: number; until: number }>();
  /** The tickets of the second steps: who typed the right password, and until when. */
  private readonly tickets = new Map<string, { user: ServerUser; until: number }>();
  private serial = 0;

  /** The requests of the provider come here instead of to the network (the option `fetch`). */
  readonly fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    // The provider sends the fields as JSON (the option `encoding` can make it a form).
    const sent: Record<string, string> =
      typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    let reply: Reply;
    if (method === 'POST' && path === '/api/login') {
      reply = this.login(sent);
    } else if (
      (method === 'GET' && path === '/api/me') ||
      (method === 'POST' && path === '/api/refresh')
    ) {
      // Who is signed in, by the cookie: 200 with the user, or 401 for nobody.
      const user = this.user();
      reply = user
        ? { response: answer(200, this.session(user)), note: ` (${user.name})` }
        : { response: answer(401), note: '' };
    } else if (method === 'POST' && path === '/api/logout') {
      // The end of the session: the server takes the cookie away.
      localStorage.removeItem(COOKIE);
      reply = { response: answer(204), note: ', the cookie is gone' };
    } else {
      reply = { response: answer(404), note: '' };
    }
    const { response, note } = reply;
    this.write(`${method} ${path}${sentText(sent)} → ${response.status}${note}`);
    return response;
  }) as typeof fetch;

  /**
   * POST /api/login: the name and the password, or the answer of a second step (its fields with
   * `ticket` and `step`). The answer is the user with the cookie, one step more, or a refusal.
   */
  private login(sent: Readonly<Record<string, string>>): Reply {
    // The answer of a step: the ticket says who typed the right password before.
    if (sent['step']) {
      const ticket = this.tickets.get(sent['ticket'] ?? '');
      if (!ticket || ticket.until < Date.now()) {
        return {
          response: answer(410, { error: 'challenge-expired' }),
          note: ' challenge-expired',
        };
      }
      if (sent['code'] !== CODE) {
        return { response: answer(401, { error: 'invalid-code' }), note: ' invalid-code' };
      }
      this.tickets.delete(sent['ticket']);
      return this.signedIn(ticket.user);
    }

    const name = (sent['username'] ?? '').trim().toLowerCase();
    const user = USERS.find((candidate) => candidate.name === name);
    const wrong = this.wrong.get(name);
    const counting = wrong !== undefined && wrong.until > Date.now();
    // A locked name: the server says for how long (Retry-After), and the screen waits.
    if (counting && wrong.count >= ATTEMPTS) return this.locked(wrong.until);
    if (!user || user.password !== sent['password']) {
      // The same answer for a name that does not exist and for a wrong password: the server never
      // tells which. It counts the tries of a name that does not exist too.
      const count = (counting ? wrong.count : 0) + 1;
      const until = Date.now() + LOCK * 1000;
      this.wrong.set(name, { count, until });
      if (count >= ATTEMPTS) return this.locked(until);
      return {
        response: answer(401, { error: 'invalid-credentials' }),
        note: ' invalid-credentials',
      };
    }
    this.wrong.delete(name);

    if (user.secondFactor) {
      // The right password, and one step more: the screen asks for the code. The ticket comes back
      // with the code; the library has the field and the text of the step `otp`.
      const ticket = `t-${++this.serial}`;
      this.tickets.set(ticket, { user, until: Date.now() + TICKET_LIFETIME * 1000 });
      return {
        response: answer(200, { challenge: { type: 'otp', ticket } }),
        note: `, a step more: otp (ticket ${ticket})`,
      };
    }
    return this.signedIn(user);
  }

  /** Signed in: the server sets the cookie in this answer and gives the user. */
  private signedIn(user: ServerUser): Reply {
    localStorage.setItem(COOKIE, user.name);
    return {
      response: answer(200, this.session(user)),
      note: `, the cookie is set (${user.name})`,
    };
  }

  /** Locked until `until`: 423 with the time that is left (Retry-After, in seconds). */
  private locked(until: number): Reply {
    const wait = String(Math.max(1, Math.ceil((until - Date.now()) / 1000)));
    return {
      response: answer(423, { error: 'locked' }, { 'Retry-After': wait }),
      note: ` locked, Retry-After: ${wait}`,
    };
  }

  /** The user of the cookie, or `null`: nobody is signed in. */
  private user(): ServerUser | null {
    const name = localStorage.getItem(COOKIE);
    return USERS.find((user) => user.name === name) ?? null;
  }

  /** What the sign-in, /api/me and /api/refresh answer: the user and how long. Never the password. */
  private session(user: ServerUser): unknown {
    const { id, name, displayName, email, roles } = user;
    return { user: { id, name, displayName, email, roles }, expiresIn: LIFETIME };
  }

  private write(line: string): void {
    this.log.update((log) => [`${new Date().toLocaleTimeString()}  ${line}`, ...log]);
  }
}

/** The one server of the tutorial. */
export const server = new PretendServer();
```

What the provider makes of the answers, and what the screen shows:

| The server answers                                  | The provider gives    | The screen shows                                          |
| --------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| `200` with `{ user, expiresIn }` (and the cookie)   | the user, signed in   | the page of the user                                      |
| `200` with `{ challenge: { type: 'otp', ticket } }` | a step                | the field of the code, **Back** and **Continue**          |
| `401` with `{ error: 'invalid-credentials' }`       | `invalid-credentials` | _The name or the password is not correct._                |
| `401` with `{ error: 'invalid-code' }`, at a step   | `invalid-code`        | _The code is not correct._, and the step stays            |
| `410` with `{ error: 'challenge-expired' }`         | `challenge-expired`   | _This step has expired. Start again._, and the first form |
| `423` with `{ error: 'locked' }` and `Retry-After`  | `locked`, and a wait  | _The account is locked…_, and the button waits that long  |

- **A status alone** says enough: `401` is `invalid-credentials` (at a step `invalid-code`), `410` `challenge-expired`, `423` and `429` `locked`, `502`, `503` and `504` `network`. A code of the library in `error` (or `code`) says more (`expired-password`, `weak-password` and the others); a code that the library has no text for shows the `message` of the server.
- **The texts** of the screen never say whether a name exists: they are the same for a name that does not exist and for a wrong password, and the server answers the same too.
- **The step** `otp` has its field and its text in the library, and so do `password-change` (a new password) and `terms` (the terms of use). The server may write its own `message` for a step, and give the `fields` of a step that the library does not know.

### Step 3: the sign-in form

`src/app/orders-page.ts` shows the sign-in screen to nobody, and to a signed-in user what the server said:

```html
<!--
  The sign-in screen of the library, drawn from the provider: its fields (a name and a
  password), and the steps that the server asks for. It passes what was typed to GrdAuth, and
  GrdAuth to the provider. "dialog" is the card alone, without the page around it.
-->
<grd-login
  class="login"
  mode="dialog"
  heading="Sign in to Orders"
  subtitle="alice or tomas, with the password secret; tomas then types the code 123456"
  [cancellable]="false"
/>
```

- **`mode="dialog"`** is the card alone, without the page around it. `mode="page"` fills the browser window: a sign-in page of its own, as in 190.
- **`heading`** and **`subtitle`** are the texts above the form; **`[cancellable]="false"`**: there is nothing to cancel on a page.
- **Nothing to wire.** `grd-login` calls `GrdAuth` itself, and the page follows `auth.user()`. The password is cleared after every try, and after it was sent for a step; nothing of it is kept.

### Step 4: the application

`src/app/app.ts` is the one of 195 without the page of the server: the header with the user and **Sign out**, and the docking engine with _Orders_ (the document) and _Requests_ (the tool). `src/app/requests-tool.ts` is the one of 195.

### Step 5: run it

```
npm run tutorial 196
```

## Try it

1. **The start.** _Requests_ says `GET /api/me → 401`: the application asked who is signed in, and nobody is.
2. **A wrong password.** Type `alice` and `wrong`: `POST /api/login username=alice password=••• → 401 invalid-credentials` (the log of the server hides the password, as the log of a real server must), and the screen says _The name or the password is not correct._ The password field is empty again.
3. **A name that does not exist.** Type `bob` and anything: the same answer and the same text. Nobody can find out from the screen which names exist.
4. **Locked.** Two more wrong passwords for `alice`, soon after the one of step 2 (the server forgets the wrong passwords of a name 30 seconds after the last one, and counts from one again): the third answer is `423 locked, Retry-After: 30`. The screen says _The account is locked. Try again later or contact the administrator._, and its button waits 30 seconds. After that, `alice` with `secret` works.
5. **Signed in.** `→ 200, the cookie is set (alice)`. The page shows what the server said, the provider (`password`), the end of the session, and `accessToken()`: `null`, there is no token in the page.
6. **F5.** Alice is still signed in: `GET /api/me → 200 (alice)`, with the cookie. The log starts again with the page: it lives in the memory of the pretend server.
7. **Renew and sign out.** **Renew the session**: `POST /api/refresh → 200 (alice)`, and the end moves on (`GrdAuth` does it by itself a minute before the end). **Sign out**: `POST /api/logout → 204, the cookie is gone`, and the form is back.
8. **A second step.** Sign in as `tomas` with `secret`: `→ 200, a step more: otp (ticket t-1)`, and the screen asks for the code. Type `000000`: `401 invalid-code`, _The code is not correct._, and the step stays. Type `123456`: the code goes to the server with the ticket (`code=••• ticket=t-1 step=otp`), and Tomáš is signed in. **Back**, on a step, gives the first form again, with the name and an empty password.

## With a real server

- **The password** is compared with a hash (Argon2, scrypt or bcrypt); the server never keeps it as it is, and never sends it back.
- **The same answer** for a name that does not exist and for a wrong password, and in the same time. The server counts the tries of a name (and of an address) and locks for a while: `423` or `429` with `Retry-After`. The browser cannot do that for it: anybody can send requests without the screen.
- **The cookie**, as in 195: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, set in the answer of the sign-in, with a new id of the session (a cookie from before the sign-in is no good after it).
- **Forged requests.** The sign-in and the other `POST`s go with the cookies of the site, so the server needs `SameSite` and, for more, a CSRF token: `headers: { 'X-CSRF-Token': () => readCookie('csrf') }` (a function is called for every request).
- **The ticket of a step** is good once and for a short time, and belongs to the name that typed the right password.
- **A server on another address** (`api.example.com`): `credentials: 'include'`, and the server allows the origin of the application (CORS, with `Access-Control-Allow-Credentials`).
- **A server that takes the post of an HTML form**: `encoding: 'form'` sends `application/x-www-form-urlencoded`.
- **A server of tokens** answers the sign-in with an `accessToken` too: `GrdAuth` holds it in memory, and `grdAuthInterceptor` puts it on the requests of `HttpClient` (191). A server whose answers have another form: `map` reads them.
- **The requests of the provider** are `fetch` calls, not requests of `HttpClient`, so a `401` of a wrong password is never taken for the end of the session (193).
- **More:** the README of `grd-common` (_The sign-in form and your own server_) has the whole agreement between the provider and the server, and the playground (Services › Auth › Providers, _A sign-in form and your own server_) plays the same server.

## Build it yourself

`npm run tutorial:eject 196 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `pretend-server.ts`, `orders-page.ts` and `requests-tool.ts` to `src/app`, and replace `app.config.ts` and `app.ts` with the ones of this tutorial. With a real server, leave out `pretend-server.ts` and the option `fetch`.
