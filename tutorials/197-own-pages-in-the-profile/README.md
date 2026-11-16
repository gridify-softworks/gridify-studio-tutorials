# 197 – Own pages in the profile

This tutorial adds pages of the application to the profile of the library: a page with fields that the server keeps with the profile (the job title, the department, an out of office), and a page with data of its own (the keys of an API). You will learn how to:

- choose the tabs of the library and their order (`tabs`);
- add pages of the application after them (`pages`), and leave a page out for a user who may not see it;
- write a page that reads the profile and saves into it (`GrdProfileState`), with fields that the library does not know;
- write a page with data of its own, which takes the user from the profile and an input from the application (`inputs`);
- open the profile at a page of the application (`selected`), and give the rest of the application what was saved (`saved`).

It builds on 194 (the user menu, the profile in a window and the store of the profile). There is no router: one page with the header.

```
npm run tutorial 197
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30197, press **Sign in** at the right end of the header and sign in as `eva` with the password `gridify`.

## The words first

- **A page of the profile** is a tab of the window of the profile. The library has four (Profile, Security, Preferences, Notifications). The application chooses which of them it wants (`tabs`) and adds its own after them (`pages`).
- **`GrdProfileState`** is what the pages of the profile share: the profile that the store loaded, the user, and the calls of the store (`save`). The profile gives it to each of its pages, those of the library and those of the application, so a page of the application injects it.
- **The fields of the application** are what the server of the application keeps with the profile and the library does not know: here the job title, the department and the out of office. The store loads and saves them with the others: one profile, one request to load it, one to save a change.
- **Data of its own** belongs to the user but is not the profile: here the keys of an API, which have requests of their own. A service of the application loads and changes it.

## Step by step

### Step 1: a pretend server

`src/app/demo-server.ts` is the one of 190, with a key of its own:

```ts
import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190): the accounts of the library (`eva`, `jan`, `petra`
 * and more, all with the password `gridify`) and the session kept across F5.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-197-session' });
```

### Step 2: the profile of this application

`src/app/team-profile.ts` says what the server keeps of a user: the fields of the library and three of the application.

```ts
/** Out of office: the last day away (an ISO date, `2026-11-20`) and what the others read meanwhile. */
export interface Away {
  readonly until: string;
  readonly message: string;
}

/**
 * The profile as the server of this application keeps it: the fields of the library (`GrdProfile`:
 * the name to show, the e-mail, the telephone number, the photo) and the fields of the application,
 * which the library does not know. The page Work of the profile shows and changes them.
 */
export interface TeamProfile extends GrdProfile {
  /** The job title (`Accountant`); empty: none. */
  readonly jobTitle: string;
  /** The department, by its id (one of `DEPARTMENTS`). */
  readonly department: string;
  /** Out of office, or `null`. */
  readonly away: Away | null;
}

/** What a save sends: only the fields that changed, of the library and of the application. */
export type TeamProfilePatch = Partial<TeamProfile>;
```

The file also has the departments (`DEPARTMENTS`, a value and a label each), the longest job title (`JOB_TITLE_MAX`), and two small helpers (`departmentName`, `today`).

### Step 3: the store

`src/app/profile-store.ts` is the store of 194 with a profile of its own type. It loads the whole profile and saves whatever fields come, those of the library and those of the application:

```ts
/** GET /api/profile: the profile of the signed-in user, with the fields of the application. */
async load(): Promise<TeamProfile> {
  await serverPause();
  return this.profileOf(this.whoAsks());
}

/**
 * PATCH /api/profile with the fields that changed: the Profile tab of the library sends its own
 * (`displayName`, `email`, `phone`), the page Work of the application its own (`jobTitle`,
 * `department`, `away`). The answer is the whole profile as the server has it now, or a refusal.
 */
async save(patch: TeamProfilePatch): Promise<GrdProfileResult<TeamProfile>> {
  await serverPause();
  const account = this.whoAsks();
  // The server checks the fields of the application as it checks the others. (The fields of
  // the page say what they can before a save, but the server decides.)
  const refusal = this.check(patch);
  if (refusal) return refusal;
  const profile: TeamProfile = { ...this.profileOf(account), ...patch };
  profiles.set(account.user.id, profile);
  // The account keeps the name and the e-mail too, so that the next sign-in brings them.
  demoServer.editProfile({ displayName: profile.displayName, email: profile.email });
  return grdProfileOk(profile);
}
```

- **The types.** `load` gives a `TeamProfile` and `save` takes a `TeamProfilePatch`: the store still is a `GrdProfileStore` (`implements GrdProfileStore`), because a `TeamProfile` is a `GrdProfile` with more in it.
- **The rules of the server** for the fields of the application are in `check`. A refusal has a code of the application and a message: `{ status: 'error', code: 'away-message', message: 'Write what the others read while you are away.' }`. The library has no text for such a code; the page shows the message (step 4).
- **`changePassword`** is there too (as in 194), so the profile has the tab Security. There is no `uploadAvatar` and no `sessions`: the Profile tab has no photo, and Security no list of the places. The profile draws what the store can do.

### Step 4: the page Work

`src/app/work-page.ts` is a component like any other. `grd-user-profile` makes it inside itself, so it injects `GrdProfileState`:

```ts
/** What the pages of the profile share: the profile, the user and the calls of the store. */
protected readonly state = inject(GrdProfileState);
```

```ts
/**
 * The profile as the store gave it. The library types it as its own `GrdProfile`; the store of
 * this application gives a `TeamProfile`, with the fields of the application in it.
 */
private readonly profile = computed(() => this.state.profile() as TeamProfile | null);

// What the profile has, field by field. Every save gives a new profile (a save of the Profile tab
// too), but a computed whose value stays the same does not wake what reads it: the fields of the
// form below follow a field of the profile only when that field changed.
private readonly savedJobTitle = computed(() => this.profile()?.jobTitle ?? '');
private readonly savedDepartment = computed(() => this.profile()?.department ?? null);
private readonly savedAway = computed(() => this.profile()?.away ?? null, { equal: sameAway });

// The fields of the form. Each one starts from the profile and keeps what the user types; when
// its field of the profile changes (a save of this page), it takes the new value.
protected readonly jobTitle = linkedSignal(() => this.savedJobTitle());
protected readonly department = linkedSignal(() => this.savedDepartment());
protected readonly away = linkedSignal(() => this.savedAway() !== null);
protected readonly until = linkedSignal(() => this.savedAway()?.until ?? today());
protected readonly message = linkedSignal(() => this.savedAway()?.message ?? '');
```

A save sends only what differs from the profile, through the profile:

```ts
/**
 * Save: the patch goes to `save` of the store as it is, with the fields of the application. The
 * answer of the store is then the profile of every page (and `saved` of the window gets it).
 * The call never throws: a refusal, or a store that failed, is `{ status: 'error' }`.
 */
protected async save(event: Event): Promise<void> {
  event.preventDefault();
  if (!this.dirty() || this.state.busy()) return;
  this.saving.set(true);
  this.saved.set(false);
  this.error.set('');
  const result = await this.state.save(this.patch());
  this.saving.set(false);
  if (result.status === 'ok') this.saved.set(true);
  else this.error.set(failureText(result));
}
```

- **`state.profile()`** is the profile as the store gave it, the fields of the application with it. The pages are drawn only while the profile is loaded, so a page always has one.
- **A computed for each field** (`savedJobTitle` and the others) is what keeps the typing. A `linkedSignal` takes its computation again whenever something that it reads changes: reading the profile itself, every save of the Profile tab (a new profile with the same job title) would put the saved job title back over what the user typed here. A computed of one field keeps its value while that field stays the same, so it wakes the form field only when the field changed.
- **`state.save(patch)`** passes the patch to `save` of the store as it is, and takes the answer as the profile: every page has the new values then, the window calls `saved` (step 6), and a new name or e-mail goes into the session (the header shows it). Only the name, the e-mail and the photo go there; the fields of the application stay in the profile.
- **`state.busy()`** is true while a call of the store is on its way, from this page or another one: the fields and the buttons wait.
- **A refusal** has the code and the message of the store. `failureText` (at the end of the file) shows the message, and says `network` and `forbidden` (a store that threw) in its own words.

The template is a form of the library's controls (`grd-input`, `grd-select`, `grd-switch`, `grd-date-picker`, `grd-textarea`, `grd-button`), in two sections with a heading each. The styles are those of the pages of the library, so the page looks like one of them:

```css
/* The look of the pages of the library: a column of sections, as wide as they are at most. */
:host {
  display: block;
  max-inline-size: var(--grd-profile-max-width, 38em);
  color: var(--grd-text-active);
}
```

### Step 5: the keys of the API

The keys are not the profile: they have requests of their own. `src/app/api-keys.ts` is a service of the application with three of them, played in the browser like the store (`GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/{id}`). A new key comes with its secret, the only answer that has it.

`src/app/keys-page.ts` is the page. It takes from the profile only the user, and from the application an input:

```ts
/** The most keys that a user may have: the application gives it (`inputs` of the page). */
readonly limit = input(3);

private readonly state = inject(GrdProfileState);
private readonly api = inject(ApiKeys);

/** Whose keys they are: the user of the profile. */
protected readonly owner = computed(() => {
  const user = this.state.user();
  return user ? grdUserName(user) : '';
});
```

```ts
constructor() {
  // The page is made when its tab is shown the first time, for the user of the profile (for
  // another user the profile makes its pages again), so it loads the keys once, here.
  void this.load();
}
```

The rest of the page is a list of the keys with **Revoke**, the secret of the key that was just made with **Copy**, and a form for a new key, closed while the user has `limit` keys.

### Step 6: the profile with the pages

`src/app/app.ts` opens the profile with the tabs of the library that it wants and its own pages:

```ts
/**
 * The pages of the application in the profile, after the tabs of the library. Work is for
 * everybody. API keys only for who may use the API (here an administrator or an editor): a page
 * that the user may not see is not in the list. `inputs` are the inputs of the component.
 */
private readonly pages = computed<GrdPropertyPageDef[]>(() => [
  { name: 'work', label: 'Work', component: WorkPage },
  ...(this.auth.hasRole('admin') || this.auth.hasRole('editor')
    ? [{ name: 'keys', label: 'API keys', component: KeysPage, inputs: { limit: KEYS_MAX } }]
    : []),
]);
```

```ts
/** Opens the profile in a window at the tab `tab`, at the first one without it. */
protected openProfile(tab?: string): void {
  this.profile.open({
    // The tabs of the library, in this order. Preferences are not here (the appearance is in
    // the header), nor Notifications (this application sends none).
    tabs: 'profile security',
    // The pages of the application, after them.
    pages: this.pages(),
    // The tab to show first: the name of a tab of the library or of a page of the application.
    selected: tab,
    // A little taller than the 46em of the library: the page Work with an absence fits.
    height: '52em',
    // Every save, of a tab of the library or of a page of the application: the whole profile
    // as the store answered it, with the fields of the application.
    saved: (profile) => this.took(profile as TeamProfile),
  });
}
```

- **`tabs`** chooses the tabs of the library and their order: a word (`'profile security'`) or a list. The pages of the application come after them, in the order of `pages`.
- **A page** is a tab of the property sheet (`GrdPropertyPageDef`): `name` (what `selected` takes), `label`, `component` and its `inputs`. It can also have an `icon`, a `badge`, a `tooltip`, and be `disabled` or `hidden`.
- **`selected`** opens the window at a tab, of the library or of the application. The menu of the user has a command for it, and so does the page:

  ```ts
  /** A command of the application in the user menu: it opens the profile at the page Work. */
  protected readonly items: GrdMenuItem[] = [
    { label: 'Out of office…', run: () => this.openProfile('work') },
  ];
  ```

- **`saved`** is called with every save, of any tab. The page of the application keeps the profile in `me` and shows it (the card of the user); it loads it with the store when the user signs in, and takes it from `saved` after that. The log under _What was saved_ says which fields each save changed.

`src/app/app.config.ts` gives the profile its store, as in 194:

```ts
// The store of the profile, as in 194: here with the fields of this application.
provideGrdProfileStore(() => inject(TeamProfileStore)),
```

### Step 7: run it

```
npm run tutorial 197
```

## Try it

1. **Signing in.** Sign in as `eva`: the card has _Head of finance · Finance_ and _At work._
2. **The tabs.** Press **Out of office…** (on the page, or in the menu of the user): the window opens at **Work**. The tabs are _Profile_ and _Security_ of the library, then _Work_ and _API keys_ of the application. There are no _Preferences_ and no _Notifications_ (`tabs`).
3. **A refusal of the server.** Turn on **I am away** and press **Save** without a message: _Write what the others read while you are away._ The server refused with a code of the application (`away-message`), and the page shows its message.
4. **A save.** Write a message, change the job title and press **Save**: _Saved._ The card shows the new job title and _Out of office until …_ at once, and _What was saved_ has `jobTitle, away`.
5. **Another tab.** On **Work**, change the job title again but do not save. On **Profile**, change the name and press **Save**: the header and the card have the new name, and the log has `displayName`. Back on **Work**, the job title that you typed is still there: a save of another tab does not touch it.
6. **The keys.** On **API keys**, type `Nightly export` and press **Make the key**: its secret is shown once, with **Copy**, and the list has the key. Make two more: _You have 3 keys, the most there may be._ **Revoke** one, and the form is open again.
7. **Another user.** Close the window and sign out (the menu of the user). Sign in as `petra`: the window has no **API keys** (a viewer may not use the API), and her own work (_Sales assistant · Sales_).
8. **F5.** The session stays (as in 190). The profiles and the keys are as they were at the start: the pretend server lives in the memory of the page.

## With a real server

- **The store** calls the server with `HttpClient`, as in 194. The server keeps the fields of the application in the record of the user, gives them with `GET /api/profile` and takes them with `PATCH /api/profile`. Its own rules answer with a code and a message, which the store passes on (`firstValueFrom` is from `rxjs`, `HttpErrorResponse` from `@angular/common/http`):

  ```ts
  async save(patch: TeamProfilePatch): Promise<GrdProfileResult<TeamProfile>> {
    try {
      const profile = await firstValueFrom(this.http.patch<TeamProfile>('/api/profile', patch));
      return grdProfileOk(profile);
    } catch (error) {
      // 422 with { code, message }: a rule of the server; the page shows the message.
      const body = error instanceof HttpErrorResponse ? error.error : null;
      if (typeof body?.code === 'string') {
        return { status: 'error', code: body.code, message: body.message };
      }
      // Anything else: the profile makes "network" or "forbidden" of it.
      throw error;
    }
  }
  ```

- **The keys** are requests of their own (`GET /api/keys`, `POST /api/keys`, `DELETE /api/keys/{id}`), made by the service with `HttpClient`. The server keeps only a hash of a key, so the secret is in the one answer that makes it.
- **Who may use the API** is better a permission than a role: with the permissions of 191 the list of the pages asks `auth.can('api-keys')`.

## More

- **The profile on a page** instead of a window: `<grd-user-profile tabs="profile security" [pages]="pages()" [(selected)]="tab" (saved)="took($event)" />` on a route of its own. The pages are the same.
- **Only the pages of the application:** `tabs: []` draws no tab of the library.
- **A mark on a tab:** `badge` (a number or a short text), `icon` and `tooltip` of the page.
- **The width of the pages:** `--grd-profile-max-width` (38em) is the widest a page of the library is. A page of the application that reads it (step 4) follows it too.

## The code

`src/app/work-page.ts`:

```ts
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
  GrdButton,
  GrdDatePicker,
  GrdInput,
  type GrdProfileFailure,
  GrdProfileState,
  GrdSelect,
  GrdSwitch,
  GrdTextarea,
} from '@gridify/studio';
import {
  type Away,
  DEPARTMENTS,
  JOB_TITLE_MAX,
  type TeamProfile,
  type TeamProfilePatch,
  today,
} from './team-profile';

/**
 * A page of the application in the profile: the work of the user (the job title, the department)
 * and the out of office. The server keeps these fields with the profile, so the page reads them
 * from the profile and saves them through it: `GrdProfileState`, which `grd-user-profile` gives to
 * all its pages, those of the library and those of the application.
 */
@Component({
  selector: 'app-work-page',
  imports: [GrdButton, GrdDatePicker, GrdInput, GrdSelect, GrdSwitch, GrdTextarea],
  template: `
    <form novalidate (submit)="save($event)">
      <section class="section">
        <h3 class="heading">Your work</h3>
        <div class="columns">
          <grd-input
            label="Job title"
            [maxlength]="max"
            [disabled]="state.busy()"
            [(value)]="jobTitle"
          />
          <grd-select
            label="Department"
            [options]="departments"
            [disabled]="state.busy()"
            [(value)]="department"
          />
        </div>
      </section>

      <section class="section">
        <h3 class="heading">Out of office</h3>
        <grd-switch label="I am away" [disabled]="state.busy()" [(checked)]="away" />
        @if (away()) {
          <div class="columns">
            <grd-date-picker
              label="The last day away"
              required
              [min]="firstDay"
              [disabled]="state.busy()"
              [(value)]="until"
            />
          </div>
          <grd-textarea
            label="What the others read meanwhile"
            required
            [rows]="3"
            [disabled]="state.busy()"
            [(value)]="message"
          />
        }
      </section>

      <div class="actions">
        <grd-button
          type="submit"
          label="Save"
          variant="primary"
          [busy]="saving()"
          [disabled]="!dirty() || state.busy()"
        />
        <grd-button
          label="Revert"
          appearance="flat"
          [disabled]="!dirty() || state.busy()"
          (pressed)="revert()"
        />
        <span class="status" role="status">{{ statusText() }}</span>
      </div>
      @if (error(); as text) {
        <p class="error" role="alert">{{ text }}</p>
      }
    </form>
  `,
  styles: `
    /* The look of the pages of the library: a column of sections, as wide as they are at most. */
    :host {
      display: block;
      max-inline-size: var(--grd-profile-max-width, 38em);
      color: var(--grd-text-active);
    }
    form {
      display: grid;
      gap: 16px;
    }
    .section {
      display: grid;
      gap: 8px;
    }
    .section + .section {
      padding-block-start: 14px;
      border-block-start: 1px solid var(--grd-border-color);
    }
    .heading {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(15em, 100%), 1fr));
      column-gap: 16px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status {
      opacity: 0.88;
    }
    .error {
      margin: 0;
      color: var(--grd-danger-text);
      font-weight: 600;
    }
  `,
})
export class WorkPage {
  /** What the pages of the profile share: the profile, the user and the calls of the store. */
  protected readonly state = inject(GrdProfileState);
  protected readonly departments = DEPARTMENTS;
  protected readonly max = JOB_TITLE_MAX;
  /** The first day that may be the last day away. */
  protected readonly firstDay = today();

  /**
   * The profile as the store gave it. The library types it as its own `GrdProfile`; the store of
   * this application gives a `TeamProfile`, with the fields of the application in it.
   */
  private readonly profile = computed(() => this.state.profile() as TeamProfile | null);

  // What the profile has, field by field. Every save gives a new profile (a save of the Profile tab
  // too), but a computed whose value stays the same does not wake what reads it: the fields of the
  // form below follow a field of the profile only when that field changed.
  private readonly savedJobTitle = computed(() => this.profile()?.jobTitle ?? '');
  private readonly savedDepartment = computed(() => this.profile()?.department ?? null);
  private readonly savedAway = computed(() => this.profile()?.away ?? null, { equal: sameAway });

  // The fields of the form. Each one starts from the profile and keeps what the user types; when
  // its field of the profile changes (a save of this page), it takes the new value.
  protected readonly jobTitle = linkedSignal(() => this.savedJobTitle());
  protected readonly department = linkedSignal(() => this.savedDepartment());
  protected readonly away = linkedSignal(() => this.savedAway() !== null);
  protected readonly until = linkedSignal(() => this.savedAway()?.until ?? today());
  protected readonly message = linkedSignal(() => this.savedAway()?.message ?? '');

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal('');

  /** What a save sends: the fields that differ from the profile, and nothing else. */
  private readonly patch = computed<TeamProfilePatch>(() => {
    const profile = this.profile();
    if (!profile) return {};
    const jobTitle = this.jobTitle().trim();
    const department = this.department() ?? profile.department;
    const away: Away | null = this.away()
      ? { until: this.until(), message: this.message().trim() }
      : null;
    return {
      ...(jobTitle !== profile.jobTitle ? { jobTitle } : {}),
      ...(department !== profile.department ? { department } : {}),
      ...(!sameAway(away, profile.away) ? { away } : {}),
    };
  });

  protected readonly dirty = computed(() => Object.keys(this.patch()).length > 0);

  protected readonly statusText = computed(() => {
    if (this.saving()) return 'Saving…';
    if (this.dirty()) return 'Not saved yet.';
    return this.saved() ? 'Saved.' : '';
  });

  /**
   * Save: the patch goes to `save` of the store as it is, with the fields of the application. The
   * answer of the store is then the profile of every page (and `saved` of the window gets it).
   * The call never throws: a refusal, or a store that failed, is `{ status: 'error' }`.
   */
  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.dirty() || this.state.busy()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    const result = await this.state.save(this.patch());
    this.saving.set(false);
    if (result.status === 'ok') this.saved.set(true);
    else this.error.set(failureText(result));
  }

  /** Revert: the fields as the profile has them. */
  protected revert(): void {
    const profile = this.profile();
    if (!profile) return;
    this.jobTitle.set(profile.jobTitle);
    this.department.set(profile.department);
    this.away.set(profile.away != null);
    this.until.set(profile.away?.until ?? today());
    this.message.set(profile.away?.message ?? '');
    this.error.set('');
  }
}

/** Are two absences the same? */
function sameAway(a: Away | null, b: Away | null): boolean {
  if (a === null || b === null) return a === b;
  return a.until === b.until && a.message === b.message;
}

/**
 * What a refusal says to the user. The codes of this application come with a message of the
 * server. The library has texts for its own codes, but they are its own: the page says the ones it
 * can get (a store that throws gives `network` or `forbidden`) in its own words.
 */
function failureText(failure: GrdProfileFailure): string {
  if (failure.code === 'network') return 'The server cannot be reached. Try it again.';
  if (failure.code === 'forbidden') return 'The server did not let you. Sign in again.';
  return failure.message ?? 'Something went wrong.';
}
```

## Build it yourself

`npm run tutorial:eject 197 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: an application made by `ng new` (no router is needed) with the library installed as in 010, and the files `demo-server.ts`, `team-profile.ts`, `profile-store.ts`, `work-page.ts`, `api-keys.ts`, `keys-page.ts`, `app.config.ts` and `app.ts` in `src/app`.
