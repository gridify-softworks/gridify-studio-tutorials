# 102 – The defaults of the controls

This tutorial shows how to set how the controls of a whole application look and behave, in one place: where a field writes what is wrong, when it checks, what shape the check boxes and switches have, what a password field shows. You will learn how to:

- set the starting values for the whole application (`provideGrdControlDefaults`);
- change them while the application runs, and see every control follow at once (`GrdControlDefaults`, `set()`, `reset()`);
- know which value a control takes: its own input first, then the defaults;
- put settings into groups that open and close (`grd-accordion`, `grd-expander`).

The form is a document and the settings are a tool of a docking application, as in 015.

```
npm run tutorial 102
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30102: the form on the left, the settings on the right.

## The words first

- **A default** is what a control does when its own input is not set. The controls of the library ask `GrdControlDefaults` for it.
- **The order**: a control takes the first of these that is set: its own input (`<grd-checkbox shape="square">`), the exception of its kind (`controls.checkbox`), and the default. A default always has a value: the library's, or the one that the application gave.
- **A signal**: every default is a signal, so a change is seen by every control that reads it, at once.

## Step by step

### Step 1: the start of the application

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdControlDefaults } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // How the controls of this application start: every password field shows how strong the
    // password is, and the check boxes are round. A control that sets its own input keeps it.
    provideGrdControlDefaults({ passwordStrength: true, checkboxShape: 'round' }),
  ],
};
```

`provideGrdControlDefaults` replaces the values of the library that this application wants otherwise: here every password field shows how strong the password is, and the check boxes are round. The rest stays as the library has it.

### Step 2: a form that says nothing about its looks

`src/app/signup-form.ts` is the document. Its controls set no message, no shape, no check: they take the defaults.

```ts
import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GrdCheckbox, GrdInput, GrdPassword, GrdSwitch } from '@gridify/studio';

/**
 * A document: a sign-up form. None of its controls says how its message looks, when it checks,
 * or what shape it has: they all take the defaults of the application.
 */
@Component({
  selector: 'app-signup-form',
  imports: [ReactiveFormsModule, GrdCheckbox, GrdInput, GrdPassword, GrdSwitch],
  template: `
    <form [formGroup]="form">
      <grd-input label="Name" formControlName="name" required />
      <grd-input label="E-mail" type="email" formControlName="email" required />
      <grd-password label="Password" formControlName="password" required />
      <grd-switch label="Send me the newsletter" formControlName="newsletter" />
      <grd-checkbox label="I agree with the terms" formControlName="terms" required />
    </form>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 24em;
    }
  `,
})
export class SignupForm {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    newsletter: [false],
    terms: [false, Validators.requiredTrue],
  });
}
```

### Step 3: the settings

`src/app/defaults-tool.ts` is the tool. It reads and sets the defaults:

```ts
import { Component, inject } from '@angular/core';
import {
  GrdAccordion,
  GrdButton,
  type GrdCheckboxShape,
  GrdControlDefaults,
  GrdExpander,
  GrdSwitch,
  type GrdSwitchShape,
  GrdToggleGroup,
  type GrdValidateOn,
} from '@gridify/studio';

/**
 * A tool: the settings of the defaults. Every default is a signal: a change here changes every
 * control of the application at once (those that do not set their own input).
 */
@Component({
  selector: 'app-defaults-tool',
  imports: [GrdAccordion, GrdButton, GrdExpander, GrdSwitch, GrdToggleGroup],
  template: `
    <grd-accordion ariaLabel="Defaults" multiple>
      <grd-expander
        heading="Messages"
        description="Where and how a field says what is wrong"
        [expanded]="true"
      >
        <grd-toggle-group
          label="Place and look"
          [options]="messages"
          [value]="defaults.message()"
          (valueChange)="defaults.message.set($event ?? 'bottom right text')"
        />
        <grd-toggle-group
          label="Check a field"
          [options]="checks"
          [value]="defaults.validateOn()"
          (valueChange)="defaults.validateOn.set($event ?? 'touched')"
        />
      </grd-expander>

      <grd-expander heading="Check boxes and switches" description="Their shapes">
        <grd-toggle-group
          label="Check box"
          [options]="checkboxShapes"
          [value]="defaults.checkboxShape()"
          (valueChange)="defaults.checkboxShape.set($event ?? 'rounded')"
        />
        <grd-toggle-group
          label="Switch"
          [options]="switchShapes"
          [value]="defaults.switchShape()"
          (valueChange)="defaults.switchShape.set($event ?? 'round')"
        />
      </grd-expander>

      <grd-expander heading="Passwords" description="What a password field shows">
        <grd-switch
          label="The eye that shows the password"
          [checked]="defaults.passwordEye()"
          (checkedChange)="defaults.passwordEye.set($event)"
        />
        <grd-switch
          label="How strong the password is"
          [checked]="defaults.passwordStrength()"
          (checkedChange)="defaults.passwordStrength.set($event)"
        />
      </grd-expander>
    </grd-accordion>

    <grd-button label="Back to the start" (pressed)="reset()" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 12px;
    }
  `,
})
export class DefaultsTool {
  /** The defaults of all the controls of the application. */
  protected readonly defaults = inject(GrdControlDefaults);

  protected readonly messages = [
    { value: 'bottom right text', label: 'Under, text' },
    { value: 'bottom left badge', label: 'Under, badge' },
    { value: 'top right badge', label: 'Above, badge' },
  ];
  protected readonly checks: { value: GrdValidateOn; label: string }[] = [
    { value: 'touched', label: 'After leaving it' },
    { value: 'input', label: 'While typing' },
  ];
  protected readonly checkboxShapes: { value: GrdCheckboxShape; label: string }[] = [
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
    { value: 'round', label: 'Round' },
  ];
  protected readonly switchShapes: { value: GrdSwitchShape; label: string }[] = [
    { value: 'round', label: 'Round' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
  ];

  /** Every default goes back to its start: the value of provideGrdControlDefaults, else the library's. */
  protected reset(): void {
    for (const value of [
      this.defaults.message,
      this.defaults.validateOn,
      this.defaults.checkboxShape,
      this.defaults.switchShape,
      this.defaults.passwordEye,
      this.defaults.passwordStrength,
    ]) {
      value.reset();
    }
  }
}
```

- **`inject(GrdControlDefaults)`** gives the defaults; each is a signal with `set()` and `reset()`.
- **`message`** is the place and the look of a message, in words: `bottom right text` (the library's), `top right badge`, `bottom left badge`. Words can come in any order; a missing word comes from the default.
- **`validateOn`** says when a field checks itself: `touched` (after the user leaves it) or `input` (while typing).
- **`checkboxShape`, `switchShape`, `passwordEye`, `passwordStrength`** belong to one kind of control each.
- **`reset()`** takes a default back to its start: the value of `provideGrdControlDefaults`, else the library's. _Back to the start_ does it for all of them.
- **`grd-accordion`** with **`grd-expander`s** groups the settings: each group opens and closes by its header; `multiple` lets several be open.

### Step 4: the layout

`src/app/app.ts` puts the form and the settings into the engine and registers them by their keys, as 015 does.

### Step 5: run it

```
npm run tutorial 102
```

## Try it

1. **The start.** The check box _I agree with the terms_ is round (`provideGrdControlDefaults`). Type `abc` into the password: the meter says _weak_ (`passwordStrength`).
2. **A message.** Type `lukas@` into the e-mail and click into another field: _Enter a valid e-mail address_ under the field, on the right.
3. **Another look.** In _Messages_ choose **Above, badge**: every message of the form moves above its field, as a badge. **Under, badge**: under, on the left.
4. **When to check.** Choose **While typing**, type a letter into _Name_ and delete it: the message comes at once, without leaving the field.
5. **Shapes.** Open _Check boxes and switches_ and choose **Square** for the check box, **Square** for the switch.
6. **Passwords.** Open _Passwords_ and switch the eye off: the password field has no eye any more.
7. **Back to the start.** Everything is as at the start: the check box is round again (the value of `provideGrdControlDefaults`, not the library's `rounded`).

## More

- **One kind only**: `defaults.controls.checkbox.reserveMessageSpace.set(false)` changes the check boxes and leaves the other controls alone (`set(undefined)` takes the exception away).
- **One control only**: its own input wins: `<grd-input message="top right badge" />`.
- **Kept for each user**: the defaults live in memory; an application that wants to keep a choice saves it (`localStorage`, see 125) and sets it again at the start.

## Build it yourself

`npm run tutorial:eject 102 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `signup-form.ts` and `defaults-tool.ts` to `src/app`, and replace `app.config.ts` and `app.ts` with the ones of this tutorial.
