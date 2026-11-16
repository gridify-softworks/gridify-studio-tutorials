# 155 – A whole form

This tutorial shows how to put the controls of 150–154 together into one form with Angular forms: a customer card on three pages that is checked as a whole when it is saved. You will learn how to:

- bind the controls of the library to a reactive form (`formGroup`, `formGroupName`, `formControlName`);
- put the rules on the fields (`required`, `validators`) or into the form (`Validators.minLength`), and see that both are reported the same way;
- check the whole form on Save: every field says what is wrong (`markAllAsTouched()`), and nothing is sent while the form is invalid;
- divide a form into pages (`grd-property-sheet`, `grd-property-page`), count the mistakes on the tab of every page (`badge`) and show the first page with a mistake;
- submit with a button of the form and with Enter (`type="submit"`, `ngSubmit`), and go back to the start (`form.reset()`).

It puts the controls of the series about form controls (150–159) together, and 156 lays such a form out by a file of the Form editor; it is the application of 150 with another page.

```
npm run tutorial 155
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30155 and press **Save** before you type anything.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): the same `src/styles.scss`, a new `src/app/app.ts`.

### Step 1: the form

A reactive form with a group for every page. `NonNullableFormBuilder` makes controls that go back to their first value on `reset()` (not to `null`); the select and the radio group hold `string | null`:

```ts
protected readonly form = this.fb.group({
  person: this.fb.group({
    firstName: '',
    lastName: ['', Validators.minLength(2)],
    email: '',
    phone: '',
  }),
```

`ReactiveFormsModule` goes into the `imports` of `App`.

### Step 2: the controls

Every control of the library is a `ControlValueAccessor`, so `formControlName` binds it like a native input. The rules can stay on the fields, where they are seen with the field (`required`, `[validators]="['email']"`): they are validators of the control as well, so `form.valid` knows them with no `Validators` in the form:

```html
<grd-input label="First name" formControlName="firstName" required />
<grd-input label="Last name" formControlName="lastName" required />
```

<!-- prettier-ignore -->
```html
<grd-input
  label="E-mail"
  type="email"
  formControlName="email"
  [validators]="['email']"
  required
/>
```

A validator of Angular in the form (here `Validators.minLength(2)` of the last name) is shown by the field in the same way, with the text of the library: _Minimum number of characters: 2_. The note has one too, `Validators.maxLength(200)`: _Maximum number of characters: 200_.

### Step 3: pages and group boxes

`grd-property-sheet` shows one page at a time, with a tab for each. `[(selected)]` is the name of the page that is shown, and `equalHeight` keeps the sheet as high as its highest page, so it does not jump when the tab changes. The content of every page is made at once, so the fields of a page that is not shown are still a part of the form:

<!-- prettier-ignore -->
```html
<grd-property-sheet [(selected)]="page" ariaLabel="Customer card" equalHeight>
  <grd-property-page
    name="person"
    label="Person"
    icon="grd:user"
    [badge]="mistakesIn('person')"
  >
    <div class="boxes" formGroupName="person">
      <grd-group-box heading="Name">
```

### Step 4: Save

The form is a native `<form>`, and Save is a button of type `submit`: a click and Enter in a field both send `ngSubmit`:

<!-- prettier-ignore -->
```html
<form class="page" [formGroup]="form" (ngSubmit)="save()">
```

```html
<grd-button type="submit" label="Save" icon="grd:check" variant="primary" />
```

`markAllAsTouched()` makes every field report what is wrong at once, also on the pages that are not shown. While the form is invalid, the first page with a mistake is shown and nothing is saved:

```ts
protected save(): void {
  this.tried.set(true);
  this.form.markAllAsTouched();
  if (this.form.invalid) {
    this.page.set(PAGES.find((name) => this.form.controls[name].invalid) ?? 'person');
    this.verdict.set('Correct the marked fields.');
    return;
  }
  this.saved.set(this.form.getRawValue());
```

### Step 5: the mistakes on the tabs

The badge of a tab counts the controls of its group that are invalid. The status of the form is turned into a signal, so the badges follow every change: a field that is put right takes one off at once:

```ts
private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });
```

```ts
protected mistakesIn(name: PageName): number | null {
  this.status();
  if (!this.tried()) return null;
  const controls = Object.values(this.form.controls[name].controls);
  return controls.filter((control) => control.invalid).length || null;
}
```

### Step 6: Reset and an example

`form.reset()` gives every control its first value and makes it untouched, and the fields forget their messages with it. `setValue` fills the whole form from the code:

```ts
protected reset(): void {
  this.form.reset();
```

## Try it

1. **Press Save.** _Correct the marked fields._ The Person page says why for every field, and the tabs say **Person 3** and **Address 3**.
2. **Type `N` into Last name and press Tab.** _Minimum number of characters: 2_: the validator of Angular.
3. **Fill in the person, with `jana@example` as the e-mail.** The badge goes down to **1**; finish the address and it goes away.
4. **Press Save again.** Now the Address page is shown, the first one with a mistake.
5. **Press Fill in an example, then Save.** _Saved._, and the box at the bottom has the value of the whole form, page by page.
6. **Change the first name and press Enter in the field.** The form is saved again.
7. **Press Reset.** The fields are empty and quiet, and nothing is saved.

## The code

`src/app/app.ts`:

```ts
import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GrdAppHeader,
  GrdButton,
  GrdGroupBox,
  GrdInput,
  GrdMaskInput,
  type GrdOption,
  GrdPropertyPage,
  GrdPropertySheet,
  GrdRadioGroup,
  type GrdRadioOption,
  GrdSelect,
  GrdSwitch,
  GrdTextarea,
} from '@gridify/studio';

/** The pages of the sheet; each is a group of the form with the same name. */
type PageName = 'person' | 'address' | 'preferences';
const PAGES: PageName[] = ['person', 'address', 'preferences'];

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdGroupBox,
    GrdInput,
    GrdMaskInput,
    GrdPropertyPage,
    GrdPropertySheet,
    GrdRadioGroup,
    GrdSelect,
    GrdSwitch,
    GrdTextarea,
    JsonPipe,
    ReactiveFormsModule,
  ],
  template: `
    <grd-app-header
      productName="A whole form"
      subtitle="Angular forms, a property sheet, group boxes, Save and Reset"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <form class="page" [formGroup]="form" (ngSubmit)="save()">
        <p>
          A customer card on three pages. <b>Save</b> checks the whole form: the fields that are
          wrong say why, and the tab of every page with a mistake counts them.
        </p>

        <grd-property-sheet [(selected)]="page" ariaLabel="Customer card" equalHeight>
          <grd-property-page
            name="person"
            label="Person"
            icon="grd:user"
            [badge]="mistakesIn('person')"
          >
            <div class="boxes" formGroupName="person">
              <grd-group-box heading="Name">
                <grd-input label="First name" formControlName="firstName" required />
                <grd-input label="Last name" formControlName="lastName" required />
              </grd-group-box>
              <grd-group-box heading="Contact">
                <grd-input
                  label="E-mail"
                  type="email"
                  formControlName="email"
                  [validators]="['email']"
                  required
                />
                <grd-mask-input
                  label="Phone"
                  startText="+420"
                  mask="999 999 999"
                  ghost
                  formControlName="phone"
                />
              </grd-group-box>
            </div>
          </grd-property-page>

          <grd-property-page
            name="address"
            label="Address"
            icon="grd:document"
            [badge]="mistakesIn('address')"
          >
            <div class="boxes" formGroupName="address">
              <grd-group-box heading="Street and city">
                <grd-input label="Street" formControlName="street" required />
                <grd-input label="City" formControlName="city" required />
              </grd-group-box>
              <grd-group-box heading="Post code and country">
                <grd-mask-input label="Post code" mask="999 99" ghost formControlName="postCode" />
                <grd-select
                  label="Country"
                  placeholder="Choose"
                  [options]="countries"
                  formControlName="country"
                  required
                />
              </grd-group-box>
            </div>
          </grd-property-page>

          <grd-property-page
            name="preferences"
            label="Preferences"
            icon="grd:tool"
            [badge]="mistakesIn('preferences')"
          >
            <div class="boxes" formGroupName="preferences">
              <grd-group-box heading="How to reach the customer">
                <grd-radio-group
                  label="Preferred channel"
                  [options]="channels"
                  formControlName="channel"
                  required
                />
                <grd-switch label="Newsletter" formControlName="newsletter" />
              </grd-group-box>
              <grd-group-box heading="Notes">
                <grd-textarea label="Note" [rows]="5" formControlName="note" />
              </grd-group-box>
            </div>
          </grd-property-page>
        </grd-property-sheet>

        <div class="actions">
          <grd-button type="submit" label="Save" icon="grd:check" variant="primary" />
          <grd-button label="Fill in an example" (pressed)="example()" />
          <grd-button label="Reset" icon="grd:close" (pressed)="reset()" />
          <span aria-live="polite">{{ verdict() }}</span>
        </div>

        <grd-group-box heading="What the code gets">
          <pre class="values">{{ saved() ? (saved() | json) : 'Nothing saved yet.' }}</pre>
        </grd-group-box>
      </form>
    </main>
  `,
})
export class App {
  private readonly fb = inject(NonNullableFormBuilder);

  /**
   * The form. The rules are where they read best: most of them on the fields (required, the e-mail),
   * two as validators of Angular (the lengths of the last name and of the note). The field shows
   * both in the same way.
   */
  protected readonly form = this.fb.group({
    person: this.fb.group({
      firstName: '',
      lastName: ['', Validators.minLength(2)],
      email: '',
      phone: '',
    }),
    address: this.fb.group({
      street: '',
      city: '',
      postCode: '',
      country: this.fb.control<string | null>(null),
    }),
    preferences: this.fb.group({
      channel: this.fb.control<string | null>('email'),
      newsletter: false,
      note: ['', Validators.maxLength(200)],
    }),
  });

  protected readonly countries: GrdOption<string>[] = [
    { value: 'cz', label: 'Czechia' },
    { value: 'sk', label: 'Slovakia' },
    { value: 'at', label: 'Austria' },
    { value: 'de', label: 'Germany' },
  ];
  protected readonly channels: GrdRadioOption[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Phone' },
    { value: 'post', label: 'Post' },
  ];

  protected readonly page = signal<string | null>('person');
  protected readonly verdict = signal('');
  protected readonly saved = signal<unknown>(null);
  private readonly tried = signal(false);

  /** The status of the form as a signal, so the badges follow every change. */
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** The number of fields of a page that are wrong, shown on its tab after the first Save. */
  protected mistakesIn(name: PageName): number | null {
    this.status();
    if (!this.tried()) return null;
    const controls = Object.values(this.form.controls[name].controls);
    return controls.filter((control) => control.invalid).length || null;
  }

  /** Save: every field reports (markAllAsTouched), and the first page with a mistake is shown. */
  protected save(): void {
    this.tried.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.page.set(PAGES.find((name) => this.form.controls[name].invalid) ?? 'person');
      this.verdict.set('Correct the marked fields.');
      return;
    }
    this.saved.set(this.form.getRawValue());
    this.verdict.set('Saved.');
  }

  /** The values of the start (those the form was made with), and no messages. */
  protected reset(): void {
    this.form.reset();
    this.tried.set(false);
    this.saved.set(null);
    this.verdict.set('');
    this.page.set('person');
  }

  protected example(): void {
    this.form.setValue({
      person: { firstName: 'Jana', lastName: 'Nováková', email: 'jana@example.com', phone: '' },
      address: { street: 'Vinohradská 12', city: 'Prague', postCode: '12000', country: 'cz' },
      preferences: { channel: 'email', newsletter: true, note: '' },
    });
  }
}
```

`src/styles.scss`, `src/app/app.config.ts` and `src/main.ts` are the ones of 150.

## How it fits together

- **Two ways for a rule, one look.** A rule of the field (`required`, `validators`, the whole value of a mask) is reported to the Angular control as the error `grd`, so `control.errors`, `control.valid` and `form.valid` know it. An error of a validator of Angular (`required`, `email`, `minlength`, `maxlength`, `pattern`, or one of your own) is shown by the field as its message. Put a rule where it reads best: on the field when it belongs to the field, in the form when it belongs to the data.
- **When a field reports.** A field reports after it was left, or once its control is touched: `markAllAsTouched()` on Save shows everything at once, and `reset()` takes it away.
- **The pages are a look, not a part of the form.** A property page is a place on the screen; the form does not know it. That the groups of the form have the names of the pages is what lets `save()` find the first page with a mistake and `mistakesIn()` count them.
- **One value.** `getRawValue()` is the whole value, page by page: what a real application sends to its server. The value of a select is the value of its option (`cz`), of a mask input the typed characters (`12000`), of a switch `true` or `false`.
- **Signals and forms.** The form lives in its observables; `toSignal(form.statusChanges)` brings its status into the signals of the template, and the badges are drawn again when it changes.

## What you get without writing any of it

- **The connection to Angular forms** of every control, in both directions: the value, the disabled state, the touched state, the rules as validators and the errors as messages.
- **The tabs**: the arrow keys between them, the badges, the icons, a row that scrolls when it is too narrow.
- **Enter submits** from a text field, as in any native form.
- **Accessibility**: the tabs are a `tablist`, the pages `tabpanel`s, a group box a `fieldset`, and every message is linked with its field.
- **The theme and the density**, as in 150.

## Build it from 150

The quick way: `npm run tutorial:eject 155 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand:

1. Make the application of 150 (see [Build it yourself from scratch](../150-text-fields/README.md#build-it-yourself-from-scratch)), or eject 150.
2. Replace `src/app/app.ts` with the code above.
3. Run it:

   ```
   ng serve
   ```
