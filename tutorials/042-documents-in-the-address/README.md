# 042 – Documents in the address

This tutorial shows how to put the open documents of the docking engine into the address of the page, so that a link opens a document: a link in an e-mail, a bookmark, F5, the Back button of the browser. You will learn how to:

- give a document an address: a tab with a `tag` of the shape `type:id` (`invoice:1001`);
- start the bridge between the engine and the address (`GrdUrlBridge`), and tell it how to open a document (a resolver);
- open a document from a link of the application (`bridge.open`), and write such a link (`grdEncodeUrlState`);
- let the Back button walk through the documents (`history: 'push'`);
- turn away an address that names a document that does not exist (`on('unresolved')`).

It starts from the application of 015 (a menu bar over the engine, a layout that is saved) with the default layout of 041.

```
npm run tutorial 042
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30042, click an invoice in the list on the left, and watch the address bar of the browser.

## The words first

- **The address** (the URL) is the line at the top of the browser. The part after `?` is the query: here `?a=invoice:1003&o=invoice:1001,invoice:1003`, where `a` is the document that is shown (active) and `o` the documents that are open.
- **A tag** is a label of a tab. A tag of the shape `type:id` is the address of a document: the type says what it is (`invoice`), the id which one (`1001`). Tabs without such a tag (the list on the left) stay out of the address.
- **The bridge** (`GrdUrlBridge`) writes the open documents into the address, and opens the documents that an address names. It is not a router: it has no pages and no guards, only the documents of the engine.
- **A resolver** is a function that the application gives the bridge for each type. It gets the id and says how to open the tab (the component, the title, the inputs), or `null` when nothing may be opened.
- **The layout and the address** share the work: the engine keeps _where_ the tabs are (in `localStorage`, as in 015), the address says _which_ documents are open and which one is shown.

## Step by step

### Step 1: the invoices

`src/app/invoices.ts` has the pretend data and two small functions:

```ts
/** One line of an invoice. */
export interface InvoiceLine {
  readonly item: string;
  readonly quantity: number;
  readonly price: number;
}

/** An invoice of the pretend data. */
export interface Invoice {
  /** The number of the invoice: it is in the address (`invoice:1001`). */
  readonly id: string;
  readonly customer: string;
  readonly date: string;
  readonly lines: readonly InvoiceLine[];
}

/** The invoices of the application. A real application loads them from its server. */
export const INVOICES: readonly Invoice[] = [
  {
    id: '1001',
    customer: 'Northwind',
    date: '2026-10-02',
    lines: [
      { item: 'Coffee beans', quantity: 20, price: 12 },
      { item: 'Grinder', quantity: 2, price: 190 },
    ],
  },
  {
    id: '1002',
    customer: 'Contoso',
    date: '2026-10-05',
    lines: [{ item: 'Tea', quantity: 40, price: 6 }],
  },
  {
    id: '1003',
    customer: 'Fabrikam',
    date: '2026-10-11',
    lines: [
      { item: 'Espresso machine', quantity: 1, price: 1450 },
      { item: 'Cups', quantity: 24, price: 4 },
    ],
  },
  {
    id: '1004',
    customer: 'Adventure Works',
    date: '2026-10-17',
    lines: [{ item: 'Milk frother', quantity: 3, price: 85 }],
  },
  {
    id: '1005',
    customer: 'Tailspin Toys',
    date: '2026-10-23',
    lines: [
      { item: 'Hot chocolate', quantity: 15, price: 9 },
      { item: 'Mugs', quantity: 12, price: 7 },
    ],
  },
];

/** The invoice with this number, or `undefined` when there is none. */
export function findInvoice(id: string): Invoice | undefined {
  return INVOICES.find((invoice) => invoice.id === id);
}

/** The total of an invoice: the sum of its lines. */
export function totalOf(invoice: Invoice): number {
  return invoice.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
}
```

### Step 2: an invoice as a document

`src/app/invoice-page.ts` shows one invoice. It gets only its number (the input `id`) and finds the rest:

```ts
import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { findInvoice, totalOf } from './invoices';
import { Links } from './links';

/** A document: one invoice. The bridge opens it with the number from the address (see app.ts). */
@Component({
  selector: 'app-invoice-page',
  imports: [CurrencyPipe],
  template: `
    @if (invoice(); as invoice) {
      <h2>Invoice {{ invoice.id }}</h2>
      <p>{{ invoice.customer }}, {{ invoice.date }}</p>
      <table>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
        @for (line of invoice.lines; track line.item) {
          <tr>
            <td>{{ line.item }}</td>
            <td>{{ line.quantity }}</td>
            <td>{{ line.price | currency: 'EUR' }}</td>
            <td>{{ line.quantity * line.price | currency: 'EUR' }}</td>
          </tr>
        }
        <tr>
          <th colspan="3">Total</th>
          <th>{{ total() | currency: 'EUR' }}</th>
        </tr>
      </table>
      <!-- The link that would go by e-mail: it opens this invoice in a new tab of the browser. -->
      <p>A link to this invoice:</p>
      <p>
        <a [href]="links.href(invoice.id)" target="_blank">{{ link() }}</a>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    h2 {
      margin: 0 0 4px;
    }
    table {
      border-collapse: collapse;
      margin: 12px 0;
    }
    th,
    td {
      padding: 4px 12px 4px 0;
      text-align: left;
      border-bottom: 1px solid var(--grd-border-color);
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class InvoicePage {
  /** The number of the invoice: the input that the resolver of the bridge gives the tab. */
  readonly id = input.required<string>();

  protected readonly links = inject(Links);
  protected readonly invoice = computed(() => findInvoice(this.id()));
  protected readonly total = computed(() => {
    const invoice = this.invoice();
    return invoice ? totalOf(invoice) : 0;
  });
  /** The whole address of the link, as it would be sent by e-mail. */
  protected readonly link = computed(() => new URL(this.links.href(this.id()), location.href).href);
}
```

At the end it shows a link to itself, the one that would go by e-mail (step 5 says how it is made).

### Step 3: the layout

`src/app/app.ts` starts with the default layout: the list of the invoices on the left (a tool), the place of the documents on the right.

```ts
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
```

The constructor saves the layout after every change and registers the two components by their keys, so that a saved tab can be made again after F5:

```ts
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
```

### Step 4: the bridge

The bridge starts in `ngAfterViewInit`, because it needs the engine, and the engine is ready (with its saved layout restored) only then:

```ts
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
```

- **`resolve`** has a resolver for each type of tag. `invoice: (id) => …` gets the number from the address and gives what `openComponentTab` needs: the component, its key (for saving), the title and the inputs. The bridge adds the tag (`invoice:1001`) and the role (`document`) itself.
- **The address is untrusted input**: anybody can type anything into it, or send a link. So the resolver checks the id (`findInvoice(id)`: only an invoice that exists) and gives `null` for anything else. A type that has no resolver (`customer:1`) is not opened either.
- **`history: 'push'`** makes every invoice that is opened or shown an entry of the history of the browser, so Back goes to the one before. Without it (`'replace'`, the default) the address is only rewritten, and Back leaves the application.
- **`on('unresolved')`** tells what an address named and could not be opened, with the reason: `refused` (the resolver said `null`), `unknown-type`, or `error`. Here the user gets a warning.
- **`start()`** opens what the address names (it wins over the saved active document), and from then on the address follows the tabs: open, show, close.

### Step 5: links in the application

The list on the left and the invoices need the bridge too. `src/app/links.ts` keeps it, and writes and opens the links:

```ts
import { Injectable } from '@angular/core';
import { grdEncodeUrlState, type GrdUrlBridge } from '@gridify/studio';

/** The tag of an invoice: `invoice:1001`, the type and the number. The address is made of tags. */
export function invoiceTag(id: string): string {
  return `invoice:${id}`;
}

/**
 * The links to the invoices. The application puts the bridge here once the engine is ready (see
 * app.ts); the list and the invoices use it to open an invoice and to write a link to it.
 */
@Injectable({ providedIn: 'root' })
export class Links {
  /** The bridge between the engine and the address; `null` until the engine is ready. */
  bridge: GrdUrlBridge | null = null;

  /** The address of an invoice, as a link writes it: `?a=invoice:1001&o=invoice:1001`. */
  href(id: string): string {
    const tag = invoiceTag(id);
    // a = the active document, o = the open documents.
    return '?' + grdEncodeUrlState({ active: tag, open: [tag] });
  }

  /**
   * A click on a link to an invoice. A plain click opens the invoice here, as a tab of the engine
   * (or shows it, when it is open already). A click with Ctrl (Cmd on a Mac) or Shift is left to
   * the browser, which opens the link in a new tab or window.
   */
  open(id: string, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    // The browser does not load the page: the bridge opens the invoice and writes the address.
    event.preventDefault();
    this.bridge?.open(invoiceTag(id));
  }
}
```

- **`href(id)`** is the address of an invoice. `grdEncodeUrlState` writes it the way the bridge reads it: `?a=invoice:1001&o=invoice:1001`.
- **`open(id, event)`** is for a click on such a link. A plain click opens the invoice here (`bridge.open` shows it when it is open already, and opens it through the resolver otherwise); a click with Ctrl or Shift is left to the browser, which opens the link in a new tab or window.

`src/app/invoice-list.ts` makes each invoice a real link, with an address and the click:

<!-- prettier-ignore -->
```html
<a [href]="links.href(invoice.id)" (click)="links.open(invoice.id, $event)">
  Invoice {{ invoice.id }}
</a>
```

A real link (`href`) is worth it: the browser can copy it, bookmark it and open it in a new tab, and a screen reader knows it is a link.

### Step 6: from the menu

The menu opens an invoice the same way, by its tag:

```ts
// The same as a link in the application: open (or show) an invoice by its tag.
{ label: 'Open invoice 100&3', run: () => this.links.bridge?.open(invoiceTag('1003')) },
{
  label: 'Open invoice &9999 (there is none)',
  run: () => this.links.bridge?.open(invoiceTag('9999')),
},
```

### Step 7: run it

```
npm run tutorial 042
```

## Try it

1. **A document in the address.** Click **Invoice 1001**: a tab opens, and the address ends with `/?a=invoice:1001&o=invoice:1001`.
2. **Two documents.** Click **Invoice 1003**: `?a=invoice:1003&o=invoice:1001,invoice:1003`. Click the tab of 1001: `a` says `invoice:1001` now.
3. **Back and Forward.** Press Back in the browser: Invoice 1001 is shown again. Forward: 1003. The page does not load again; the bridge only switches the tabs.
4. **F5.** The same invoices, the same one shown, in the same places: the layout comes from `localStorage`, the address says which invoices.
5. **A link for somebody else.** An invoice shows a link to itself. Open it in a private window of the browser (a browser without the saved layout): the application starts with the default layout and that one invoice.
6. **Ctrl+click** an invoice in the list: it opens in a new tab of the browser, and this tab stays as it was.
7. **An invoice that does not exist.** Change the end of the address to `?a=invoice:9999` and press Enter (or choose **File › Open invoice 9999**): a warning says _Not opened: invoice:9999 (refused)_, and nothing opens. `?a=customer:1`: _unknown-type_.
8. **Closing.** Close an invoice: the address forgets it. Close all of them (or **File › Reset layout**): the address is empty.
9. **The menu.** **File › Open invoice 1003** opens it, or shows it when it is open already.

## More

- **The hash instead of the query.** `location: new GrdHashLocation()` keeps the documents after `#` (`#a=invoice:1001`): that part is never sent to the server, so it suits a server that serves the page as it is.
- **The address decides.** `sync: 'exact'` closes the documents that a changed address does not name (a changed document can refuse, through `tabConfirmClose`). The default `'add'` leaves them open.
- **A real server.** The invoice component loads its invoice from the server by its id; the resolver only checks that the id looks right (`/^\d+$/.test(id)`), and may ask whether the user may see it (`auth.can(...)`, see 191).
- **With the Angular router** (050), a navigation of the router must keep the query (`queryParamsHandling: 'preserve'`). The README of the engine (_URL bridge_) says more.
- **The last step out.** Back from the first document leaves the application. 044 holds that press and lets the application decide: stay, say why, or ask (`provideGrdBackButton`).

## The code

`src/app/app.ts`:

```ts
import { AfterViewInit, Component, DestroyRef, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
  GrdToast,
  GrdUrlBridge,
} from '@gridify/studio';
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
    <grd-menu-bar [menus]="menus" />
    <!-- The engine keeps WHERE the tabs are (localStorage); the address says WHICH invoices are open. -->
    <grd-docking-engine layoutStorageKey="tutorial-042-layout" [defaultLayout]="layout" />
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

  protected readonly menus: GrdMenu[] = [
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
  ];
}
```

## Build it yourself

`npm run tutorial:eject 042 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, and add the files `invoices.ts`, `invoice-page.ts`, `invoice-list.ts` and `links.ts` to `src/app`, and replace `app.ts` with the one above.
