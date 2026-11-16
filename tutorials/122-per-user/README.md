# 122 – A layout for every user

This tutorial shows how to give every user who signs in a layout of their own, so that each gets their own back after a reload. You will learn how to:

- take the key of the layout from the user who is signed in (`GrdAuth.userKey`);
- let the engine follow the key while the application runs: when a different user signs in, it saves what it had and loads the layout of the new user (or the default one);
- keep the session of the user across F5 (`GrdDemoAuth` with a `storageKey`);
- show who is signed in and which key is in use.

Alice arranges her tabs, Bob arranges his, and nobody signed in is one more user with a layout of its own. There is no server: `GrdDemoAuth`, the pretend server of the library, stands in for one. In 015 the browser has one layout, for whoever opens the page. The tutorial is from the series about saving (110–125).

```
npm run tutorial 122
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30122, sign in as Alice in the **User** menu, add a few tabs, then sign in as Bob and add others. Switch between them, sign out, and press F5 at any point.

Every tutorial runs on an address of its own (this one on http://localhost:30122), so it has a `localStorage` of its own. It still keeps its layouts under keys that start with `tutorial-122-layout` and the session of its pretend server under `tutorial-122-session`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with a sign-in added.

### Step 1: a pretend server

`GrdAuth` signs users in through providers. A real application has a provider that asks its server (`grdSessionProvider`, the cookie of a server session), an identity provider (`grdOidcProvider`, Microsoft or Google), or a provider of its own. This tutorial has no server, so it takes `GrdDemoAuth`, a pretend server of the library made for demos and tests. Add `src/app/demo-server.ts`:

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * A pretend server, only for the tutorial: two accounts, an answer at once (`latency: 0`), and the session
 * kept in localStorage under `storageKey`, the way a real server keeps a cookie: after F5 it is still there.
 */
export const demoServer = new GrdDemoAuth({
  accounts: [
    {
      username: 'alice',
      password: 'tutorial',
      user: { id: 'alice', name: 'alice', displayName: 'Alice', roles: [] },
    },
    {
      username: 'bob',
      password: 'tutorial',
      user: { id: 'bob', name: 'bob', displayName: 'Bob', roles: [] },
    },
  ],
  latency: 0,
  storageKey: 'tutorial-122-session',
});
```

- **`accounts`** are the users of the pretend server: a name and a password to sign in with, and the `GrdUser` that the application gets. The `id` of the user is what the key of the layout is made of, so it has to be stable. A login that never changes is good; a display name is not. Without `accounts` the server has accounts of its own (`GRD_DEMO_ACCOUNTS`: Eva, Jan, Petra and more, all with the password `gridify`).
- **`latency: 0`** answers at once. By default the pretend server thinks for 350 ms, as a real one would.
- **`storageKey`** keeps the session of the server in `localStorage`, as a real server keeps a cookie: the session lasts across a reload, every window of the browser has the same one, and signing out takes it away. Without it the session lives in memory, and F5 signs everybody out. Only a demo may keep a session where a script can read it; a real server keeps it in an `HttpOnly` cookie.

The server hands out providers. `demoServer.password` signs in with a name and a password. Like every provider it has three methods that `GrdAuth` calls: **`authenticate(input)`** checks what was given, **`restore()`** is the silent sign-in that finds the session that is still there after a reload, and **`signOut()`** ends the session.

### Step 2: tell the application about it

`provideGrdAuth` in `src/app/app.config.ts` lists the providers:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The way to sign in. The user of the last visit comes back (restore) before the app starts.
    provideGrdAuth({ providers: [demoServer.password] }),
  ],
};
```

`provideGrdAuth` also runs `restore()` before the application starts, so after F5 the first screen already knows who is signed in. That matters for the next step: the engine gets the key of that user from the start, not the key of nobody first and then a switch.

### Step 3: the key of the layout follows the user

In `src/app/app.ts`, inject `GrdAuth` and make the key a `computed`:

```ts
  private readonly auth = inject(GrdAuth);

  /** `tutorial-122-layout` when nobody is signed in, `tutorial-122-layout:alice` for Alice. */
  protected readonly layoutKey = computed(() => this.auth.userKey('tutorial-122-layout'));
```

and bind it to the engine instead of the fixed text of 015:

```html
<grd-docking-engine [layoutStorageKey]="layoutKey()" />
```

`userKey(base)` gives `base` while nobody is signed in and `base:<id>` for a user. It reads the session, a signal, so the `computed` changes when somebody signs in or out. The engine sees the new key and switches the layout. This step is the whole feature; the rest of the tutorial only makes it possible to try.

### Step 4: a User menu and a line that says who is signed in

The menus now depend on the session (a check mark at the user who is signed in, **Sign out** greyed while nobody is), so `menus` becomes a `computed` too, and the template reads it as `[menus]="menus()"`. The **User** menu after **File** has an item for every account of the pretend server (`accountList()`), which signs in with its name and password:

```ts
    {
      id: 'user',
      label: '&User',
      items: [
        ...demoServer.accountList().map(({ username, password, user }) => ({
          label: `Sign in as ${grdUserName(user)}`,
          checked: this.auth.user()?.id === user.id,
          run: () => void this.auth.signIn('password', { username, password }),
        })),
        { separator: true },
        {
          label: 'Sign &out',
          enabled: this.auth.isAuthenticated(),
          run: () => void this.auth.signOut(),
        },
      ],
    },
```

A line under the menu bar says who is signed in and which key the layout is saved under:

```ts
  protected readonly who = computed(() => {
    const user = this.auth.user();
    return user ? `Signed in as ${grdUserName(user)}` : 'Nobody is signed in';
  });
```

<!-- prettier-ignore -->
```html
<p class="who">
  {{ who() }}. The layout is saved under <code>{{ layoutKey() }}</code>
</p>
```

with a style that takes its colors from the theme, so it also reads well in a dark theme:

```scss
.who {
  margin: 0;
  padding: 4px 12px;
  border-bottom: 1px solid var(--grd-border-color);
  background: var(--grd-bg-panel);
  color: var(--grd-text-main);
  font-size: var(--grd-font-size-base);
}
```

### Step 5: run it

```
npm run tutorial 122
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **Nobody first.** The line says _Nobody is signed in. The layout is saved under `tutorial-122-layout`_, and the area is empty. Choose **File › Add HTML**: this _Notes_ tab belongs to nobody.
2. **Alice.** Choose **User › Sign in as Alice**. The line now says `tutorial-122-layout:alice`, and the area is empty: Alice has no saved layout yet, so she gets the default layout of the engine (the empty area). The _Notes_ of nobody went nowhere; they were saved under `tutorial-122-layout` before the switch.
3. Add two counters (**File › Add component** twice) and drag one of them to the side. **Press F5.** Alice is still signed in (the session of the pretend server came back before the application started), and her two counters are where she left them.
4. **Bob.** Choose **User › Sign in as Bob**: the area is empty again. Add three _Notes_. **Press F5.** Bob is still signed in, with his three _Notes_.
5. **Alice again.** Choose **User › Sign in as Alice**: her counters are back, and Bob's _Notes_ are saved under his key.
6. **Sign out.** Choose **User › Sign out**: the line says _Nobody is signed in_, and the _Notes_ of step 1 are back. **Press F5.** Still nobody, still those _Notes_.
7. **Reset is per user.** Sign in as Bob and choose **File › Reset layout**: Bob's area is empty. Sign in as Alice: her counters are untouched. Reset layout resets only the layout of the user who is signed in.
8. **Two windows.** Open http://localhost:30122 in a second tab. It is signed in as the same user. Sign in as Bob in the first tab: the second follows, with Bob's layout. Sign out in the first: the second signs out too, and shows the layout of nobody.
9. **See it.** In the developer tools, _Application › Local storage › http://localhost:30122_ has `tutorial-122-layout`, `tutorial-122-layout:alice` and `tutorial-122-layout:bob`, and `tutorial-122-session` while somebody is signed in: the session of the pretend server (who, a token and its end).

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAuth,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  grdUserName,
} from '@gridify/studio';
import { Counter } from './counter';
import { demoServer } from './demo-server';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <p class="who">
      {{ who() }}. The layout is saved under <code>{{ layoutKey() }}</code>
    </p>
    <!-- every user has a key of their own; a new key loads the layout of that user -->
    <grd-docking-engine [layoutStorageKey]="layoutKey()" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
    }
    .who {
      margin: 0;
      padding: 4px 12px;
      border-bottom: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
      color: var(--grd-text-main);
      font-size: var(--grd-font-size-base);
    }
  `,
})
export class App {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly auth = inject(GrdAuth);

  /** `tutorial-122-layout` when nobody is signed in, `tutorial-122-layout:alice` for Alice. */
  protected readonly layoutKey = computed(() => this.auth.userKey('tutorial-122-layout'));

  protected readonly who = computed(() => {
    const user = this.auth.user();
    return user ? `Signed in as ${grdUserName(user)}` : 'Nobody is signed in';
  });

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'user',
      label: '&User',
      items: [
        ...demoServer.accountList().map(({ username, password, user }) => ({
          label: `Sign in as ${grdUserName(user)}`,
          checked: this.auth.user()?.id === user.id,
          run: () => void this.auth.signIn('password', { username, password }),
        })),
        { separator: true },
        {
          label: 'Sign &out',
          enabled: this.auth.isAuthenticated(),
          run: () => void this.auth.signOut(),
        },
      ],
    },
  ]);
}
```

`src/app/demo-server.ts` and `src/app/app.config.ts` are in steps 1 and 2. `src/app/counter.ts`, `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### The key of a user

`auth.userKey('tutorial-122-layout')` is `tutorial-122-layout` for nobody and `tutorial-122-layout:alice` for the user with the id `alice`. The id is encoded (`encodeURIComponent`), so an id with a colon or a space cannot be mistaken for another user. While a session has `expired` or the screen is `locked`, the user is still known and keeps the key, so the layout does not change under the sign-in window. Only signing out, or signing in as someone else, changes it.

The same key works for anything else of a user that the application keeps in `localStorage`: `auth.userKey('my-app-recent-files')`.

### The engine follows the key

`layoutStorageKey` is an input like any other, and the engine watches it. When it changes:

1. what is waiting to be saved is saved under the **old** key (the layout of Alice is safe before Bob's comes),
2. the layout of the **new** key is loaded, or the default layout (`defaultLayout`, here the empty area) when that key has none.

The same key again does nothing. `null` means no saving and no loading at all. Everything else stays as it was: automatic saving, the settings, the registered components. **File › Reset layout** goes back to the default layout and saves it under the key of the moment, so it resets one user.

### The session comes back first

`provideGrdAuth` runs `restore()` of every provider that has one, before the application starts, and takes the first user it gets. So after F5 the engine starts with the key of Alice, and loads her layout once. Without the silent sign-in, the page would start as nobody, and her layout would come only after she signs in again.

### More windows

`GrdAuth` tells the other windows of the browser (a `BroadcastChannel`) when somebody signs in or out. A sign-out in one window signs the others out. A sign-in in one window: a window whose provider can find the session again (it has `restore`, like the cookie of a server or the session that the pretend server keeps under its `storageKey`) follows when the session it finds is the user who signed in, because that session belongs to the browser; a window whose session ended (an expired one) follows too. When the same user signs in again in one window (a new token), the others take the new token quietly. Each window then switches its layout by the same key.

### A real sign-in

Only the provider changes. For a session of a server, `provideGrdAuth` gets `grdSessionProvider({ me: '/api/me', login: '/login', logout: '/api/logout', label: 'Sign in' })` in place of `demoServer.password`, and the application signs in with `auth.begin('session')` instead of `auth.signIn('password', ...)`. The key and the engine stay exactly as here. The layouts are still kept in `localStorage`, so they are per user **and per browser**: Alice on another computer starts with the default layout. A layout that follows the user from computer to computer has to be saved on a server.

## What you get without writing any of it

- **The switch**: the old layout saved under the old key, the new one loaded, the default layout for a user who has none. No code of the application runs between the two.
- **The silent sign-in before the first screen**, so the first layout is already the right one.
- **A pretend server** (`GrdDemoAuth`) for trying a sign-in without a backend, whose session survives F5 and is the same in every window (`storageKey`).
- **The windows of the browser kept together**: a sign-out (and a sign-in that the provider can find again) reaches every tab.
- **A safe key**: the id is encoded, nobody has a key of their own, and an expired or locked session keeps the key.
- **The session as signals**: `user()`, `isAuthenticated()` and `userKey()` can be read in a `computed` or a template, so the line, the check marks and the greyed **Sign out** follow without a subscription.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 122 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new per-user --style=scss --ssr=false --skip-tests
   cd per-user
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` and `src/app/counter.ts` as in 015.

5. Add `src/app/demo-server.ts`, and replace `src/app/app.config.ts` and `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
