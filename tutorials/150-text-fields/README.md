# 150 – Text fields

This tutorial shows how to put text fields on a page and check what the user types into them. You will learn how to:

- bind a field to a signal (`grd-input`, `[(value)]`) and give it a label and a hint;
- check a value with the rules of the library (`required`, `[validators]="['email']"`) and with a rule of your own (`GrdValidators.pattern`);
- ask for a new password with its requirements and a strength bar (`grd-password`, `policy`);
- add parts to a field: a text before the value, a clear cross, a button (`startText`, `clearable`, `grd-input-button`);
- take a text of several lines (`grd-textarea`), and check or clear all the fields at once (`validate()`, `reset()`).

A series about form controls starts here (150–159), one kind of control at a time, each in group boxes (`grd-group-box`). There is no docking engine: a header and a page. The application starts from an empty `ng new`.

```
npm run tutorial 150
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30150, type something that is not an e-mail address into **E-mail** and press Tab. Then press **Check**.

## Step by step

An empty `ng new` with the library (see [Build it yourself from scratch](#build-it-yourself-from-scratch)).

### Step 1: a header and a page

`src/styles.scss` loads the styles of the library and lays out the page: the header at the top, under it a page that scrolls, and the group boxes side by side while there is room for them:

```scss
.boxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22em), 1fr));
  gap: 16px;
  align-items: start;
}
```

The other tutorials of the series take this file as it is. The header of `App` names the application and has the selects of the theme and the density:

```html
<grd-app-header
  productName="Text fields"
  subtitle="input, password and text area"
  icon="grd:logo"
  preferences="theme density"
/>
```

### Step 2: fields in group boxes

A group box is a frame with a title around the fields that belong together. A field is bound to a signal of the page with `[(value)]`, so the signal always holds what is typed:

```html
<grd-group-box heading="Account" icon="grd:user">
  <grd-input label="Name" hint="As it stands on your ID" [(value)]="name" required />
  <grd-input
    label="E-mail"
    type="email"
    [(value)]="email"
    [validators]="['email']"
    required
    clearable
  />
  <grd-password
    label="Password"
    autocomplete="new-password"
    [(value)]="password"
    [policy]="policy"
    strength
    showRules
    required
  />
</grd-group-box>
```

```ts
protected readonly name = signal('');
protected readonly email = signal('');
protected readonly password = signal('');
```

### Step 3: rules

`required` puts a star after the label and adds the rule "has to be filled in". `validators` takes the names of the rules of the library: `email` here, and `url`, `hostname`, `iban`, `phone`, `integer` and others (the list is in the README of `grd-common`). A rule of your own is a function; `GrdValidators.pattern` makes one from a regular expression and the text of its message:

```ts
const COUPON = GrdValidators.pattern(/^[A-Z]{4}-\d{4}$/, {
  message: 'Four capitals, a hyphen and four digits, such as SAVE-2026',
});
```

```ts
protected readonly couponRules = [COUPON];
```

A field says nothing while the user types it for the first time. When it is left, it checks its value and from then on it checks every change: the frame turns red or green, a mark stands at its end, and the message replaces the hint.

### Step 4: a password

`grd-password` hides the text and has an eye that shows it. `policy` says what the password has to contain; every requirement is a rule of the field and, with `showRules`, a line of the list under it that is ticked off as the user types. `strength` adds the bar, and `autocomplete="new-password"` tells the password manager of the browser that this is a new password:

```ts
protected readonly policy: GrdPasswordPolicy = { minLength: 8, upper: true, digit: true };
```

### Step 5: parts of a field

`startText` stands in the frame before the value and is not a part of it: the field holds `example.com`, and the page adds `https://` itself. `clearable` adds the cross that empties the field (Esc does the same). A `grd-input-button` with `place="after"` is a button joined to the field (`joined` on the field):

```html
<grd-input
  label="Website"
  startText="https://"
  [(value)]="website"
  [validators]="['hostname']"
  clearable
/>
<grd-input label="Coupon" [(value)]="coupon" [validators]="couponRules" joined>
  <grd-input-button place="after" (pressed)="generate()">Generate</grd-input-button>
</grd-input>
```

### Step 6: a text area

`grd-textarea` takes several lines. `rows` is its height, `maxlength` the most characters; the hint counts them:

```html
<grd-textarea
  label="Message"
  [hint]="message().length + ' of 200 characters'"
  [rows]="4"
  [maxlength]="200"
  [(value)]="message"
/>
```

### Step 7: Check and Clear

The page reaches the fields with `viewChildren` and `viewChild`. `validate()` checks a field as if it had been left (so `required` reports an empty one), `invalid()` says how it came out, and `reset()` makes the field forget that it was checked:

```ts
protected check(): void {
  const fields = [...this.inputs(), this.passwordField(), this.messageField()];
  for (const field of fields) field.validate();
  const wrong = fields.filter((field) => field.invalid()).length;
```

```html
<grd-button label="Check" icon="grd:check" variant="primary" (pressed)="check()" />
<grd-button label="Clear" icon="grd:close" (pressed)="clear()" />
```

The box at the bottom shows the values as the page would send them.

## Try it

1. **Type `jan@` into E-mail and press Tab.** The frame turns red and the message says _Enter a valid e-mail address_. Finish the address: the frame turns green at once, because the field was left once already.
2. **Press Check.** _Fields to correct: 2_: the empty Name and Password report that they are required.
3. **Type a password.** The lines of the list are ticked off one by one, and the bar says how strong the password is. The eye shows it.
4. **Type `example.com` into Website.** The box at the bottom shows `https://example.com`.
5. **Press Generate**, then type `abc` into Coupon and press Tab: the message of the rule of the application.
6. **Type into Message.** The hint counts the characters, and the field takes no more than 200.
7. **Press Clear.** The fields are empty, and none of them is red any more.
8. **Switch the theme and the density in the header.**

## The code

`src/app/app.ts`:

```ts
import { JsonPipe } from '@angular/common';
import { Component, computed, signal, viewChild, viewChildren } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGroupBox,
  GrdInput,
  GrdInputButton,
  GrdPassword,
  type GrdPasswordPolicy,
  GrdTextarea,
  GrdValidators,
} from '@gridify/studio';

/** A rule of the application, written as a function: four capitals, a hyphen and four digits. */
const COUPON = GrdValidators.pattern(/^[A-Z]{4}-\d{4}$/, {
  message: 'Four capitals, a hyphen and four digits, such as SAVE-2026',
});

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdGroupBox,
    GrdInput,
    GrdInputButton,
    GrdPassword,
    GrdTextarea,
    JsonPipe,
  ],
  template: `
    <grd-app-header
      productName="Text fields"
      subtitle="input, password and text area"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          Type into the fields and leave them with Tab: a field checks its value when it is left,
          and then on every change. <b>Check</b> checks them all at once, <b>Clear</b> empties them.
        </p>

        <div class="boxes">
          <grd-group-box heading="Account" icon="grd:user">
            <grd-input label="Name" hint="As it stands on your ID" [(value)]="name" required />
            <grd-input
              label="E-mail"
              type="email"
              [(value)]="email"
              [validators]="['email']"
              required
              clearable
            />
            <grd-password
              label="Password"
              autocomplete="new-password"
              [(value)]="password"
              [policy]="policy"
              strength
              showRules
              required
            />
          </grd-group-box>

          <grd-group-box heading="Web and coupon" icon="grd:document">
            <grd-input
              label="Website"
              startText="https://"
              [(value)]="website"
              [validators]="['hostname']"
              clearable
            />
            <grd-input label="Coupon" [(value)]="coupon" [validators]="couponRules" joined>
              <grd-input-button place="after" (pressed)="generate()">Generate</grd-input-button>
            </grd-input>
            <grd-textarea
              label="Message"
              [hint]="message().length + ' of 200 characters'"
              [rows]="4"
              [maxlength]="200"
              [(value)]="message"
            />
          </grd-group-box>
        </div>

        <div class="actions">
          <grd-button label="Check" icon="grd:check" variant="primary" (pressed)="check()" />
          <grd-button label="Clear" icon="grd:close" (pressed)="clear()" />
          <span aria-live="polite">{{ verdict() }}</span>
        </div>

        <grd-group-box heading="What the code gets">
          <pre class="values">{{ values() | json }}</pre>
        </grd-group-box>
      </div>
    </main>
  `,
})
export class App {
  // Every field is a signal of the page, bound two-way with [(value)].
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly website = signal('');
  protected readonly coupon = signal('');
  protected readonly message = signal('');

  /** What the password has to contain: each requirement is a rule of the field and a line of its list. */
  protected readonly policy: GrdPasswordPolicy = { minLength: 8, upper: true, digit: true };
  protected readonly couponRules = [COUPON];
  protected readonly verdict = signal('');

  /** The values as the page would send them (the password only as dots). */
  protected readonly values = computed(() => ({
    name: this.name(),
    email: this.email(),
    password: '•'.repeat(this.password().length),
    website: this.website() ? `https://${this.website()}` : '',
    coupon: this.coupon(),
    message: this.message(),
  }));

  // The fields themselves, for validate() and reset().
  private readonly inputs = viewChildren(GrdInput);
  private readonly passwordField = viewChild.required(GrdPassword);
  private readonly messageField = viewChild.required(GrdTextarea);

  /** Checks every field as if it had been left, and counts those that report a problem. */
  protected check(): void {
    const fields = [...this.inputs(), this.passwordField(), this.messageField()];
    for (const field of fields) field.validate();
    const wrong = fields.filter((field) => field.invalid()).length;
    this.verdict.set(
      wrong === 0 ? 'Everything is filled in correctly.' : `Fields to correct: ${wrong}`,
    );
  }

  /** Empties the values, and makes the fields forget that they were checked. */
  protected clear(): void {
    const values = [this.name, this.email, this.password, this.website, this.coupon, this.message];
    for (const value of values) value.set('');
    for (const field of [...this.inputs(), this.passwordField(), this.messageField()]) {
      field.reset();
    }
    this.verdict.set('');
  }

  /** The button in the coupon field writes a new code. */
  protected generate(): void {
    const letters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join('');
    const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.coupon.set(`${letters}-${digits}`);
  }
}
```

`src/styles.scss`:

```scss
/* The themes, the density of the controls and the text styles of Gridify. */
@use '@gridify/studio/styles';

/* Without a docking engine nothing paints the page: the body takes the background and the text color of the theme. */
html,
body {
  height: 100%;
  margin: 0;
  font-family: var(--grd-font-main);
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}

/* The page under the header: it scrolls, the header stays. */
app-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}
main {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px 24px;
}
.page {
  display: grid;
  gap: 16px;
  max-width: 64em;
  margin: 0 auto;
}
.page > p {
  margin: 0;
  max-width: 75ch;
  line-height: 1.45;
}

/* The group boxes side by side while there is room for them, one under another on a narrow screen. */
.boxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22em), 1fr));
  gap: 16px;
  align-items: start;
}

/* A row of buttons. */
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* What the code gets from the fields. */
.values {
  margin: 0;
  font-family: var(--grd-font-mono);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
```

`src/app/app.config.ts` is the one of `ng new` without the router: `provideBrowserGlobalErrorListeners()`.

## How it fits together

- **The value is yours.** A field holds no value of its own that the page has to read: `[(value)]` keeps a signal of the page up to date, and the page sets the signal to change the field (`clear()` does). The fields work with Angular forms as well (`ngModel`, `formControl`); 155 puts a whole form together that way.
- **A rule is a function of the text.** A rule gets the text and says whether it is right and why not. An empty text passes every rule except `required`, so "optional, but right when it is filled in" needs nothing more (Website). The names in `validators` are the rules that the library registers; an application registers its own under a name with `GrdValidation.register` and then uses the name anywhere.
- **When a field reports.** Not while the user types for the first time (`validateOn="touched"`, the default), but when the field is left, and then on every change. `validateOn="input"` reports while typing. `validate()` checks at once, `reset()` forgets it.
- **The message has a place.** The hint and the message share the line under the field, which is kept free, so a message does not push the fields below it. `message` moves it (`top left badge`, …), and the defaults of the application are `GrdControlDefaults`.
- **The group box** is a `fieldset` with a `legend`: a screen reader reads its title as the name of the group. Its content is a grid of one column. A field keeps a line under it for its message, and that line parts it from the next field, so the box puts no gap between them (`gap` is `auto`, the default `groupBoxGap`; `gap="8px"` would give one).

## What you get without writing any of it

- **The validation look**: the red or green frame, the mark at the end, the message in place of the hint, and the texts of the library rules in the language of the application.
- **The password**: the eye, the warning while Caps Lock is on, the strength bar and the list of requirements, and `autocomplete` for the password manager of the browser.
- **The clear cross** and Esc, which empty a field, and the grip of the text area that makes it taller.
- **Accessibility**: the label is linked with the field, `aria-invalid`, `aria-required` and `aria-describedby` point at the message, which a screen reader reads when it changes.
- **The theme and the density**: every field, box and button follows the selects in the header, in light and dark.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new text-fields --style=scss --ssr=false --skip-tests
   cd text-fields
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as above.

5. Replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
