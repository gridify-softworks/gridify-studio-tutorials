# 119 – A component made by a factory

This tutorial shows how to save a tab that needs data from the server without saving the data: the tab saves the key of a factory and the id of a customer, and the factory gets the customer again every time the tab is opened or comes back after a reload. You will learn how to:

- register a factory that makes a component with its inputs (`registerComponentFactory`);
- open a tab that names the factory and its parameters (`serialize: 'callback'`);
- show a placeholder while the data comes, and an error with **Try again** while the server is off;
- stop the request when the tab is closed.

The server is a fake one: it answers after a moment, and it can be switched off. It is the application of 015 with a few lines more, from the series about saving (110–125).

```
npm run tutorial 119
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30119, open a customer or two (**File › Open customer**), and reload the page. Then switch the server off (**Server › Server online**) and reload again.

Every tutorial runs on an address of its own (this one on http://localhost:30119), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-119-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

In the template of `App`, the engine gets the key of this tutorial:

```html
<!-- a key of its own: everything that runs on one address shares one localStorage -->
<grd-docking-engine layoutStorageKey="tutorial-119-layout" />
```

### Step 2: a server

Add `src/app/customer-server.ts` (the whole file is in [The code](#the-code)). It has three customers and one method that asks for a customer by its id:

```ts
/** Asks for one customer. It takes 800 ms; `signal` stops the request when the tab is closed meanwhile. */
async customer(id: number, signal: AbortSignal): Promise<Customer> {
  await wait(800, signal);
  if (this.offline()) throw new Error('The server does not answer.');
  const customer = CUSTOMERS.find((candidate) => candidate.id === id);
  if (!customer) throw new Error(`There is no customer ${id}.`);
  return customer;
}
```

`setOnline(false)` makes every answer an error. The switch is kept in `localStorage` (`tutorial-119-server-offline`), so that the server is still off after a reload. In an application this is a service that calls your API with `HttpClient` or `fetch`.

### Step 3: the card of a customer

Add `src/app/customer-card.ts`. It only shows what it gets: the customer comes in as a required input.

```ts
export class CustomerCard {
  readonly customer = input.required<Customer>();
  protected readonly loadedAt = new Date().toLocaleTimeString();
}
```

`loadedAt` is the time the card was made: after a reload it tells you that the card is a new one, made from a new answer of the server.

### Step 4: register the factory

In the constructor of `App`, under the counter of 015:

```ts
// The factory makes the content of a customer tab: it asks the server for the customer that the tab names (`params`,
// saved with the tab), then gives the engine the component and its inputs. It runs when the tab is opened and again
// after every reload.
registry.registerComponentFactory('customer', async ({ params, signal }) => {
  const customer = await this.server.customer(Number(params['id']), signal);
  return { componentType: CustomerCard, inputs: { customer } };
});
```

`App` has the server as a field: `private readonly server = inject(CustomerServer);`. The factory gets `params` (what the tab saved) and `signal` (aborted when the tab is closed before the content is there), and it returns the class of the component and its inputs.

### Step 5: open a tab that names the factory

```ts
/**
 * A tab whose content is made by the factory: only the key of the factory and the id of the customer are saved (with the title and the
 * placeholder, the text the tab shows while the factory runs).
 */
private openCustomer(id: number, name: string): void {
  this.engine().openComponentTab({
    title: name,
    serialize: 'callback',
    callback: { key: 'customer', params: { id } },
    placeholder: `Asking the server for ${name}…`,
  });
}
```

The tab has neither a component nor a component key: `serialize: 'callback'` says that its content comes from the registry, and `callback` says from which entry and with which parameters. The parameters must be JSON, because they are saved. `placeholder` is the text the tab shows while the factory runs, at once, instead of the loader; it is saved too, so it shows after a reload as well.

### Step 6: the menus

**File › Open customer** is a submenu with one item for each customer, and a new menu **Server** has the switch:

```ts
{
  id: 'server',
  label: '&Server',
  items: [
    {
      label: 'Server &online',
      checked: this.server.online(),
      run: () => this.server.setOnline(!this.server.online()),
    },
  ],
},
```

`checked` is a plain value, so the menus are a `computed` signal now (`protected readonly menus = computed<GrdMenu[]>(() => [...])`) and the template binds `[menus]="menus()"`. When the server goes off or on, the computed makes the menus again and the check mark follows.

## Try it

1. **File › Open customer › Ada Lovelace.** The tab says _Asking the server for Ada Lovelace…_ for a moment (the server takes 800 ms), then the card: _Analytical Engines Ltd._, _London_, and _Loaded from the server at 10:41:07_.
2. **Open Grace Hopper** as well.
3. **See what is saved.** In the developer tools, _Application › Local storage › http://localhost:30119_, the key `tutorial-119-layout`: the tab of Grace Hopper has `"serialize": "callback"` and `"callback": {"key": "customer", "params": {"id": 2}}`, its title and its placeholder. _Compiler Works_ is nowhere: the customer is not saved.
4. **Press F5.** The two tabs are back with their titles. The active one shows its placeholder again and then the card, with a new time: the factory ran again.
5. **Server › Server online** (the check mark goes) and press F5. The tab says _Failed to load content: The server does not answer._ with a **Try again** button, and the console has a warning. The switch is still off after the reload.
6. **Server › Server online** again, and **Try again**: the placeholder, then the card.
7. **Open Alan Turing and close the tab at once**, before the card comes. The request is stopped, and nothing appears later.
8. **File › Reset layout** empties the area.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';
import { CustomerCard } from './customer-card';
import { CustomerServer } from './customer-server';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <!-- a key of its own: everything that runs on one address shares one localStorage -->
    <grd-docking-engine layoutStorageKey="tutorial-119-layout" />
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
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly server = inject(CustomerServer);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    // The factory makes the content of a customer tab: it asks the server for the customer that the tab names (`params`,
    // saved with the tab), then gives the engine the component and its inputs. It runs when the tab is opened and again
    // after every reload.
    registry.registerComponentFactory('customer', async ({ params, signal }) => {
      const customer = await this.server.customer(Number(params['id']), signal);
      return { componentType: CustomerCard, inputs: { customer } };
    });
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: '&Open customer',
          children: this.server.customers.map((customer) => ({
            label: customer.name,
            run: () => this.openCustomer(customer.id, customer.name),
          })),
        },
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'server',
      label: '&Server',
      items: [
        {
          label: 'Server &online',
          checked: this.server.online(),
          run: () => this.server.setOnline(!this.server.online()),
        },
      ],
    },
  ]);

  /**
   * A tab whose content is made by the factory: only the key of the factory and the id of the customer are saved (with the title and the
   * placeholder, the text the tab shows while the factory runs).
   */
  private openCustomer(id: number, name: string): void {
    this.engine().openComponentTab({
      title: name,
      serialize: 'callback',
      callback: { key: 'customer', params: { id } },
      placeholder: `Asking the server for ${name}…`,
    });
  }
}
```

`src/app/customer-server.ts`:

```ts
import { computed, Injectable, signal } from '@angular/core';

/** A customer, as the server sends it. */
export interface Customer {
  id: number;
  name: string;
  company: string;
  city: string;
  since: number;
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Ada Lovelace', company: 'Analytical Engines Ltd.', city: 'London', since: 2019 },
  { id: 2, name: 'Grace Hopper', company: 'Compiler Works', city: 'Arlington', since: 2021 },
  { id: 3, name: 'Alan Turing', company: 'Bombe & Co.', city: 'Manchester', since: 2023 },
];

/** Where the switch "Server online" is kept, so that it is the same after a reload. */
const OFFLINE_KEY = 'tutorial-119-server-offline';

/**
 * A fake server, so that the tutorial runs without a backend: it answers after a moment, and it can be switched off.
 * In an application this is a service that calls your API (with `HttpClient` or `fetch`).
 */
@Injectable({ providedIn: 'root' })
export class CustomerServer {
  readonly customers = CUSTOMERS;
  private readonly offline = signal(localStorage.getItem(OFFLINE_KEY) === 'yes');
  /** Does the server answer? */
  readonly online = computed(() => !this.offline());

  setOnline(online: boolean): void {
    this.offline.set(!online);
    if (online) localStorage.removeItem(OFFLINE_KEY);
    else localStorage.setItem(OFFLINE_KEY, 'yes');
  }

  /** Asks for one customer. It takes 800 ms; `signal` stops the request when the tab is closed meanwhile. */
  async customer(id: number, signal: AbortSignal): Promise<Customer> {
    await wait(800, signal);
    if (this.offline()) throw new Error('The server does not answer.');
    const customer = CUSTOMERS.find((candidate) => candidate.id === id);
    if (!customer) throw new Error(`There is no customer ${id}.`);
    return customer;
  }
}

/** Waits, or fails at once when `signal` is aborted (the tab was closed). */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted.'));
    });
  });
}
```

`src/app/customer-card.ts`:

```ts
import { Component, input } from '@angular/core';
import type { Customer } from './customer-server';

/** The card of a customer. It only shows what it is given: the factory in `app.ts` asks the server and hands the customer in. */
@Component({
  selector: 'app-customer-card',
  template: `
    <h2>{{ customer().name }}</h2>
    <dl>
      <dt>Company</dt>
      <dd>{{ customer().company }}</dd>
      <dt>City</dt>
      <dd>{{ customer().city }}</dd>
      <dt>Customer since</dt>
      <dd>{{ customer().since }}</dd>
    </dl>
    <p class="note">Loaded from the server at {{ loadedAt }}.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    h2 {
      font-size: 1.1rem;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
    }
    dt {
      opacity: 0.88;
    }
    dd {
      margin: 0;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class CustomerCard {
  readonly customer = input.required<Customer>();
  protected readonly loadedAt = new Date().toLocaleTimeString();
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **How a component tab is saved** is its `serialize`. Without it, the tab is saved with the key of its component and its inputs (as the counter of 015). `'callback'` saves the key of a factory and its parameters instead, and `'none'` does not save the tab at all. The title and the place of the tab are saved in every case.
- **The factory** (`registerComponentFactory(key, factory)`) is a function of a `GrdCallbackContext` (`tabId`, `params`, `signal`) that returns `{ componentType, inputs }`, or a promise of it. The engine calls it every time it makes the body of the tab: when the tab is opened, after a reload when the tab is shown, and on **Try again**. Moving the tab does not call it: the body moves with the tab.
- **The inputs** are set on the component before its first change detection, so `input.required` works: the card never sees a missing customer.
- **`inject()` in a factory** works only before the first `await` (the engine calls the factory in the injection context of the application, and an `await` leaves it). This factory needs no `inject()`: it uses the field `server` of `App`. A factory that injects writes `const server = inject(CustomerServer);` as its first line.
- **The placeholder** of the tab is shown at once while the factory runs. A tab without one shows the loader instead, after 150 ms, as for a lazy component (118).
- **An error** thrown by the factory, or a promise of it that fails, puts the message of the error into the tab, with **Try again**, and a warning into the console. **Try again** calls the factory again with the same parameters.
- **`signal`** is aborted when the tab is closed while the factory runs. Pass it on to `fetch` or `HttpClient`, so that the request stops; whatever the factory returns afterwards is thrown away.
- **Factory or saved state.** The factory makes the content from the server every time, and the tab saves only what is needed to ask for it. A component that keeps a state of its own that the server does not have (a text being written, a selected row) saves it itself: that is tutorial 120.

## What you get without writing any of it

- **The parameters saved with the tab** and handed back to the factory after a reload.
- **The placeholder** (or the loader) while the factory runs, and **the error box** with **Try again** when it fails.
- **Aborting**: the `signal` for the requests of a tab that is closed while it loads, and no component made for it.
- **The component made and destroyed** by the engine, with its inputs, like any other component in a tab.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 119 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new component-factory --style=scss --ssr=false --skip-tests
   cd component-factory
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` of 015, `src/app/customer-server.ts` and `src/app/customer-card.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
