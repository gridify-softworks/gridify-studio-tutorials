# 050 – The router, no docking engine

This tutorial shows how to use the components of the library without a docking engine, in an ordinary Angular application with the router. You will learn how to:

- build the pages of the routes from the components of the library: a header, a toolbar with a button for each page, a table (`grd-grid`) and a form;
- check an e-mail address while it is typed, and show a toast;
- keep the router, its links, Back and Forward working as in any Angular application.

The table of countries is at `/table`, the form of a customer card at `/form`. Each component of the library is a standalone Angular component and does not need the engine. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 050
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30050: the address becomes http://localhost:30050/table. Press **Form** in the toolbar, type something that is not an e-mail address into **E-mail**, press **Register**, then the Back button of the browser, and reload the page.

## The code

`src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // The address of the application alone shows the table.
  { path: '', pathMatch: 'full', redirectTo: 'table' },
  // Each page is a chunk of its own: the router loads it the first time its route is visited.
  { path: 'table', loadComponent: () => import('./table-page').then((m) => m.TablePage) },
  { path: 'form', loadComponent: () => import('./form-page').then((m) => m.FormPage) },
  // An address that names no page leads to the table too.
  { path: '**', redirectTo: 'table' },
];
```

`src/app/app.config.ts` is the one that `ng new` makes:

```ts
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes)],
};
```

`src/app/app.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdRibbonActionEvent, GrdToolbar, GrdToolbarItem } from '@gridify/studio';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdToolbar, RouterOutlet],
  template: `
    <grd-app-header
      productName="Router"
      subtitle="Angular router, no docking engine"
      preferences="theme density"
    />
    <grd-toolbar [items]="items" ariaLabel="Pages" (action)="go($event)" />
    <main>
      <!-- the router puts the page of the route here -->
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-toolbar {
      border-bottom: 1px solid var(--grd-border-color);
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class App {
  private readonly router = inject(Router);

  /** The URL of the page that is shown (`/table`, `/form`), after the redirects. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  /** A button for each page, pressed while its page is shown, and the URL at the right end. */
  protected readonly items: GrdToolbarItem[] = [
    {
      type: 'toggle-button',
      label: 'Table',
      action: '/table',
      checked: computed(() => this.url().startsWith('/table')),
    },
    {
      type: 'toggle-button',
      label: 'Form',
      action: '/form',
      checked: computed(() => this.url().startsWith('/form')),
    },
    { type: 'label', label: computed(() => `Route: ${this.url()}`), end: true },
  ];

  /** A button of the toolbar: its action is the URL of its page. */
  protected go(event: GrdRibbonActionEvent): void {
    if (event.item.action) this.router.navigateByUrl(event.item.action);
  }
}
```

`src/app/table-page.ts` (without its styles):

```ts
@Component({
  selector: 'app-table-page',
  imports: [GrdGrid, RouterLink],
  template: `
    <h1>Countries</h1>
    <p>
      A <code>grd-grid</code> on the page <code>/table</code>. Click the title of a column to sort
      by it.
    </p>
    <a routerLink="/form">Register a customer card →</a>
    <grd-grid [columns]="columns" [dataSource]="source" ariaLabel="Countries" />
  `,
})
export class TablePage {
  protected readonly columns: GrdGridColumnDef<Country>[] = [
    { field: 'country', header: 'Country', sortable: true },
    { field: 'capital', header: 'Capital', sortable: true },
    { field: 'continent', header: 'Continent', sortable: true },
    {
      field: 'population',
      header: 'Population',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 0 },
    },
    {
      field: 'area',
      header: 'Area (km²)',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 0 },
    },
  ];

  /** The rows; `tkx` gives the grid the texts of the library (the empty table, the filters). */
  protected readonly source = new GrdGridArrayDataSource<Country>(COUNTRIES, {
    getRowId: (row) => row.code,
    i18n: { text: tkx },
  });
}
```

`src/app/form-page.ts` (without its styles):

```ts
@Component({
  selector: 'app-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GrdInput,
    GrdDatePicker,
    GrdSelect,
    GrdCheckbox,
    GrdButton,
  ],
  template: `
    <h1>Customer card</h1>
    <p>A form of library fields on the page <code>/form</code>.</p>
    <form [formGroup]="form" (ngSubmit)="clicked('Register')">
      <grd-input
        label="First name"
        formControlName="firstName"
        required
        autocomplete="given-name"
      />
      <grd-input label="Last name" formControlName="lastName" required autocomplete="family-name" />
      <!-- validateOn="input": the e-mail is checked while it is typed, not only after the field is left -->
      <grd-input
        label="E-mail"
        type="email"
        formControlName="email"
        required
        validateOn="input"
        autocomplete="email"
        hint="The card is sent to this address."
      />
      <grd-input label="Phone" type="tel" formControlName="phone" autocomplete="tel" />
      <grd-date-picker label="Date of birth" formControlName="birthDate" />
      <grd-select label="Card" formControlName="card" [options]="cards" />
      <grd-checkbox class="wide" label="Send me news and offers" formControlName="newsletter" />
      <grd-checkbox
        class="wide"
        label="I agree with the terms of the card"
        formControlName="terms"
      />
      <div class="buttons wide">
        <grd-button type="submit" variant="primary" label="Register" />
        <grd-button label="Cancel" (pressed)="clicked('Cancel')" />
      </div>
    </form>
    <a routerLink="/table">← Back to the table</a>
  `,
})
export class FormPage {
  private readonly toast = inject(GrdToast);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl<string | null>(null),
    card: new FormControl<CardKind>('standard', { nonNullable: true }),
    newsletter: new FormControl(false, { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
  });

  protected readonly cards: GrdOption<CardKind>[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
  ];

  /** The buttons only say that they were clicked. */
  protected clicked(button: string): void {
    this.toast.info(`The button ${button} was clicked.`);
  }
}
```

`src/app/countries.ts` holds the rows of the table (`COUNTRIES`, sixteen countries) and their type `Country`. `src/styles.scss`:

```scss
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
```

### How it fits together

- **The router is the usual one.** `provideRouter(routes)` in `app.config.ts`, the routes in `app.routes.ts` and `<router-outlet />` in the template of `App`: the router puts the component of the route right after the outlet (beside it, not inside it). Nothing of the library takes part in it, and nothing of the library needs the engine.
- **The layout is a column**: the header and the toolbar take the height they need, `<main>` takes the rest (`flex: 1; min-height: 0`) and scrolls a page that is taller than the window (the form on a small screen). The table page is as tall as `<main>` and gives the rest of its height to the grid (`flex: 1; min-height: 0`), so the grid scrolls its own rows and the header of the table stays.
- **The toolbar follows the router, not the other way round.** `url` is the URL after every finished navigation (`NavigationEnd`, after the redirects, so `/` reads `/table`). The `checked` of each button is a `computed` of it, so a button is pressed whenever its page is shown, whatever brought the page there: the button, a link, Back, a typed address or a reload. A press of the button does not change its state by itself: the item decides, and the toolbar shows it. The `action` of a button is the URL of its page, and `(action)` hands it to `navigateByUrl`.
- **The items are made once.** Their state lives in signals (`checked`, the `label` of the route), so the array is never built again; a new array would make the toolbar forget the state of its controls.
- **`routerLink` on a plain `<a>`** changes the page without loading the application again; Ctrl+click (Cmd+click) still opens the page in a new tab, because the link has a real `href`.
- **The library fields are form controls of Angular**: `formControlName` works on `grd-input`, `grd-date-picker`, `grd-select` and `grd-checkbox`. `required` on a field marks its label with a star and is a rule of the field; `Validators.email` is a validator of Angular, and the field shows its error with the text of the library (_Enter a valid e-mail address_), its red frame and its icon. With `validateOn="input"` the e-mail is checked as it is typed; the other fields report only after they were left once. While a field has no error, its `hint` stands where the message would be.
- **`type="submit"`** makes **Register** the submit button of the form: a click, and Enter in a field of the form, send `ngSubmit`. **Cancel** is an ordinary button with `(pressed)`.
- **A toast needs no tag.** `inject(GrdToast).info(…)` is all: the service makes its element in `document.body` with the first toast and takes it away with the last one.
- **The body is painted by `styles.scss`.** In the tutorials before, the engine painted the whole page; without it, the background and the color of the text come from the theme tokens `--grd-bg-main` and `--grd-text-main`, so a dark theme makes the whole page dark.

### The size of the first load

Each page is a chunk of its own (`loadComponent`), but the library is one file in its package, and a bundler does not split one file: the parts of the library that any page uses (here the grid and the form fields as well as the header and the toolbar) are in the first load, a little over 1 MB. That is why `angular.json` of this tutorial has an `initial` budget of `maximumWarning: 1.5MB` (`maximumError: 2MB`); with the 1 MB of the tutorials before, `ng build` would warn. The chunks of the pages hold only the pages themselves.

## The URL on a server

The router writes the page into the path of the address (`/form`). After a reload, or when somebody opens a link to `/form`, the browser asks the server for `/form`, and the server has to answer with `index.html`: the application starts and the router shows the page. `ng serve` does that by itself. A production server needs the same rule, for example `try_files $uri $uri/ /index.html;` in nginx, or the rewrite rules of your hosting.

Where the server cannot do that, the router can keep the page in the hash instead: `provideRouter(routes, withHashLocation())` makes the addresses `/#/table` and `/#/form`, which any static server serves.

## What you get without writing any of it

- **The table**: a click on the title of a column sorts by it, a second click sorts the other way; Shift+click adds a column to the sorting. The edge of a title changes the width of a column, a double click there fits it to its content, and a title can be dragged to move the column. A click selects a row, the arrows move the selection, and Ctrl+C copies it. The numbers are written as the language of the application writes them.
- **The fields**: the red frame, the icon and the message of an error, the star of a required field, a calendar behind the button of the date, and a list of the select that the keyboard can walk through.
- **The toolbar** is one stop of Tab: the arrows move between its buttons, and Enter or Space presses one.
- **The header**: the select of the themes and the select of the density; the theme you pick is remembered, as in 030.
- **The toasts** close themselves after a few seconds, stay while the pointer is over them, close with their cross or with Esc, and stand in a column when there are more of them.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 050 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21). `ng new` makes the router part as well: `app.routes.ts` and `provideRouter(routes)` in `app.config.ts`.

   ```
   npx @angular/cli@21 new router --style=scss --ssr=false --skip-tests
   cd router
   ```

   Accept the defaults for any other question.

2. Install the library as in 010 (step 2 there, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. Write `src/styles.scss` as above: the styles of the library, the full height of the page, the font, and the background and the color of the theme.

4. Replace `src/app/app.ts` and `src/app/app.routes.ts` with the code above, and add `src/app/table-page.ts`, `src/app/form-page.ts` and `src/app/countries.ts`. The template of `App` is inline, so `app.html` and `app.scss` can go. `app.config.ts` stays as `ng new` made it.

5. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`), see _The size of the first load_.

6. Run it:

   ```
   ng serve
   ```
