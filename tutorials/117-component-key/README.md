# 117 – Components by a key

This tutorial shows how to save a component tab so that it comes back after a reload with its inputs: as the key of its component and its inputs as JSON. You will learn how to:

- register a component under a key (`GrdContentRegistry`), at startup;
- open a component tab by its key, with inputs (`"inputs": { "customerId": 42 }` in the saved layout);
- change an input of an open tab from the component itself (`api.setTabInputs`), so that the new value is saved too;
- see what a tab gets after a reload when nobody registered its key: the error box with **Try again**.

One component shows two customers, with two inputs; what the component keeps inside is not saved (120 saves it). It is the application of 015 with a few lines more, from the series about saving (110–125); the dialog of 114 shows what is saved.

```
npm run tutorial 117
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30117, open a customer (**File › Open customer 42**), and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30117), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-117-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository). The counter of 015 is not needed here.

### Step 1: a key of its own

As in 114: a constant, a field of `App` and a binding in the template.

```ts
/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-117-layout';
```

```html
<grd-docking-engine [layoutStorageKey]="layoutKey" />
```

### Step 2: a component with an input

`src/app/customer.ts` shows one customer; which one is the input `customerId`:

```ts
readonly customerId = input.required<number>();
```

Its button counts calls (`calls`), the component's own state, to show what is not saved. A second input, `compact`, comes in step 5.

### Step 3: register the key, at startup

```ts
constructor() {
  inject(GrdEngineSettings).setAutoSaveLayout(true);
  // Every key that can be in a saved layout is registered at startup, before the saved tabs come back.
  this.registry.registerComponent('customer', Customer);
  // The key 'invoice' is not registered here, on purpose: see openInvoice.
}
```

`App` has the registry as a field, `private readonly registry = inject(GrdContentRegistry);`.

### Step 4: open the component by its key, with inputs

```ts
/**
 * A customer tab: the component by its key, the customer by an input. Both are saved with the layout, `"componentKey": "customer"` and
 * `"inputs": { "customerId": 42 }`, and after a reload the engine makes the component again from them.
 */
private openCustomer(customerId: number): void {
  this.engine().openComponentTab({
    title: `Customer ${customerId}`,
    componentKey: 'customer',
    inputs: { customerId },
  });
}
```

The tab names no class, only the key: the engine takes the class from the registry. `inputs` are given to the component by their names, the way the router gives them (`setInput`). The menu opens two customers with it, `{ label: 'Open customer &42', run: () => this.openCustomer(42) }` and the same with 7.

### Step 5: an input that changes while the tab is open

The card gets a second input, `compact` (only the name), and a button **Less** / **More** that changes it. The card does not set a field of its own: it asks the engine for a new value of its input, with the id of its tab from `GrdTabContext`:

```ts
/** Only the name, without the line under it. Saved with the tab, like `customerId`. */
readonly compact = input(false);

/** The tab of the card: its id, and the engine it is in. */
private readonly tab = inject(GrdTabContext);
```

```ts
protected toggleCompact(): void {
  this.tab.engine.api.setTabInputs(this.tab.tabId, { compact: !this.compact() });
}
```

<!-- prettier-ignore -->
```html
@if (!compact()) {
  <p>Customer {{ customerId() }}, {{ customer().city }}.</p>
}
<grd-button [label]="'Calls: ' + calls()" (pressed)="calls.set(calls() + 1)" />
<grd-button [label]="compact() ? 'More' : 'Less'" (pressed)="toggleCompact()" />
```

`api.setTabInputs(id, inputs)` gives the component the new value at once (`setInput`, as at the start) and keeps it with the tab, so it is saved with the layout and the card starts with it after a reload. It merges: `customerId` is not given and stays.

### Step 6: a key that is registered only while the page runs

`src/app/invoice.ts` is a second component (an input `number`). Its tab gives the class and the key together:

```ts
private openInvoice(): void {
  this.engine().openComponentTab({
    title: 'Invoice 2026-118',
    componentType: Invoice,
    componentKey: 'invoice',
    inputs: { number: '2026-118' },
  });
}
```

That works, and the tab is saved by its key. The class and the key together register the key, but only in this page: after a reload nothing registers `invoice`, and the tab shows an error box. While you develop, the console says so as soon as the tab opens. The menu **Registry** does the missing registration later, so that **Try again** can be tried:

```ts
private registerInvoice(): void {
  if (!this.registry.hasComponent('invoice')) this.registry.registerComponent('invoice', Invoice);
}
```

### Step 7: show what is saved

**File › Show what is saved** is the dialog of 114 (its step 4, with the rule `.saved` in `src/styles.scss`).

## Try it

1. **File › Open customer 42.** _Northwind Tools, Customer 42, Oslo._ Click **Calls: 0** twice: _Calls: 2_.
2. **File › Open customer 7.** The same component with another input: _Blue Harbor Café, Customer 7, Lisbon._
3. **Press F5.** Both tabs are back, each with its customer: the key and the inputs were saved. **Click Customer 42**: the calls are _0_ again. The input came back, the component's own state did not (a component that wants it back saves it itself, tutorial 120).
4. **Less** in the card of customer 42. The line _Customer 42, Oslo._ goes, and the button says **More**. **Press F5**: the card is still compact, and its calls are _0_. The changed input was saved; the calls were not.
5. **File › Show what is saved.** The tab of customer 7 is `"componentKey": "customer"`, `"serialize": "json"` and `"inputs": { "customerId": 7 }`: the number is still a number. The tab of customer 42 has `"inputs": { "customerId": 42, "compact": true }`. No class anywhere.
6. **File › Open an invoice.** It opens: _Invoice 2026-118_. The console has a warning (in `ng serve`, not in a production build): `[grd-docking-engine] openComponentTab: the key "invoice" was not in GrdContentRegistry, so the tab registered it, but only while the page runs. …`
7. **Press F5.** The invoice tab says _Failed to load content: Component "invoice" is not registered in GrdContentRegistry._ and has a **Try again** button. The console has a warning, `[grd-docking-engine] Failed to load the content of tab "Invoice 2026-118": Error: Component "invoice" is not registered in GrdContentRegistry.` The customers are fine: their key is registered in the constructor.
8. **Try again.** The same error: the key is still not registered.
9. **Registry › Register the invoice now, then Try again.** The invoice is shown, with its saved input. (In an application, the fix is the line in the constructor, so that step 7 never happens.)
10. **File › Reset layout, then F5**: the area is empty.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Customer } from './customer';
import { Invoice } from './invoice';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-117-layout';

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
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
  `,
})
export class App {
  protected readonly layoutKey = LAYOUT_KEY;
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);
  private readonly registry = inject(GrdContentRegistry);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // Every key that can be in a saved layout is registered at startup, before the saved tabs come back.
    this.registry.registerComponent('customer', Customer);
    // The key 'invoice' is not registered here, on purpose: see openInvoice.
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Open customer &42', run: () => this.openCustomer(42) },
        { label: 'Open customer &7', run: () => this.openCustomer(7) },
        { separator: true },
        { label: 'Open an &invoice', run: () => this.openInvoice() },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'registry',
      label: 'Re&gistry',
      items: [{ label: '&Register the invoice now', run: () => this.registerInvoice() }],
    },
  ];

  /**
   * A customer tab: the component by its key, the customer by an input. Both are saved with the layout, `"componentKey": "customer"` and
   * `"inputs": { "customerId": 42 }`, and after a reload the engine makes the component again from them.
   */
  private openCustomer(customerId: number): void {
    this.engine().openComponentTab({
      title: `Customer ${customerId}`,
      componentKey: 'customer',
      inputs: { customerId },
    });
  }

  /**
   * An invoice tab, given by its class and a key together. That registers the key, but only while the page runs: after a reload nothing registers it,
   * and the tab shows an error. The cure is one line in the constructor, like the one of the customer.
   */
  private openInvoice(): void {
    this.engine().openComponentTab({
      title: 'Invoice 2026-118',
      componentType: Invoice,
      componentKey: 'invoice',
      inputs: { number: '2026-118' },
    });
  }

  /** What the constructor should have done. After it, Try again in the tab of the invoice finds the class. */
  private registerInvoice(): void {
    if (!this.registry.hasComponent('invoice')) this.registry.registerComponent('invoice', Invoice);
  }

  /** What the engine wrote into localStorage under the key, in a dialog: the saved layout as JSON. */
  private showSaved(): void {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const text = saved ? JSON.stringify(JSON.parse(saved), null, 2) : 'Nothing is saved yet.';
    this.dialogs.open({
      title: `localStorage["${LAYOUT_KEY}"]`,
      html: `<pre class="saved">${escapeHtml(text)}</pre>`,
      width: 720,
      height: 520,
      resizable: true,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
```

`src/app/customer.ts`:

```ts
import { Component, computed, inject, input, signal } from '@angular/core';
import { GrdButton, GrdTabContext } from '@gridify/studio';

/** The customers of a pretend shop, by their id. */
const CUSTOMERS: Record<number, { name: string; city: string }> = {
  7: { name: 'Blue Harbor Café', city: 'Lisbon' },
  42: { name: 'Northwind Tools', city: 'Oslo' },
};

/**
 * A customer card. Which customer it shows is an input, `customerId`: the engine saves the inputs of the tab with the layout, so after a reload the card
 * shows the same customer. `compact` is an input too, which the card changes itself through the engine, so it is saved the same way. The calls counted
 * here are the component's own state, and that is not saved.
 */
@Component({
  selector: 'app-customer',
  imports: [GrdButton],
  template: `
    <h3>{{ customer().name }}</h3>
    @if (!compact()) {
      <p>Customer {{ customerId() }}, {{ customer().city }}.</p>
    }
    <grd-button [label]="'Calls: ' + calls()" (pressed)="calls.set(calls() + 1)" />
    <grd-button [label]="compact() ? 'More' : 'Less'" (pressed)="toggleCompact()" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    grd-button + grd-button {
      margin-inline-start: 8px;
    }
  `,
})
export class Customer {
  readonly customerId = input.required<number>();
  /** Only the name, without the line under it. Saved with the tab, like `customerId`. */
  readonly compact = input(false);

  /** The tab of the card: its id, and the engine it is in. */
  private readonly tab = inject(GrdTabContext);
  protected readonly customer = computed(
    () => CUSTOMERS[this.customerId()] ?? { name: 'Unknown customer', city: 'nowhere' },
  );
  protected readonly calls = signal(0);

  /**
   * Less or More: the card asks the engine for a new value of its own input. The engine sets it on the card at once and keeps it with the tab, so the
   * saved layout has `"compact": true`, and the card is compact again after a reload. A field set here would be forgotten, like the calls.
   */
  protected toggleCompact(): void {
    this.tab.engine.api.setTabInputs(this.tab.tabId, { compact: !this.compact() });
  }
}
```

`src/app/invoice.ts`:

```ts
import { Component, input } from '@angular/core';

/** An invoice. Its tab is opened with the class and the key together, and nothing else registers the key (see `openInvoice` in `app.ts`). */
@Component({
  selector: 'app-invoice',
  template: `
    <h3>Invoice {{ number() }}</h3>
    <p>3 items, 1,250 EUR, due in 14 days.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Invoice {
  readonly number = input.required<string>();
}
```

`src/styles.scss` is the one of 114 (the one of 015 with the rule `.saved`).

## How it fits together

- **`serialize: 'json'` is the default of a component tab with a key.** The tab is saved with `componentKey`, its `inputs` and `"serialize": "json"`, never with the class. On a load the engine asks the registry for the class of the key, makes the component, gives it the inputs and shows it.
- **Register every key at startup.** A saved layout can name any key that a tab of the application ever had, so every such key is registered when the application starts, before the engine shows the saved tabs (the constructor of `App` is a good place). A key that is missing gives the error box of step 6, and the tab stays, so that **Try again** can work once the key is there.
- **The class and the key together** (`componentType` and `componentKey`) register the key when the tab is opened, if it is not registered yet. That is handy while the page runs and is not enough after a reload: steps 6 and 7. An engine that saves its layout says so in the console while you develop (Angular's dev mode), once for the key. The tabs of a `defaultLayout` that give both are registered by the engine whenever the default layout is set, so they need nothing more.
- **The inputs are JSON.** They are saved through `JSON.stringify`: a number stays a number and a string a string, a `Date` comes back as a string, an object of a class as a plain object, and an input that JSON cannot hold (a function) is left out with a warning in the console. Keep inputs small (an id, not the data) and load the rest in the component.
- **An input name that the component does not have** (a typo, `customerID`) is not passed, and a warning in the console names it.
- **The inputs can change while the tab is open.** `api.setTabInputs(id, inputs)` gives the component the new values (`setInput`) and keeps them with the tab, so they are saved: the **Less** button does it for the card's own tab, with the id from `GrdTabContext`. It merges, so the inputs that are not given keep their values (`undefined` takes one out). It works for any open component tab, docked, floating or in another window, from anywhere in the application (`engine.api`).
- **What the component keeps in its fields is its own state.** The calls here are forgotten on a reload, and so is anything the component changes without telling the engine. A component that wants such state back implements `GrdPersistable` (tutorial 120); an input that the application or the component changes is simpler, when the state is a value the tab is opened with anyway.
- **A class can also be registered lazily**: `registerComponent('customer', () => import('./customer').then((m) => m.Customer))` loads its code only when a tab needs it (tutorial 118).
- **A component tab loads when it is shown**, like the HTML of a callback (115): after a reload, a saved tab that is not shown is made when it is shown the first time.

## What you get without writing any of it

- **Saving and loading of component tabs** by their keys and inputs, with the panels and floating windows around them.
- **The inputs given back** to `input()` and `@Input()` alike, before the component is drawn the first time.
- **An error box with Try again** (translated) for a key that is not registered or a class that cannot be made, instead of an empty tab or a broken layout; the other tabs are not touched.
- **A warning for an input that cannot be saved**, naming the input and the tab.
- **Inputs changed later** (`api.setTabInputs`), set on the live component and saved with the tab.
- **A warning while you develop** when a key is registered only by opening a tab.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 117 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new component-key --style=scss --ssr=false --skip-tests
   cd component-key
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 114 (`@use '@gridify/studio/styles';`, a full height for `html` and `body`, and the rule `.saved`).

5. Add `src/app/customer.ts` and `src/app/invoice.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
