# 194 – The user menu and the profile

This tutorial shows what a signed-in user sees of themselves: the user menu at the end of the header, and their profile in a window, where they change their name, e-mail and photo, the password, the second factor, the places where they are signed in, the appearance and the notifications. You will learn how to:

- put the user menu into the header (`grd-user-menu`): **Sign in** for nobody, the face and the name of the user, and a panel with the card of the user and the commands;
- add the commands of the application to the menu (`items`), and show the presence of the user (`status`) and the names of the roles (`roleLabels`);
- open the profile in a window (`GrdProfileDialog`), with the topics of the notifications and a callback for each save;
- write the store that the profile loads and saves through (`GrdProfileStore`, `provideGrdProfileStore`): the one class that the application writes for the profile;
- keep the theme, the density and the language of each user apart (`auth.userKey`, `setStorageKey`).

It closes the series of 190–193. There is no router: one page with the header, and what the application knows about the user.

```
npm run tutorial 194
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30194, press **Sign in** at the right end of the header and sign in as `eva` with the password `gridify`.

## The words first

- **The user menu** is the button of the user at the end of the header, and the panel under it. The library draws it from `GrdAuth`; the application adds rows to it and decides what they do.
- **The profile** is what the user may change about themselves: the name to show, the e-mail, the telephone number, the photo, the password, the second factor, where they are signed in, the appearance and the notifications. Who the user is (the sign-in name, the roles) is not in it: the server says that, and the profile never changes it.
- **The store of the profile** (`GrdProfileStore`) loads the profile from the server and saves it there. The library draws the forms and checks what it can in the browser; the store is the part that knows the server, so **the application writes it**.
- **The presence** (online, away, do not disturb, offline) is a dot on the avatar. The menu shows it; the application knows it.
- **The appearance** is the theme, the density and the language. The browser keeps them in `localStorage` (see 125); here every user gets their own.

## Step by step

### Step 1: a pretend server

`src/app/demo-server.ts` is the one of 190, with a key of its own:

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190): the accounts of the library (`eva`, `jan`, `petra`
 * and more, all with the password `gridify`) and the session kept across F5.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-194-session' });
```

### Step 2: the store of the profile

The profile of the library loads and saves through a store that the application writes. `src/app/profile-store.ts` plays the server in the browser: each method does what a server would do, and the comment above it says which request a real store sends.

```ts
import { Injectable } from '@angular/core';
import {
  type GrdDemoAccount,
  grdProfileOk,
  type GrdPasswordChange,
  type GrdProfile,
  type GrdProfilePatch,
  type GrdProfileResult,
  type GrdProfileSession,
  type GrdProfileStore,
} from '@gridify/studio';
import { demoServer } from './demo-server';

/** The profiles that the pretend server keeps, by the id of the user (in memory: F5 starts again). */
const profiles = new Map<string, GrdProfile>();
/** The other places where each user is signed in, by the id of the user. */
const places = new Map<string, GrdProfileSession[]>();

/** The largest photo this server takes. (The page itself turns back a file over 2 MB.) */
const PHOTO_MAX = 1024 * 1024;

/** A pause as long as a request to a server takes. */
const serverPause = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The store of the profile: the profile of the library (`GrdProfileDialog`, `grd-user-profile`)
 * loads and saves through it. The library does not know the server of the application, so the
 * application writes this one class.
 *
 * A real store calls its server with HttpClient (the request is in the comment of each method).
 * This one plays the server in the browser, so the tutorial runs without one: each method does
 * what the server would do, and answers what the server would answer.
 *
 * The methods after `save` are optional: the profile draws only what the store can do (without
 * `uploadAvatar` no button for a photo, without `changePassword` no form of the password, without
 * `sessions` no list of the places).
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore implements GrdProfileStore {
  /** GET /api/profile: the profile of the signed-in user. */
  async load(): Promise<GrdProfile> {
    await serverPause();
    return this.profileOf(this.whoAsks());
  }

  /**
   * PATCH /api/profile with the fields that changed. The answer is the profile as the server has it
   * now, or a refusal with a code that the profile has a text for.
   */
  async save(patch: GrdProfilePatch): Promise<GrdProfileResult<GrdProfile>> {
    await serverPause();
    const account = this.whoAsks();
    // The server checks what the browser cannot: an e-mail that another account has already.
    if (patch.email !== undefined && this.emailTaken(patch.email, account)) {
      return { status: 'error', code: 'email-taken' };
    }
    // The fields that came replace the ones that were there; the others stay.
    const profile = { ...this.profileOf(account), ...patch };
    profiles.set(account.user.id, profile);
    // The account keeps the name, the e-mail and the photo too, so that the next sign-in brings
    // the user as the server has them now. (The profile of the library puts the change into the
    // session of this window by itself: the user menu shows it at once.)
    demoServer.editProfile({
      displayName: profile.displayName,
      email: profile.email,
      avatar: profile.avatar ?? null,
    });
    // The second factor: from the next sign-in on, the pretend server asks for the code (123456).
    if (patch.twoFactor !== undefined) demoServer.setSecondFactor(patch.twoFactor);
    return grdProfileOk(profile);
  }

  /** POST /api/profile/photo: keeps a photo and answers with its address. */
  async uploadAvatar(file: File): Promise<GrdProfileResult<string>> {
    await serverPause();
    // Only somebody who is signed in may (whoAsks throws for nobody).
    this.whoAsks();
    if (!file.type.startsWith('image/')) return { status: 'error', code: 'file-type' };
    if (file.size > PHOTO_MAX) return { status: 'error', code: 'file-size' };
    // A real server keeps the file and answers with its URL; here the photo is a `data:` URL.
    // The profile then saves itself with it (`save({ avatar })`).
    return grdProfileOk(await readAsDataUrl(file));
  }

  /** POST /api/profile/password: the pretend server checks the current password and the new one. */
  changePassword(change: GrdPasswordChange): Promise<GrdProfileResult> {
    return demoServer.changePassword(change);
  }

  /** GET /api/profile/sessions: this browser, and the other places where the user is signed in. */
  async sessions(): Promise<readonly GrdProfileSession[]> {
    await serverPause();
    const account = this.whoAsks();
    // `current` marks the session that asks: the list has no "Sign out" for it.
    const here: GrdProfileSession = {
      id: 'here',
      name: 'This browser',
      lastSeen: Date.now(),
      current: true,
    };
    return [here, ...this.placesOf(account)];
  }

  /** DELETE /api/profile/sessions/{id}: ends the session of another place. */
  async revokeSession(id: string): Promise<GrdProfileResult> {
    await serverPause();
    const account = this.whoAsks();
    const left = this.placesOf(account).filter((place) => place.id !== id);
    places.set(account.user.id, left);
    return grdProfileOk();
  }

  /**
   * Who asks. A server knows it from its own session (the cookie or the token of the request),
   * never from what the browser says. Nobody: the server answers 401, and the profile says so.
   */
  private whoAsks(): GrdDemoAccount {
    const account = demoServer.signedAccount();
    if (!account) throw { status: 401 };
    return account;
  }

  /** The profile of a user; the first time, made from the account. */
  private profileOf(account: GrdDemoAccount): GrdProfile {
    const kept = profiles.get(account.user.id);
    if (kept) return kept;
    return {
      displayName: account.user.displayName ?? account.user.name,
      email: account.user.email ?? '',
      phone: '',
      avatar: null,
      // A profile that says whether the second factor is on gets its switch (the Security tab).
      twoFactor: demoServer.hasSecondFactor(account),
      // The topics of the notifications that are on (the topics themselves are in app.ts).
      notifications: { orders: true },
    };
  }

  /** The other places of a user; the first time, two made up. */
  private placesOf(account: GrdDemoAccount): GrdProfileSession[] {
    const id = account.user.id;
    if (!places.has(id)) {
      const hour = 60 * 60 * 1000;
      places.set(id, [
        {
          id: 'phone',
          name: 'Safari on iPhone',
          detail: 'Prague',
          lastSeen: Date.now() - 2 * hour,
        },
        { id: 'office', name: 'Edge on Windows', detail: 'Brno', lastSeen: Date.now() - 26 * hour },
      ]);
    }
    return places.get(id)!;
  }

  /** Does another account have this e-mail? */
  private emailTaken(email: string, account: GrdDemoAccount): boolean {
    const wanted = email.trim().toLowerCase();
    return demoServer
      .accountList()
      .filter((other) => other.user.id !== account.user.id)
      .some((other) => this.profileOf(other).email.toLowerCase() === wanted);
  }
}

/** The content of a file as a `data:` URL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
```

- **`load()`** gives the profile (`GrdProfile`): `displayName`, `email`, `phone`, `avatar` (the address of a photo, or `null` for the initials), `twoFactor` and `notifications` (the topics that are on, by their id).
- **`save(patch)`** gets only the fields that changed, and answers with the profile as the server has it now: `grdProfileOk(profile)`. A refusal is `{ status: 'error', code }`. The profile has a text for the codes of the library (`email-taken`, `invalid-email`, `invalid-password`, `weak-password`, `file-type`, `file-size`, `forbidden`, `network`, `unknown`) and shows `message` for a code of your own.
- **A method that throws** is a refusal too: an error with `status` 401 or 403 is `forbidden` (here: nobody is signed in), with `status` 0 it is `network` (the server cannot be reached).
- **The methods after `save` are optional**, and the profile draws only what the store can do: without `uploadAvatar` no button for a photo, without `changePassword` no form of the password (a user who signs in at an identity provider has no password here), without `sessions` no list of the places. The switch of the second factor is there when the profile says whether it is on (`twoFactor`).
- **Who asks** is what the server knows from its own session (`whoAsks()`), never what the browser says: a page can say anything.

### Step 3: tell the application about it

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth, provideGrdProfileStore } from '@gridify/studio';
import { demoServer } from './demo-server';
import { ProfileStore } from './profile-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The sign-in, as in 190.
    provideGrdAuth({ providers: [demoServer.password] }),
    // The store of the profile: the profile of the library loads and saves through it. The
    // function runs where inject() works, so a store may inject what it needs (a real one
    // injects HttpClient).
    provideGrdProfileStore(() => inject(ProfileStore)),
  ],
};
```

`provideGrdProfileStore` takes the store, or a function that makes it. The function runs where `inject()` works, so a store may inject what it needs (`HttpClient`). Without a store, the profile says _This application has no store for the profile._

### Step 4: the user menu in the header

`src/app/app.ts` puts the user menu into the last place of the header (`grdAppHeaderUser`):

<!-- prettier-ignore -->
```html
<grd-user-menu
  grdAppHeaderUser
  profile
  settings
  switchAccount
  [items]="items()"
  [status]="presence()"
  [roleLabels]="roleLabels"
  (profileRequested)="openProfile()"
  (settingsRequested)="openProfile('preferences')"
/>
```

- **Nobody signed in**: the button is **Sign in**. It asks `GrdAuth` for the sign-in window (`requestSignIn()`), which `<grd-login-host />` shows (step 5).
- **Somebody**: the avatar (the photo, else the initials) and the name. The panel has the **card** (the name, the e-mail, the presence, the roles), the rows, and **Sign out** at the end.
- **`profile`** and **`settings`** add _My profile…_ and _Settings…_. They only ask: `(profileRequested)` and `(settingsRequested)` say that one was chosen, and the application opens what it wants (step 6).
- **`switchAccount`** adds _Switch account_: it signs out and asks for the sign-in window at once.
- **`[roleLabels]`** gives the roles names on the card (`admin` is _Administrator_); a role without a name shows as it is.
- **`[items]`** and **`[status]`**: step 7.

The menu has no state of its own: it reads `GrdAuth`, so it follows every sign-in and sign-out, a session that has ended (193) and every save of the profile by itself. A header that needs no more than **Sign in** and **Sign out** has the attribute `user` instead (`<grd-app-header user />`); this one has more to say, so it puts a menu of its own into the slot.

### Step 5: the sign-in window

**Sign in** and _Switch account_ do not go to a page: they ask for the sign-in window. It is put once in the application, at the end of the template, as in 193:

```html
<grd-login-host />
```

The window has the sign-in screen with every step of 192: the code of the second factor too (step 11 of _Try it_).

### Step 6: the profile in a window

_My profile…_, _Settings…_ and the button **Open my profile** on the page call one method:

```ts
/**
 * Opens the profile of the user in a window (the same window again when it is open). `tab` is the
 * tab to show first: "Settings…" asks for the appearance, the rest for the first tab.
 */
protected openProfile(tab?: string): void {
  this.profile.open({
    // The topics of the Notifications tab; without them the tab is left out.
    topics: TOPICS,
    selected: tab,
    // Every save that succeeds: the profile as the store answered it.
    saved: (profile) => this.lastSave.set({ at: new Date(), profile }),
  });
}
```

- **`GrdProfileDialog.open(options)`** opens the profile (`grd-user-profile`) in a modal window with a **Close** button. There is one window at a time: opened again, the same window comes back.
- **`topics`** are the topics of the notifications (at the top of `app.ts`): the Notifications tab has a check box for each, and without topics there is no such tab. The profile keeps what is on by the id of the topic: `notifications: { orders: true, news: true }`.
- **`selected`** is the tab to show first. _Settings…_ asks for **Preferences** (`'preferences'`): this application has no settings of its own but the appearance.
- **`saved`** is called after every save that succeeded, with the profile as the store answered it. The page shows it under _What the store gave back_.

The window has four tabs: **Profile** (the photo, the sign-in name, the name, the e-mail, the telephone number), **Security** (the password, the second factor, the places), **Preferences** (the theme, the density, the language) and **Notifications**. A change of the name, the e-mail or the photo goes into the session at once (`GrdAuth.updateUser`): the menu, the page and everything else that reads `auth.user()` show it without a reload.

### Step 7: the commands of the application, and the presence

```ts
/**
 * The presence of the user: a dot on the avatar and a word on the card. The menu only shows it;
 * the application knows it (here the user chooses it in the menu).
 */
protected readonly presence = signal<GrdAvatarStatus>('online');

/**
 * The commands of the application in the user menu, as in any menu: a label, `run`, and here
 * `checked`. An item with `children` is a heading in the panel, with its items under it. A
 * `computed`, so that the check mark follows the presence.
 */
protected readonly items = computed<GrdMenuItem[]>(() => [
  {
    label: 'Presence',
    children: PRESENCES.map((choice) => ({
      label: choice.label,
      checked: this.presence() === choice.value,
      run: () => this.presence.set(choice.value),
    })),
  },
]);
```

- **`items`** are `GrdMenuItem`s, as in any menu (100): `label`, `icon`, `run`, `enabled`, `checked`, `separator`. They stand under _My profile…_ and _Settings…_.
- **An item with `children`** has no submenu in the panel: its label is a heading, and its items follow it.
- **`status`** is the presence: a dot on the avatar of the button and of the card, and a word on the card. It is only a look: a real application gets the presence from its server (who is online) and gives it to the menu.

The page draws the same face with `grd-avatar`:

<!-- prettier-ignore -->
```html
<grd-avatar
  size="xlarge"
  [src]="user.avatar"
  [name]="nameOf(user)"
  [seed]="user.id"
  [status]="presence()"
/>
```

`seed` (the id of the user) chooses the color of the initials, so the face on the page and in the menu is the same.

### Step 8: the appearance of each user

```ts
// 1. The appearance of each user. auth.userKey(base) is the key of the user who is signed in
//    (tutorial-194-theme:u-eva), and the base for nobody (tutorial-194-theme). The effect runs
//    again when the key changes, so when somebody else signs in, each service takes the
//    choice that was kept under the key of the new user.
effect(() => {
  const theme = this.auth.userKey('tutorial-194-theme');
  const density = this.auth.userKey('tutorial-194-density');
  const language = this.auth.userKey('tutorial-194-language');
  // Only the keys start the effect, not what the services read while they switch.
  untracked(() => {
    this.theme.setStorageKey(theme);
    this.density.setStorageKey(density);
    this.language.setStorageKey(language);
  });
});
```

- The services of the appearance (`GrdTheme`, `GrdUiSettings`, `GrdI18n`) keep the choice in `localStorage` under a key (125). **`setStorageKey(key)`** switches the key while the application runs: the service takes the choice kept under the new key (the default when there is none) and keeps the next choices there.
- **`auth.userKey(base)`** is `base` for nobody and `base:<id>` for a user: `tutorial-194-theme:u-eva`. It reads the session, a signal, so the effect runs again whenever somebody else signs in. A user who is kept while the session has ended or the screen is locked (193) keeps the key, so the appearance does not change under the sign-in window.
- **`untracked`** keeps the effect to the keys: the services read signals of their own while they switch, and those must not run it again.

The page shows the keys under _Where the appearance is kept_. The same `userKey` gives every user a layout of their own in a docking application (122).

### Step 9: what belongs to the user

```ts
// 2. What the page holds belongs to the user: it goes when they sign out (also by "Switch
//    account", which signs out first), and when somebody else signs in after the session has
//    ended (then there is no signedOut: `previous` is the user who was there before).
const forget = () => {
  this.lastSave.set(null);
  this.presence.set('online');
};
this.auth.on('signedOut', forget);
this.auth.on('signedIn', (event) => {
  if (event.previous && event.previous.id !== event.user.id) forget();
});
```

The last save and the presence belong to the user who is signed in. When they sign out (also by _Switch account_), they go. A session that has ended (193) leaves the user on the button, and the sign-in window may then be answered by somebody else: `GrdAuth` sends no `signedOut` for that, only `signedIn` with the user who was there before in `previous`, so the page forgets there too.

### Step 10: run it

```
npm run tutorial 194
```

## Try it

1. **Nobody.** The header ends with **Sign in**. The keys of the appearance are those of nobody (`tutorial-194-theme`).
2. **Signing in.** Press **Sign in**: the sign-in window opens. Sign in as `eva`: the button has her initials (EM) with a green dot, and her name. The keys now end with `:u-eva`.
3. **The panel.** Press the button: the card (_Eva Müller_, her e-mail, _Online_ and the badge _Administrator_), _My profile…_, _Settings…_, the heading _Presence_ with four rows, _Switch account_ and _Sign out_. Choose **Away**: the dot changes on the button, on the card and on the page, and _Away_ has the check mark.
4. **The name.** _My profile…_ opens the window on **Profile**. Change the name to `Eva Nová` and press **Save**: _Saved._, and the button and the page have the new name at once. _What the store gave back_ shows the profile as the store answered it.
5. **An e-mail of another account.** Type `jan.wagner@example.com` and press **Save**: _Another account uses this e-mail address._ (the server checked that). `eva@` is turned back before anything is sent: _Enter an e-mail address, for example name@example.com._ **Revert** brings back what was saved.
6. **A photo.** Press **Choose a photo** (or drop an image on it) and choose an image: it is in the window, on the button and on the page. A file that is not an image: _Choose an image._; an image over 1 MB: _The photo is too big._ (the window turns back more than 2 MB by itself, this server more than 1 MB). **Remove the photo**: the initials are back.
7. **The password.** On **Security**, type the current password `gridify` and a new one twice (8 characters or more; the meter shows how strong it is). A wrong current password: _The current password is wrong._; two new ones that differ: _The two passwords are not the same._ After **Change the password**: _The password was changed._
8. **Two-step verification.** Tick _Ask for a code when I sign in_.
9. **Where you are signed in.** This browser (_This device_) and two other places. Press **Sign out** at _Safari on iPhone_: it is gone. This browser has no such button: the user signs out by the menu.
10. **Notifications.** Tick _News and tips_: it is saved at once (there is no button), and _What the store gave back_ has `"news": true`.
11. **Signing in again.** Close the window and choose _Sign out_ in the menu. Press **Sign in** and sign in as `eva` with `gridify`: _The name or the password is not correct._ With the new password the window asks for the code (step 8): type `123456`.
12. **The appearance.** _Settings…_ opens the window on **Preferences**. Choose the theme _IDE Dark_ and the language _Deutsch_: the window and the menu speak German (the texts of this tutorial are its own, in English only), and the selects in the header show the same choice (they are the same services). Sign out: the appearance of nobody is back. Sign in as `jan`: his own. _Switch account_ to `eva` (her new password and the code): dark and German again.
13. **F5.** Eva stays signed in (as in 190), and so does her appearance (it is in `localStorage`). Her name, photo, password and second factor are as they were at the start: the pretend server lives in the memory of the page.

## With a real server

- **The store** calls the server of the application. With `HttpClient` it can start like this (the requests carry the token of the user with `grdAuthInterceptor`, as in 191):

  ```ts
  import { HttpClient, HttpErrorResponse } from '@angular/common/http';
  import { inject, Injectable } from '@angular/core';
  import {
    grdProfileOk,
    type GrdProfile,
    type GrdProfilePatch,
    type GrdProfileResult,
    type GrdProfileStore,
  } from '@gridify/studio';
  import { firstValueFrom } from 'rxjs';

  @Injectable({ providedIn: 'root' })
  export class HttpProfileStore implements GrdProfileStore {
    private readonly http = inject(HttpClient);

    load(): Promise<GrdProfile> {
      return firstValueFrom(this.http.get<GrdProfile>('/api/profile'));
    }

    async save(patch: GrdProfilePatch): Promise<GrdProfileResult<GrdProfile>> {
      try {
        return grdProfileOk(
          await firstValueFrom(this.http.patch<GrdProfile>('/api/profile', patch)),
        );
      } catch (error) {
        // The server says why in its answer, for example { "code": "email-taken" }.
        const code = error instanceof HttpErrorResponse ? error.error?.code : undefined;
        if (typeof code === 'string') return { status: 'error', code };
        // Anything else: the profile makes "network" or "forbidden" of it.
        throw error;
      }
    }
  }
  ```

  The other methods are written the same way (`POST /api/profile/photo` with the file in a `FormData`, and so on); a store without them simply has fewer things on the screen.

- **For the tests of an application** the library has a store on its pretend server: `provideGrdProfileStore(new GrdDemoProfileStore(demoServer))`. It does what the store of this tutorial does, and checks the e-mail and the photo as a real server would.
- **The profile on a page** instead of a window: `<grd-user-profile [topics]="topics" (saved)="..." />` on a route of its own (`/profile`), and `(profileRequested)` goes there. `tabs` chooses the tabs (`tabs="profile security"`), and `pages` adds pages of the application (a component that injects `GrdProfileState`; 197 shows two).
- **The appearance kept by the server**, so that it follows the user to another computer: the user that the server sends has `locale` and `preferences` (the application decides what they hold). The application applies them after the sign-in, in an effect like the one of step 8.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdAvatar,
  type GrdAvatarStatus,
  GrdButton,
  GrdI18n,
  GrdLoginHost,
  type GrdMenuItem,
  type GrdProfile,
  GrdProfileDialog,
  type GrdProfileTopic,
  GrdTheme,
  GrdUiSettings,
  GrdUserMenu,
  grdUserName,
} from '@gridify/studio';

/** The topics of the notifications: the Notifications tab of the profile has a check box for each. */
const TOPICS: GrdProfileTopic[] = [
  { id: 'orders', label: 'Order updates', description: 'When an order is placed or changes.' },
  { id: 'mentions', label: 'Mentions', description: 'When somebody writes to you.' },
  { id: 'news', label: 'News and tips', description: 'Now and then, not often.' },
];

/** The presences that the user chooses in the user menu. */
const PRESENCES: { value: GrdAvatarStatus; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Away' },
  { value: 'busy', label: 'Do not disturb' },
  { value: 'offline', label: 'Offline' },
];

/** What a save gave back, and when. */
interface Save {
  readonly at: Date;
  readonly profile: GrdProfile;
}

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdAvatar, GrdButton, GrdLoginHost, GrdUserMenu],
  template: `
    <grd-app-header
      productName="User menu and profile"
      subtitle="Tutorial 194"
      preferences="theme density"
    >
      <!--
        The user menu, at the far end of the header. Nobody signed in: a button "Sign in". Somebody:
        the face and the name, and under them a panel with the card of the user, the rows that the
        attributes ask for, the commands of the application and "Sign out".
      -->
      <grd-user-menu
        grdAppHeaderUser
        profile
        settings
        switchAccount
        [items]="items()"
        [status]="presence()"
        [roleLabels]="roleLabels"
        (profileRequested)="openProfile()"
        (settingsRequested)="openProfile('preferences')"
      />
    </grd-app-header>

    <main>
      @if (auth.user(); as user) {
        <!-- The page shows the user too. auth.user() follows every save of the profile. -->
        <section class="you">
          <grd-avatar
            size="xlarge"
            [src]="user.avatar"
            [name]="nameOf(user)"
            [seed]="user.id"
            [status]="presence()"
          />
          <div>
            <h2>{{ nameOf(user) }}</h2>
            <p>{{ user.email }}</p>
            <grd-button label="Open my profile" (pressed)="openProfile()" />
          </div>
        </section>
        <section>
          <h2>What the store gave back</h2>
          @if (lastSave(); as save) {
            <p>The last save, at {{ save.at.toLocaleTimeString() }}:</p>
            <pre>{{ textOf(save.profile) }}</pre>
          } @else {
            <p>Nothing was saved yet. Open the profile, change something and save it.</p>
          }
        </section>
      } @else {
        <section>
          <h2>Nobody is signed in</h2>
          <p>Press Sign in at the right end of the header.</p>
          <p>Sign in as eva with the password gridify (or jan, or petra).</p>
        </section>
      }
      <section>
        <h2>Where the appearance is kept</h2>
        <!-- The keys in localStorage that the theme, the density and the language use now. -->
        <dl>
          <dt>Theme</dt>
          <dd>{{ theme.storageKey() }}</dd>
          <dt>Density</dt>
          <dd>{{ density.storageKey() }}</dd>
          <dt>Language</dt>
          <dd>{{ language.storageKey() }}</dd>
        </dl>
      </section>
    </main>

    <!-- Once in the application: the sign-in window that "Sign in" and "Switch account" open. -->
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
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(22em, 100%), 1fr));
      align-content: start;
      align-items: start;
      gap: 16px 32px;
      padding: 16px 24px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
    .you {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .you p {
      margin: 0 0 12px;
    }
    pre {
      margin: 0;
      font-family: var(--grd-font-mono, monospace);
      font-size: 0.9em;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }
    dd {
      margin: 0;
      font-family: var(--grd-font-mono, monospace);
    }
  `,
})
export class App {
  /** The session: who is signed in (`user()`). The user menu reads it by itself. */
  protected readonly auth = inject(GrdAuth);
  /** The profile in a window. */
  private readonly profile = inject(GrdProfileDialog);
  /** The services of the appearance: the theme, the density and the language. */
  protected readonly theme = inject(GrdTheme);
  protected readonly density = inject(GrdUiSettings);
  protected readonly language = inject(GrdI18n);

  /** The name to show: the display name of the user (`Eva Müller`), else the sign-in name. */
  protected readonly nameOf = grdUserName;

  /** The names of the roles on the card of the user menu (a role without a name shows as it is). */
  protected readonly roleLabels = { admin: 'Administrator', editor: 'Editor', viewer: 'Viewer' };

  /**
   * The presence of the user: a dot on the avatar and a word on the card. The menu only shows it;
   * the application knows it (here the user chooses it in the menu).
   */
  protected readonly presence = signal<GrdAvatarStatus>('online');

  /**
   * The commands of the application in the user menu, as in any menu: a label, `run`, and here
   * `checked`. An item with `children` is a heading in the panel, with its items under it. A
   * `computed`, so that the check mark follows the presence.
   */
  protected readonly items = computed<GrdMenuItem[]>(() => [
    {
      label: 'Presence',
      children: PRESENCES.map((choice) => ({
        label: choice.label,
        checked: this.presence() === choice.value,
        run: () => this.presence.set(choice.value),
      })),
    },
  ]);

  /** The last save of the profile (`null` before the first one). */
  protected readonly lastSave = signal<Save | null>(null);

  constructor() {
    // 1. The appearance of each user. auth.userKey(base) is the key of the user who is signed in
    //    (tutorial-194-theme:u-eva), and the base for nobody (tutorial-194-theme). The effect runs
    //    again when the key changes, so when somebody else signs in, each service takes the
    //    choice that was kept under the key of the new user.
    effect(() => {
      const theme = this.auth.userKey('tutorial-194-theme');
      const density = this.auth.userKey('tutorial-194-density');
      const language = this.auth.userKey('tutorial-194-language');
      // Only the keys start the effect, not what the services read while they switch.
      untracked(() => {
        this.theme.setStorageKey(theme);
        this.density.setStorageKey(density);
        this.language.setStorageKey(language);
      });
    });

    // 2. What the page holds belongs to the user: it goes when they sign out (also by "Switch
    //    account", which signs out first), and when somebody else signs in after the session has
    //    ended (then there is no signedOut: `previous` is the user who was there before).
    const forget = () => {
      this.lastSave.set(null);
      this.presence.set('online');
    };
    this.auth.on('signedOut', forget);
    this.auth.on('signedIn', (event) => {
      if (event.previous && event.previous.id !== event.user.id) forget();
    });
  }

  /**
   * Opens the profile of the user in a window (the same window again when it is open). `tab` is the
   * tab to show first: "Settings…" asks for the appearance, the rest for the first tab.
   */
  protected openProfile(tab?: string): void {
    this.profile.open({
      // The topics of the Notifications tab; without them the tab is left out.
      topics: TOPICS,
      selected: tab,
      // Every save that succeeds: the profile as the store answered it.
      saved: (profile) => this.lastSave.set({ at: new Date(), profile }),
    });
  }

  /** The profile as text. The photo is a long `data:` URL, so only its start is shown. */
  protected textOf(profile: GrdProfile): string {
    const photo = profile.avatar;
    const avatar = photo && photo.length > 40 ? `${photo.slice(0, 40)}…` : photo;
    return JSON.stringify({ ...profile, avatar }, null, 2);
  }
}
```

## Build it yourself

`npm run tutorial:eject 194 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: an application made by `ng new` (no router is needed) with the library installed as in 010, and the files `demo-server.ts`, `profile-store.ts`, `app.config.ts` and `app.ts` in `src/app`.
