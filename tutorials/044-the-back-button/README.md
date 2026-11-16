# 044 – The Back button

This tutorial shows what the Back button of the browser does in a docking application, and how the application decides it. A docking application has no page to go back to (its documents are tabs), so a press out of habit takes the user out of the work. You will learn how to:

- hold the Back press that would leave the application (`provideGrdBackButton`) and decide what happens instead (`canLeave`): stay quietly, stay and say why (a toast), or ask (a question);
- keep the history of the application as it is: Back still walks through the documents (the URL bridge with `history: 'push'`), and only the last step out is held;
- change it while the application runs (`GrdBackButton.setCanLeave`), here from a menu.

It starts from the application of 042 (the invoices in the address); only `app.config.ts` and `app.ts` change, and `back-button.ts` is new.

```
npm run tutorial 044
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open a page first (any address, so that there is a page before the application), then http://localhost:30044 in the same tab. Click two invoices in the list and press Back three times.

## The words first

- **The Back button** of the browser goes to the entry before in the history of the tab. A page cannot switch it off.
- **The entry under the application.** At the first click or key, the library puts an entry of the same page under the application (a browser lets a page add an entry only in a gesture of the user). Back from the first page of the application lands there instead of on the page before: nothing is loaded, and the application decides.
- **`canLeave`** is that decision, a function: `true` leaves (one step more back), `false` stays (forward again, to where the user was), and a promise is waited for (a question to the user).

## Step by step

### Step 1: what Back can do

`src/app/back-button.ts` has three answers, each a `canLeave`:

```ts
import { inject } from '@angular/core';
import { type GrdCanLeave, GrdMessageBox, GrdToast } from '@gridify/studio';

// What the Back button of the browser does when it would leave the application. Each one is a
// `canLeave`: true leaves, false stays, a promise is waited for. They run in the injection context
// of the application, so they can inject() what they need.

/** Back stays in the application, however often it is pressed, and nothing happens. */
export const STAY: GrdCanLeave = () => false;

/** Back stays, and a toast says why. Its id makes Back pressed again replace it, not stack it. */
export const TELL: GrdCanLeave = () => {
  inject(GrdToast).info('The Back button stays in the application. To leave it, close the tab.', {
    id: 'back',
  });
  return false;
};

/**
 * Back asks. confirm() answers true for the button that agrees (Leave) and false for the other one,
 * Esc and the cross (Stay). While the question is open, Back pressed once more leaves.
 */
export const ASK: GrdCanLeave = () =>
  inject(GrdMessageBox).confirm('The open invoices are kept: they come back with the address.', {
    id: 'leave',
    title: 'Leave the invoices?',
    confirmLabel: 'Leave',
    cancelLabel: 'Stay',
    // Enter presses the button that stays: a Back out of habit, then Enter, still stays.
    defaultAnswer: 'cancel',
  });
```

- **They run in the injection context** of the application, so they can `inject()` the toast and the message box.
- **`STAY`** returns `false`: nothing happens, however often Back is pressed.
- **`TELL`** shows a toast and stays. The toast has an `id`, so Back pressed again replaces it instead of stacking one more.
- **`ASK`** returns the promise of `confirm()`: `true` for **Leave**, `false` for **Stay**, Esc and the cross. While the question is open, the user is on the entry under the application, and Back pressed once more leaves: who really wants to leave, leaves.

### Step 2: the provider

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdBackButton } from '@gridify/studio';
import { ASK } from './back-button';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // What Back does when it would leave the application: here it asks (back-button.ts). The
    // provider puts its listeners on the window before the application starts, so the bridge
    // never hears the entry that it puts under the application.
    provideGrdBackButton({ canLeave: ASK }),
  ],
};
```

**`provideGrdBackButton`** belongs among the providers even when `canLeave` is set later: a window calls its `popstate` listeners in the order they came, and the provider puts its own there while the providers are written, before the bridge (or a router) adds its own. So they never hear the entry under the application.

### Step 3: the menu

`src/app/app.ts` is the one of 042 with a menu **Back button**. It changes what Back does while the application runs:

```ts
/** The choices of the menu Back button: what Back does when it would leave the application. */
private readonly choices: { label: string; canLeave: GrdCanLeave | null }[] = [
  { label: '&Ask before leaving', canLeave: ASK },
  { label: '&Stay, and say why', canLeave: TELL },
  { label: 'Stay &quietly', canLeave: STAY },
  { label: '&Leave, as on any page', canLeave: null },
];
```

```ts
{
  id: 'back',
  label: '&Back button',
  // The menu changes what Back does while the application runs: setCanLeave() with another
  // function, or null for Back as on any page. canLeave() is the function in force.
  items: this.choices.map((choice) => ({
    label: choice.label,
    checked: this.back.canLeave() === choice.canLeave,
    run: () => this.back.setCanLeave(choice.canLeave),
  })),
},
```

- **`setCanLeave(fn)`** sets another function; **`setCanLeave(null)`** gives Back back to the browser: the entry under the application is then stepped over.
- **`canLeave()`** is the function in force (a signal), so the check mark follows it. `menus` is a `computed`, and the template reads it: `<grd-menu-bar [menus]="menus()" />`.

### Step 4: run it

```
npm run tutorial 044
```

## Try it

1. **Back through the documents.** Click **Invoice 1001**, then **Invoice 1002**. Back: Invoice 1001 is shown. Back again: the first entry of the application (the address keeps the open invoices: the bridge writes them into it, see 042).
2. **The last step out.** Back once more: _Leave the invoices?_ Press **Stay**: the application stays as it was, and so does the address. The bridge heard nothing: no tab closed or opened.
3. **Leave.** Back, and **Leave**: the page before the application. Forward brings the application back (from the back-forward cache of the browser, or loaded again with the address and the layout).
4. **Back while it asks.** Back: the question. Back again, without answering: the page before. Who really wants to leave, leaves.
5. **Quietly.** **Back button › Stay quietly**, then Back as often as you like: nothing happens.
6. **With a toast.** **Back button › Stay, and say why**: Back shows _The Back button stays in the application. To leave it, close the tab._, and pressed again it shows the same toast once.
7. **As on any page.** **Back button › Leave, as on any page**: Back from the first entry leaves at once.
8. **A new tab.** Open http://localhost:30044 in a new tab of the browser: there is nothing before the application, so Back is off in the browser, and the library puts nothing under it.

## More

- **What a page cannot hold:** a long press on Back with a page picked from the list, closing the tab, typing an address, a Back pressed again while the page is still busy. For unsaved work the browser asks itself before the page goes, and the Back button can ask only then: `provideGrdUnsavedWork` and `grdAskWhenUnsaved` (see 045).
- **A part of the application** can decide for a while: a desk that asks while it is open sets `canLeave` when it starts and gives back `null` when it closes (`inject(DestroyRef).onDestroy(() => back.setCanLeave(null))`). Forward onto the entry under the application from a page of the application under it goes on through it to the page above.
- **With the Angular router** the pages of the router are above the entry too, and Back walks through them as before; the provider makes sure that the router never hears the entry under the application.
- **The README of the library** (`grd-common`, _The Back button_) and the playground (Services › Back button) say more.

## The code

`src/app/app.ts`:

```ts
import { AfterViewInit, Component, computed, DestroyRef, inject, viewChild } from '@angular/core';
import {
  GrdBackButton,
  type GrdCanLeave,
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
  GrdToast,
  GrdUrlBridge,
} from '@gridify/studio';
import { ASK, STAY, TELL } from './back-button';
import { InvoiceList } from './invoice-list';
import { InvoicePage } from './invoice-page';
import { findInvoice } from './invoices';
import { invoiceTag, Links } from './links';

/** The list of the invoices on the left, the place of the documents (the invoices) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'invoices', role: 'tool', title: 'Invoices', componentKey: 'invoices' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <!-- The engine keeps WHERE the tabs are (localStorage); the address says WHICH invoices are open. -->
    <grd-docking-engine layoutStorageKey="tutorial-044-layout" [defaultLayout]="layout" />
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
export class App implements AfterViewInit {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly links = inject(Links);
  private readonly toast = inject(GrdToast);
  /** The Back button of the browser in the application (set in app.config.ts). */
  private readonly back = inject(GrdBackButton);

  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change, so F5 brings it back.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the keys must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('invoices', InvoiceList);
    registry.registerComponent('invoice', InvoicePage);
    // The root component lives as long as the page; a bridge in a component that goes away stops.
    inject(DestroyRef).onDestroy(() => this.links.bridge?.stop());
  }

  /** The engine is ready (it has restored its layout): now the bridge can start. */
  ngAfterViewInit(): void {
    const bridge = new GrdUrlBridge(this.engine(), {
      // How to open a tag of the address. The address is typed by anybody, so the resolver checks
      // the number: an invoice that does not exist gives null, and nothing is opened.
      resolve: {
        invoice: (id) =>
          findInvoice(id)
            ? {
                componentType: InvoicePage,
                componentKey: 'invoice',
                title: `Invoice ${id}`,
                inputs: { id },
              }
            : null,
      },
      // Each invoice that is opened or shown is a new entry of the history of the browser, so
      // Back goes to the one before. (Without it: 'replace', and the history does not grow.)
      history: 'push',
    });
    // A tag that could not be opened (a link to an invoice that does not exist): tell the user.
    bridge.on('unresolved', (event) =>
      this.toast.warning(`Not opened: ${event.tag} (${event.reason}).`),
    );
    // Open what the address names, and from now on keep the address up to date.
    bridge.start();
    this.links.bridge = bridge;
  }

  /** The choices of the menu Back button: what Back does when it would leave the application. */
  private readonly choices: { label: string; canLeave: GrdCanLeave | null }[] = [
    { label: '&Ask before leaving', canLeave: ASK },
    { label: '&Stay, and say why', canLeave: TELL },
    { label: 'Stay &quietly', canLeave: STAY },
    { label: '&Leave, as on any page', canLeave: null },
  ];

  /** A computed: the check mark of the menu Back button follows the function in force. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        // The same as a link in the application: open (or show) an invoice by its tag.
        { label: 'Open invoice 100&3', run: () => this.links.bridge?.open(invoiceTag('1003')) },
        {
          label: 'Open invoice &9999 (there is none)',
          run: () => this.links.bridge?.open(invoiceTag('9999')),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'back',
      label: '&Back button',
      // The menu changes what Back does while the application runs: setCanLeave() with another
      // function, or null for Back as on any page. canLeave() is the function in force.
      items: this.choices.map((choice) => ({
        label: choice.label,
        checked: this.back.canLeave() === choice.canLeave,
        run: () => this.back.setCanLeave(choice.canLeave),
      })),
    },
  ]);
}
```

## Build it yourself

`npm run tutorial:eject 044 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 042, add `back-button.ts` to `src/app`, and replace `app.config.ts` and `app.ts` with the ones of this tutorial.
