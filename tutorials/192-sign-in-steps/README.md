# 192 – The steps of a sign-in

This tutorial shows what happens when a name and a password are not the whole sign-in: a one-time code of a second factor, a new password, the terms of use, a locked account, a company directory and an identity provider. The sign-in screen of the library handles all of them by itself; the tutorial shows them and what goes on under the screen. You will learn how to:

- offer several ways to sign in on one screen (several providers);
- see the steps that the server asks for after the password (`GrdAuth.pending()`), and how the screen asks them;
- know which way a user signed in with (`session().method`);
- connect the links _Forgot your password?_ and _Create an account_ to the application.

It continues the series of 190 (the sign-in page) and 191 (what a user may do). There is no router here: one page has the sign-in screen, the accounts to try, and what `GrdAuth` says while you try them.

```
npm run tutorial 192
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30192. Every account has the password `gridify`.

## The words first

- **A step** (a _challenge_) is something more that the server wants after the password: a one-time code from an app on the phone (a second factor), a new password for an old one, a click on _I accept the terms of use_. The server decides when a step is needed; the screen only asks it.
- **`pending()`** of `GrdAuth` is the step that waits for an answer, or `null`. While a step waits, nobody is signed in yet: the status is `authenticating`.
- **A directory** is the list of the users of a company (Active Directory, LDAP). Its users sign in with the name of the directory (the domain) as well.
- **An identity provider** is another site that signs the user in (Microsoft, Google, the login service of a company). The application sends the user there and gets them back signed in; it never sees a password.

## Step by step

The application is the header of 190, and a page in two columns: the sign-in screen, and on the side the accounts to try and what `GrdAuth` says.

### Step 1: three ways to sign in

The pretend server has three providers. `src/app/app.config.ts` gives `GrdAuth` all of them:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Three ways to sign in, in the order the sign-in screen shows them:
    // 1. `password`: a name and a password (the accounts of the application itself);
    // 2. `ldap`: a name and a password in a company directory, with the domain (CORP or LAB);
    // 3. `oidc:demo`: a button that goes to an identity provider and comes back.
    provideGrdAuth({ providers: demoServer.providers() }),
  ],
};
```

`demoServer.providers()` is the list `[demoServer.password, demoServer.ldap, demoServer.oidc]`. The sign-in screen draws it so:

- the providers that ask for fields (**Password** and **Company directory**) are forms, shown as **tabs** at the top of the screen;
- the identity provider is a **button** under the forms, behind _or_ (**Continue with Demo ID**).

The screen remembers the tab that was used last and starts with it the next time (`rememberMethod`, on by default; only the id of the tab is kept, never a name or a password).

`src/app/demo-server.ts` is the pretend server of 190 with its own key:

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190). Its accounts show the steps a sign-in can take; the
 * table on the page lists them. Every account has the password `gridify`.
 *
 * The session is kept across F5 (`storageKey`). The rest of the server lives in memory: after F5 a
 * locked account is open again, Lena has her old password and Zora has not accepted the terms yet,
 * so every step can be tried again.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-192-session' });
```

### Step 2: the screen, with its two links

`src/app/app.ts` shows the screen while nobody is signed in:

<!-- prettier-ignore -->
```html
<grd-login
  heading="Sign in"
  subtitle="Every account has the password gridify"
  [preferences]="false"
  forgotPassword
  register
  (forgotPasswordRequested)="tell('reset your password')"
  (registerRequested)="tell('create an account')"
/>
```

Nothing in this code knows about the steps. When the server asks for one, `<grd-login>` turns into that step by itself: the text of the server, the fields of the step, **Back** and **Continue**. **Back** gives the step up and shows the first form again.

The two links only ask the application, because only the server of the application can reset a password or create an account; the library has no page for them:

```ts
protected tell(what: string): void {
  this.box.info(`Here the application would open its own page to ${what}.`);
}
```

`forgotPassword` and `register` draw the links; `(forgotPasswordRequested)` and `(registerRequested)` say that one was pressed. A real application goes to its own page there.

### Step 3: the accounts to try

`src/app/tries.ts` is the table on the side of the page:

```ts
/** An account to try, and what it shows. */
export interface Try {
  /** How to sign in (the form, and what to type). */
  how: string;
  /** What happens. */
  what: string;
}

/** The accounts of the pretend server, and the step each one shows. All have the password `gridify`. */
export const TRIES: Try[] = [
  { how: 'eva', what: 'Signs in at once: no step.' },
  { how: 'otto', what: 'A second factor: asks for a one-time code. The code is 123456.' },
  {
    how: 'lena',
    what: 'Her password is old: she has to set a new one (8 characters or more), twice.',
  },
  { how: 'zora', what: 'Has to accept the terms of use first.' },
  { how: 'karel', what: 'His account is locked: no way in.' },
  { how: 'jan, a wrong password three times', what: 'The third try locks the account.' },
  {
    how: 'The tab Company directory: marta in CORP, david in LAB',
    what: 'A name in a company directory: the form asks for the domain too.',
  },
  {
    how: 'The button Continue with Demo ID',
    what: 'Goes to the identity provider and back. The pretend one signs Eva in at once.',
  },
];
```

### Step 4: what happens under the screen

`src/app/auth-state.ts` shows the signals of `GrdAuth` while you sign in. An application does not need it; it is here so you can see each step come and go:

```ts
import { Component, computed, inject } from '@angular/core';
import { GrdAuth, grdUserName } from '@gridify/studio';

/**
 * What GrdAuth says now, live: the state of the session, whether it waits for the server, and the
 * step that waits for an answer. Not needed by an application; it shows what happens under the screen.
 */
@Component({
  selector: 'app-auth-state',
  template: `
    <h2>What GrdAuth says</h2>
    <dl>
      <dt><code>status()</code></dt>
      <dd>{{ auth.status() }}</dd>
      <dt><code>user()</code></dt>
      <dd>{{ name() || 'null' }}</dd>
      <dt><code>busy()</code></dt>
      <dd>{{ auth.busy() ? 'true: the server is asked' : 'false' }}</dd>
      <dt><code>pending()</code></dt>
      <dd>{{ step() }}</dd>
      <dt><code>session().method</code></dt>
      <dd>{{ auth.session().method ?? '–' }}</dd>
    </dl>
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }
    dd {
      margin: 0;
    }
  `,
})
export class AuthState {
  protected readonly auth = inject(GrdAuth);
  protected readonly name = computed(() => grdUserName(this.auth.user()));

  /** The step that waits for an answer (`otp`, `password-change`, `terms`), or none. */
  protected readonly step = computed(() => {
    const pending = this.auth.pending();
    return pending
      ? `${pending.challenge.type} (from ${pending.providerId})`
      : 'null: no step waits';
  });
}
```

- **`status()`**: `anonymous` (nobody), `authenticating` (a sign-in is on its way, or a step waits), `authenticated` (signed in); 193 adds `expired` and `locked`.
- **`busy()`**: `true` while the server is asked.
- **`pending()`**: the step that waits (`otp`, `password-change`, `terms`), and the provider it came from.
- **`session().method`**: the id of the provider the user signed in with (`password`, `ldap`, `oidc:demo`). An application can, for example, offer the change of the password only to who signed in with a password.

### Step 5: run it

```
npm run tutorial 192
```

## Try it

1. **Eva** signs in at once. _What GrdAuth says_: `authenticated`, the method `password`. Press **Sign out** in the header.
2. **Otto: a second factor.** Sign in as `otto`. Instead of _Welcome_ the screen asks for a code, and `pending()` says `otp (from password)` while `status()` is `authenticating`: nobody is signed in yet. Type `000000`: _The code is not correct_, and the step stays. Type `123456`: Otto is signed in.
3. **Back.** Sign in as `otto` again and press **Back** on the step: the first form is back, with the name and an empty password. The password is never kept, not even during a step.
4. **Lena: a new password.** Sign in as `lena`: her password is old. Type a new one twice (8 characters or more; the meter under the field shows how strong it is). A new password that is too short, or two that differ, keep the step. After **Continue**, Lena is signed in. Sign out and sign in again: now her new password is the one that works (until F5, which restarts the pretend server).
5. **Zora: the terms.** Sign in as `zora`, tick _I accept the terms of use_ and press **Continue**.
6. **Karel: locked.** Sign in as `karel`: _The account is locked._ The screen does not say more. (A name that does not exist gets the same answer as a wrong password; a locked account is the one answer that tells that the name exists, and the pretend server gives it before it checks the password.)
7. **Jan: three wrong passwords.** Sign in as `jan` with a wrong password three times: the third answer is _The account is locked._ F5 opens it again (the pretend server forgets).
8. **The directory.** Choose the tab **Company directory**: the form has a **Domain** too. Sign in as `marta` in `CORP`. The method is `ldap`. `marta` in `LAB` is not right (she is in `CORP`): _The name or the password is not correct._
9. **The identity provider.** Sign out and press **Continue with Demo ID**. A real identity provider would show its own page; the pretend one signs Eva in at once. The method is `oidc:demo`.
10. **The links.** Press _Forgot your password?_ or _Create an account_: the message of the application.

## With a real server

The screen and the page stay as they are; only the providers change:

- **Steps**: a provider of your own answers `grdAuthChallenge({ type: 'otp', fields: [...], message, ticket })` instead of a user, when its server asks for a step; `GrdAuth` then calls its `answer(challenge, input)` with what the user typed. The playground (Help, _Sign-in_) shows such a provider.
- **A directory** is not asked by the browser: a browser never talks to a directory or a database. The backend of the application does, and the provider sends it the name, the password and the domain.
- **An identity provider**: `grdOidcProvider({ id, label, authority, clientId, redirectUri, scope })` (OpenID Connect with PKCE), or `grdSessionProvider({ me, login, ... })` when the backend runs the sign-in at the identity provider itself and keeps the session in a cookie.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdLogin,
  GrdMessageBox,
  grdUserName,
} from '@gridify/studio';
import { AuthState } from './auth-state';
import { TRIES } from './tries';

@Component({
  selector: 'app-root',
  imports: [AuthState, GrdAppHeader, GrdButton, GrdLogin],
  template: `
    <grd-app-header productName="Sign-in steps" subtitle="Tutorial 192" preferences="theme density">
      @if (auth.user()) {
        <grd-button grdAppHeaderEnd label="Sign out" (pressed)="signOut()" />
      }
    </grd-app-header>

    <main>
      <section class="screen">
        @if (auth.isAuthenticated()) {
          <h1>Welcome, {{ name() }}</h1>
          <p>
            You signed in with: <code>{{ auth.session().method }}</code>
          </p>
          <p>Sign out to try another account.</p>
        } @else {
          <!--
            The sign-in screen draws every provider of app.config.ts: the two forms as tabs
            (Password and Directory), the identity provider as a button under them. When the
            server asks for a step more, the screen turns into that step by itself.
          -->
          <grd-login
            heading="Sign in"
            subtitle="Every account has the password gridify"
            [preferences]="false"
            forgotPassword
            register
            (forgotPasswordRequested)="tell('reset your password')"
            (registerRequested)="tell('create an account')"
          />
        }
      </section>

      <section class="side">
        <h2>Accounts to try</h2>
        <table>
          <tbody>
            @for (item of tries; track item.how) {
              <tr>
                <th>{{ item.how }}</th>
                <td>{{ item.what }}</td>
              </tr>
            }
          </tbody>
        </table>
        <app-auth-state />
      </section>
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
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px 24px;
    }
    .screen {
      flex: 1 1 26em;
    }
    grd-login {
      /* The screen in a column of the page, not over the whole window. */
      --grd-login-min-height: 0;
    }
    .side {
      flex: 1 1 22em;
      display: grid;
      align-content: start;
      gap: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
    }
    table {
      border-collapse: collapse;
    }
    th,
    td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--grd-border-color);
      text-align: left;
      vertical-align: top;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);
  private readonly box = inject(GrdMessageBox);

  protected readonly tries = TRIES;
  protected readonly name = computed(() => grdUserName(this.auth.user()));

  protected signOut(): void {
    void this.auth.signOut();
  }

  /**
   * The two links of the screen only ask the application: the library has no page to reset a
   * password or to create an account, because only the server of the application can do that.
   */
  protected tell(what: string): void {
    this.box.info(`Here the application would open its own page to ${what}.`);
  }
}
```

## Build it yourself

`npm run tutorial:eject 192 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: an application made by `ng new` (no router is needed) with the library installed as in 010, and the files `demo-server.ts`, `app.config.ts`, `app.ts`, `tries.ts` and `auth-state.ts` in `src/app`.
