# 193 – A session that ends during work

This tutorial shows what happens when the session of a user ends while they work: its time is up, the server no longer knows it, or the screen locks after a while without a click. The application keeps the work on the screen and asks for a new sign-in in a window over it. You will learn how to:

- renew a session before it ends, without the user noticing (`refresh`, `refreshLead`);
- open the sign-in window over a running application (`<grd-login-host />`, `GrdAuth.requestSignIn()`);
- let a request that the server refused (`401`) open that window and be sent again after the sign-in (`grdAuthInterceptor`);
- lock the screen after a time without a click or a key (`idleLock`), and open it only for the same user;
- react to the events of the session (`signedIn`, `expired`, `signedOut`), and drop the work of a user when somebody else signs in.

It continues the series of 190–192. There is no router: one page, with a note that stands for unsaved work, orders from the (pretend) server, the session with buttons that end it in each way, and a log of what happened.

```
npm run tutorial 193
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30193 and sign in as `eva` with the password `gridify`. The session of this tutorial lasts **two minutes**, so that you see what happens at its end.

## The words first

- **The end of a session.** A session does not last forever: the server gives it an end (`session().expiresAt`), usually half an hour or more.
- **A refresh** asks the server for a new end before the old one comes. When the provider can do it, the user never sees the end.
- **Expired** is a session that ended without a sign-out: its time was up and there was no refresh, or the server answered `401` (it no longer knows the session, for example after a restart). **The user stays known** (`user()` is still Eva), so the application can keep everything on the screen and only ask for the password again.
- **Locked** is a screen that locked itself after a time without a click or a key (`idleLock`), or by a button. Only the same user may open it again.
- **The sign-in window** is the sign-in screen in a window over the application: `<grd-login-host />` shows it whenever somebody asks `GrdAuth` for a sign-in (`requestSignIn()`).

## Step by step

### Step 1: a short session

`src/app/demo-server.ts` gives the pretend server a session of two minutes (instead of 30):

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190), with a short session so that you see it end: two
 * minutes instead of the usual 30. Sign in as `eva` (or any account of 191) with the password
 * `gridify`.
 */
export const demoServer = new GrdDemoAuth({
  storageKey: 'tutorial-193-session',
  lifetime: 2 * 60_000,
});
```

### Step 2: refresh, lock, and the requests

`src/app/app.config.ts`:

```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdAuthInterceptor, grdDemoBackend, provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [demoServer.password],
      // The session is refreshed this long before it ends (60 000, a minute, when missing): the
      // provider asks the server for a new end, and the user notices nothing.
      refreshLead: 30_000,
      // The screen locks after this long without a click or a key (0, never, when missing).
      idleLock: 3 * 60_000,
    }),
    // The requests: the token on each of them, and a 401 of the server handled (see the README).
    // grdDemoBackend plays the server with its own API (GET /demo-api/orders and more).
    provideHttpClient(withInterceptors([grdAuthInterceptor(), grdDemoBackend(demoServer)])),
  ],
};
```

- **`refreshLead: 30_000`**: half a minute before the end, `GrdAuth` asks the provider for a new end (`refresh()`). The pretend server gives two more minutes, so the session of this tutorial goes on as long as the page is open. A provider without `refresh()`, or a refresh that the server refuses, lets the session **expire** at its end.
- **`idleLock: 3 * 60_000`**: after three minutes without a click or a key the screen locks. `GrdAuth` listens to the page itself; without `idleLock` it never locks.
- **`grdAuthInterceptor()`** puts the token on every request (191), and does more: when the server answers **`401`**, it marks the session as expired, asks for the sign-in window, and **sends the same request again** once the user has signed in. All requests that fail in the meantime wait for the same window.

### Step 3: the window, once in the application

`src/app/app.ts` has, at the end of its template:

```html
<grd-login-host />
```

Put it **once** in the application. It does nothing until somebody asks for a sign-in; then it opens a modal window with the sign-in screen and the reason (_Your session has expired._, _The screen is locked._). The window closes when the user has signed in. When the user closes it without signing in (Esc, the cross, **Cancel**), whoever waited for it gets `false`: a request of the interceptor fails then.

### Step 4: the screen while nobody is signed in, the work while somebody is

<!-- prettier-ignore -->
```html
@if (!auth.user()) {
  <!--
    Nobody is signed in: the sign-in screen, as in 190. (Not "status() === 'anonymous'": while
    the server checks the password the status is 'authenticating', and the screen must stay.)
  -->
  <grd-login
    heading="Sign in"
    subtitle="Try eva with the password gridify"
    [preferences]="false"
  />
} @else {
  <!--
    Somebody is known: signed in, or the session has ended, or the screen is locked (GrdAuth
    keeps the user in each case). The work stays on the screen; while the session does not
    work, a line says so.
  -->
  @if (auth.status() !== 'authenticated') {
    <p class="ended">
      <span>{{ ended() }}</span>
      <grd-button label="Sign in again" (pressed)="signInAgain()" />
    </p>
  }
```

The sign-in screen of 190 is there only while **nobody is known** (`!auth.user()`). An expired session and a locked screen keep their user, so the page with the work stays on the screen, with a line that says what happened and a button **Sign in again** for the case that the user closed the window.

### Step 5: ask for the window when the session ends

```ts
// 1. The session has ended, or the screen is locked: ask for a sign-in at once. The window of
//    <grd-login-host /> opens over the page, and the work under it stays as it is.
effect(() => {
  const status = this.auth.status();
  if (status === 'expired' || status === 'locked') {
    untracked(() => void this.auth.requestSignIn());
  }
});
```

`GrdAuth` does not open the window by itself when the time is up or the screen locks: the application decides (another application might first save the work, or show a message). This one asks at once. `requestSignIn()` called a second time while the window is open does not open a second one: everybody waits for the same sign-in. (The interceptor asks for itself after a `401`.)

### Step 6: the events, and what belongs to whom

```ts
// 2. The events of GrdAuth go into the log, and decide what happens to the work.
this.auth.on('signedIn', (event) => {
  const before = event.previous ? ` (before: ${grdUserName(event.previous)})` : '';
  this.log.write(`signedIn: ${grdUserName(event.user)}${before}`);
  // Somebody else signed in in the window: the work of the user before is not theirs.
  if (event.previous && event.previous.id !== event.user.id) this.note.set('');
});
this.auth.on('expired', (event) => this.log.write(`expired: ${event.reason}`));
this.auth.on('signedOut', (event) => {
  this.log.write(`signedOut: ${event.reason}`);
  // What the application kept for the user goes with them.
  this.note.set('');
});
```

- **`signedIn`** has `previous`: the user the session had before (here the user of an expired session or of a locked screen). When somebody **else** signs in in the window, the work on the screen belongs to the user before, so the application clears it. The same user signing in again keeps everything.
- **`expired`** has the reason: `timeout` (the time was up), `refresh-failed`, `rejected` (the server answered `401`).
- **`signedOut`**: the application clears what it kept for the user.

A refresh has no event of its own: the end of the session simply moves on. The log shows it by watching `session()`:

```ts
// 3. A refresh moves the end of the session on. The user notices nothing; the log does.
let before = this.auth.session();
effect(() => {
  const now = this.auth.session();
  const renewed =
    before.status === 'authenticated' &&
    now.status === 'authenticated' &&
    before.user?.id === now.user?.id &&
    (now.expiresAt ?? 0) > (before.expiresAt ?? 0);
  if (renewed) {
    const end = new Date(now.expiresAt ?? 0).toLocaleTimeString();
    untracked(() => this.log.write(`refreshed: the session now ends at ${end}`));
  }
  before = now;
});
```

### Step 7: the orders, and a request that meets an ended session

`src/app/orders-panel.ts` loads the orders with `HttpClient`, as 191 does:

```ts
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
```

Nothing in it knows about sessions. After the server has forgotten the session, the request gets `401`; the interceptor opens the window, and after the sign-in the request goes again and the orders come, as if nothing had happened. Only when the window is closed without signing in does the request fail.

### Step 8: the buttons that end the session

`src/app/session-panel.ts` shows the state and the end of the session, and has a button for each way a session ends:

```ts
/**
 * The server forgets the session, as when it restarts or an administrator ends it. The page does
 * not know yet: nothing happens until the next request, which the server answers with 401, or
 * until the next refresh of the session, which the server refuses.
 */
protected forget(): void {
  demoServer.expireSession();
  this.log.write('The server forgot the session. Nothing shows until a request or a refresh.');
}

/** What GrdAuth does by itself when the time of a session is up and it cannot be refreshed. */
protected endNow(): void {
  this.auth.expire('timeout');
}

/** What GrdAuth does by itself after `idleLock` without a click or a key. */
protected lock(): void {
  this.auth.lock();
}
```

- **The server forgets the session** (`demoServer.expireSession()`, a button of the pretend server only): nothing shows until the next request, which gets `401`, or until the next refresh of the session (30 seconds before its end), which the server refuses: then the session ends by itself with the reason `refresh-failed`.
- **End the session now** (`auth.expire('timeout')`) does what `GrdAuth` does itself at the end of a session that cannot be refreshed.
- **Lock the screen** (`auth.lock()`) does what `idleLock` does after three minutes.

### Step 9: run it

```
npm run tutorial 193
```

## Try it

1. **Sign in** as `eva`, type something into the note and press **Load the orders**.
2. **The refresh.** Watch _Ends in_ count down from 2:00. At 0:30 it starts again from 2:00, and the log says _refreshed_. Nothing else happens: that is the point.
3. **The server forgets.** Press **The server forgets the session**: nothing happens. Press **Load the orders** before _Ends in_ comes to 0:30 (the refresh would find out by itself, and the log would say _expired: refresh-failed_): the server answers `401`, the window opens (_Your session has expired._), and the log says _expired: rejected_. Sign in as `eva`: the window closes, the orders come (the request was sent again), and your note is still there.
4. **The end, and Cancel.** Press **End the session now**: the window opens (_expired: timeout_). Press Esc: the window closes, the page stays, the header says _(expired)_ and a line says _Your session has ended._ with **Sign in again**. Press **Load the orders** now: the window opens again (the interceptor asks), and Cancel there makes the request fail (_No orders (401)_).
5. **Somebody else.** Press **Sign in again** and sign in as `jan`: the note is empty now, because it was Eva's. The log says _signedIn: Jan Wagner (before: Eva Müller)_.
6. **The lock.** Type a note as Jan, press **Lock the screen**: the window says _The screen is locked._ Sign in as `eva`: _Sign in with the same account._ Sign in as `jan`: the screen opens, and Jan's note is there.
7. **The lock by itself.** Do not touch the page for three minutes: it locks.
8. **Sign out**: the sign-in screen, and the note is gone.

## With a real server

- **A refresh**: the provider of your server has `refresh(session)`, which asks for a new end (`POST /api/auth/refresh`); `grdSessionProvider` has the option `refresh`, `grdOidcProvider` uses a refresh token. Without it, the session simply expires at its end, and the application asks for a sign-in as here.
- **The `401`**: the server answers `401` to a request without a valid session, and the interceptor does the rest. The calls of a provider to its own sign-in API are marked `GRD_AUTH_SKIP`, so that a wrong password (also a `401`) is not taken for an ended session.
- **The lock** keeps nothing secret by itself: the work stays in the page under the window. It keeps somebody else from using the screen of a user who walked away.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdLogin,
  GrdLoginHost,
  GrdTextarea,
  grdUserName,
} from '@gridify/studio';
import { EventLog } from './event-log';
import { OrdersPanel } from './orders-panel';
import { SessionPanel } from './session-panel';

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdLogin,
    GrdLoginHost,
    GrdTextarea,
    OrdersPanel,
    SessionPanel,
  ],
  template: `
    <grd-app-header
      productName="Session expiry"
      subtitle="Tutorial 193"
      preferences="theme density"
    >
      @if (auth.user()) {
        <span grdAppHeaderEnd>{{ who() }}</span>
      }
    </grd-app-header>

    @if (!auth.user()) {
      <!--
        Nobody is signed in: the sign-in screen, as in 190. (Not "status() === 'anonymous'": while
        the server checks the password the status is 'authenticating', and the screen must stay.)
      -->
      <grd-login
        heading="Sign in"
        subtitle="Try eva with the password gridify"
        [preferences]="false"
      />
    } @else {
      <!--
        Somebody is known: signed in, or the session has ended, or the screen is locked (GrdAuth
        keeps the user in each case). The work stays on the screen; while the session does not
        work, a line says so.
      -->
      @if (auth.status() !== 'authenticated') {
        <p class="ended">
          <span>{{ ended() }}</span>
          <grd-button label="Sign in again" (pressed)="signInAgain()" />
        </p>
      }
      <main>
        <section>
          <h2>Your work</h2>
          <grd-textarea label="A note, not saved anywhere" [rows]="6" [(value)]="note" />
        </section>
        <section><app-orders-panel /></section>
        <section><app-session-panel /></section>
        <section>
          <h2>What happened</h2>
          <ol class="log">
            @for (line of log.lines(); track $index) {
              <li>{{ line }}</li>
            }
          </ol>
        </section>
      </main>
    }

    <!-- Once in the application: the window that opens when somebody asks for a sign-in. -->
    <grd-login-host />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: var(--grd-text-main);
      background: var(--grd-bg-main);
    }
    grd-login {
      --grd-login-min-height: 0;
      flex: 1;
    }
    .ended {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 6px 16px;
      background: var(--grd-bg-panel);
      border-bottom: 1px solid var(--grd-border-color);
      color: var(--grd-danger-text);
      font-weight: bold;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(22em, 100%), 1fr));
      align-content: start;
      gap: 16px 32px;
      padding: 16px 24px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
    .log {
      margin: 0;
      padding-left: 1.5em;
      font-family: var(--grd-font-mono, monospace);
      font-size: 0.9em;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);
  protected readonly log = inject(EventLog);

  /** The work of the user: a note that lives only in this page. */
  protected readonly note = signal('');

  protected readonly who = computed(
    () => `${grdUserName(this.auth.user())} (${this.auth.status()})`,
  );
  protected readonly ended = computed(() =>
    this.auth.status() === 'locked' ? 'The screen is locked.' : 'Your session has ended.',
  );

  constructor() {
    // 1. The session has ended, or the screen is locked: ask for a sign-in at once. The window of
    //    <grd-login-host /> opens over the page, and the work under it stays as it is.
    effect(() => {
      const status = this.auth.status();
      if (status === 'expired' || status === 'locked') {
        untracked(() => void this.auth.requestSignIn());
      }
    });

    // 2. The events of GrdAuth go into the log, and decide what happens to the work.
    this.auth.on('signedIn', (event) => {
      const before = event.previous ? ` (before: ${grdUserName(event.previous)})` : '';
      this.log.write(`signedIn: ${grdUserName(event.user)}${before}`);
      // Somebody else signed in in the window: the work of the user before is not theirs.
      if (event.previous && event.previous.id !== event.user.id) this.note.set('');
    });
    this.auth.on('expired', (event) => this.log.write(`expired: ${event.reason}`));
    this.auth.on('signedOut', (event) => {
      this.log.write(`signedOut: ${event.reason}`);
      // What the application kept for the user goes with them.
      this.note.set('');
    });

    // 3. A refresh moves the end of the session on. The user notices nothing; the log does.
    let before = this.auth.session();
    effect(() => {
      const now = this.auth.session();
      const renewed =
        before.status === 'authenticated' &&
        now.status === 'authenticated' &&
        before.user?.id === now.user?.id &&
        (now.expiresAt ?? 0) > (before.expiresAt ?? 0);
      if (renewed) {
        const end = new Date(now.expiresAt ?? 0).toLocaleTimeString();
        untracked(() => this.log.write(`refreshed: the session now ends at ${end}`));
      }
      before = now;
    });
  }

  /** The line under the header: the window again, after it was closed without signing in. */
  protected signInAgain(): void {
    void this.auth.requestSignIn();
  }
}
```

`src/app/event-log.ts`:

```ts
import { Injectable, signal } from '@angular/core';

/** What happened, newest first: the events of GrdAuth and what the application did. */
@Injectable({ providedIn: 'root' })
export class EventLog {
  /** The lines, newest first (at most 30). */
  readonly lines = signal<string[]>([]);

  /** Writes a line with the time of the moment. */
  write(text: string): void {
    const time = new Date().toLocaleTimeString();
    this.lines.update((lines) => [`${time}  ${text}`, ...lines].slice(0, 30));
  }
}
```

## Build it yourself

`npm run tutorial:eject 193 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: an application made by `ng new` with the library installed as in 010, and the files of `src/app` of this tutorial.
