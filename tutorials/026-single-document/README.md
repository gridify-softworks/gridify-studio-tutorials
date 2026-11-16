# 026 – A single document (SDI)

This tutorial shows how to build a single-document application (SDI, as the desktop programs of MFC called it) with the docking engine: one document fills the middle of the window without a tab, and tools dock around it. You will learn how to:

- make the document of the application the empty document area of the engine (`emptyDocument`), so it has no tab strip;
- keep the document in a service of the application (signals), because the empty area is not a tab: the engine neither saves it nor marks it as changed;
- put tools around it in a default layout and close and open them from the View menu (`viewSources`, the block `grd:tools`, tags);
- save the document under a key of its own (**File › Save**, Ctrl+S) while the engine saves the layout under another.

025 showed the empty document area as a caption or a small component while no document is open. Here it is the document itself: an order with a form and a table, and there is no New document or Open anywhere. The engine of most tutorials is an MDI application (many documents in tabs); this one is SDI. Its number lies between 025 and 030, because it goes deeper into the empty content of 025; it is the roles mode of 025 with other components.

```
npm run tutorial 026
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30026, type a customer, change a quantity in the table, and watch **Summary** on the right and **Log** at the bottom. Then drag the panels around and press F5.

Every tutorial runs on an address of its own (this one on http://localhost:30026), so it has a `localStorage` of its own. It still keeps its layout under `tutorial-026-layout` and its document under `tutorial-026-document`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 025 (or one made by `npm run tutorial:eject 025 path/to/new-folder` in the root of the repository). Its counter, its clock and its empty area are not needed: the order, Summary and Log take their places.

### Step 1: the document in a service

The empty document area is not a tab: it has no `GrdTabContext` (no `setDirty`, no `requestSave`) and nothing of it is saved with the layout. So the document lives in a service of the application, `src/app/order.ts`: the customer, the date and the lines as signals, and what is computed from them.

```ts
@Injectable({ providedIn: 'root' })
export class OrderStore {
  readonly customer = signal('');
  readonly date = signal('');
  readonly lines = signal<OrderLine[]>([]);
  /** Something changed since the last save. */
  readonly changed = signal(false);
```

```ts
  readonly pieces = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() => round(this.lines().reduce((sum, line) => sum + line.amount, 0)));
```

It saves the order itself, under a key of its own, and reads it back when the application starts (the sample order when nothing is saved):

```ts
  save(): void {
    const order: SavedOrder = { customer: this.customer(), date: this.date(), lines: this.lines() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
```

It also counts how many times the component of the document was made (`documentMade`), and keeps a log: the tutorial uses both to show what the engine does with the component.

### Step 2: the document

`src/app/order-document.ts` is an ordinary component: a group box with the customer and the date, and a grid with the lines. Everything it shows comes from the store, and every change goes there:

```html
<grd-input
  label="Customer"
  required
  [value]="order.customer()"
  (valueChange)="order.setCustomer($event)"
/>
```

The quantity is edited in the table (`editable`), the amount is added up in the row of totals (`footer: 'sum'`), and the grid shows the lines of the store again whenever they change:

```ts
effect(() => this.source.setRows(this.order.lines()));
```

```ts
  protected edit(edit: GrdGridCellEdit): void {
    if (edit.field === 'quantity') {
      this.order.setQuantity(Number(edit.rowId), edit.value as number | null);
    }
  }
```

Its host fills the area (`height: 100%`) and scrolls when the window is small.

### Step 3: the tools

`src/app/summary-tool.ts` shows the order at a glance and `src/app/log-tool.ts` what happened. Both read the same store, so they follow the document without any message between them:

```html
<dt>Total</dt>
<dd class="total">{{ total() }}</dd>
```

### Step 4: the engine

In `src/app/app.ts` the document is the empty document area, and the default layout has a document panel without tabs, Summary on its right and Log under both. The tools have tags (`summary`, `log`), so the View menu finds them and a closed tool comes back to its place (123):

```html
<grd-docking-engine
  layoutStorageKey="tutorial-026-layout"
  [defaultLayout]="layout"
  [emptyDocument]="document"
  viewSources
/>
```

```ts
  protected readonly document = OrderDocument;
```

```ts
          tabs: [{ tag: 'summary', role: 'tool', title: 'Summary', componentKey: 'summary' }],
```

The roles mode is set on purpose: in the free mode the empty area shows only while no panel is docked at all (020), so the first tool would take its place.

```ts
settings.setDockingMode('roles');
```

The menus have no New document and no Open: File has **Save** (Ctrl+S) and **Reset layout**, View has the tools.

```ts
        { label: '&Save', shortcut: 'Mod+S', run: () => this.order.save() },
```

### Step 5: run it

```
npm run tutorial 026
```

## Try it

1. **Start.** The order fills the middle: a group box and a table, no tab above them. **Summary** says _Document made 1×_ and _Nothing changed_.
2. **Type another customer.** Summary follows at once and says _Unsaved changes_.
3. **Double-click the quantity of the desk lamp, type 4, press Enter.** The amount, the row of totals (Σ €471.30), Summary (19 pieces) and Log follow.
4. **Drag the line between the order and Summary**, then **drag the tab Summary over the order.** There is no anchor in the middle of the order (a tool does not go into the document area), so released there it floats. Summary still says _Document made 1×_: the engine kept the component, with its table as it was.
5. **View › Log**, then **View › Log** again. Log closes and comes back under the order, where it was.
6. **File › Reset layout.** Summary is back on the right, and it says _Document made 2×_: a reset makes every component of the engine anew, the document too. The order is the same, because it lives in the store.
7. **Ctrl+S, then F5.** The saved order comes back, Summary says _Nothing changed_, and Log says _The saved order is open_. The layout comes back too, as in 015.
8. **See it.** In the developer tools of the browser, _Application › Local storage › http://localhost:30026_ has `tutorial-026-layout` (the engine) and `tutorial-026-document` (the store).

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { LogTool } from './log-tool';
import { OrderStore } from './order';
import { OrderDocument } from './order-document';
import { SummaryTool } from './summary-tool';

/** The document area in the middle, Summary on its right, Log under both. The document area has no tabs: the order fills it. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    {
      type: 'row',
      size: 75,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 70,
          activeTab: 0,
          collapsed: false,
          tabs: [],
        },
        {
          tag: 'right',
          type: 'panel',
          role: 'tool',
          size: 30,
          activeTab: 0,
          collapsed: false,
          tabs: [{ tag: 'summary', role: 'tool', title: 'Summary', componentKey: 'summary' }],
        },
      ],
    },
    {
      tag: 'bottom',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" shortcuts />
    <!-- the document is the empty document area: no tab, no tab strip -->
    <grd-docking-engine
      layoutStorageKey="tutorial-026-layout"
      [defaultLayout]="layout"
      [emptyDocument]="document"
      viewSources
    />
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
  private readonly order = inject(OrderStore);
  protected readonly layout = LAYOUT;
  protected readonly document = OrderDocument;

  constructor() {
    const settings = inject(GrdEngineSettings);
    // Documents go into the document area, tools around it (the default mode). The free mode would not do: there the empty area shows only
    // when no panel is docked at all.
    settings.setDockingMode('roles');
    settings.setAutoSaveLayout(true);
    // The tools are saved with the layout by their keys.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('summary', SummaryTool);
    registry.registerComponent('log', LogTool);
  }

  // No New document, no Open: the application has one document.
  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: '&Save', shortcut: 'Mod+S', run: () => this.order.save() },
        { separator: true },
        {
          label: '&Reset layout',
          run: () => {
            this.engine().resetLayout();
            this.order.write('The layout is reset');
          },
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      // One item for every tool, with a check mark while it is open: a click closes or opens it.
      items: [{ source: 'grd:tools' }],
    },
  ];
}
```

`src/app/order.ts`:

```ts
import { computed, Injectable, signal } from '@angular/core';

/** One line of the order: an item, how many, the price of one, and what they cost together. */
export interface OrderLine {
  id: number;
  item: string;
  quantity: number;
  price: number;
  amount: number;
}

/** The order as it is saved: the customer, the date and the lines. */
interface SavedOrder {
  customer: string;
  date: string;
  lines: OrderLine[];
}

/** Where the order is kept in localStorage (the layout has a key of its own). */
const STORAGE_KEY = 'tutorial-026-document';

/** The order of the first start, before anything is saved. */
const SAMPLE: SavedOrder = {
  customer: 'Alice Brown',
  date: '2026-11-02',
  lines: [
    { id: 1, item: 'Desk lamp', quantity: 2, price: 39.9, amount: 79.8 },
    { id: 2, item: 'Office chair', quantity: 1, price: 189, amount: 189 },
    { id: 3, item: 'Notebook A5', quantity: 10, price: 3.5, amount: 35 },
    { id: 4, item: 'Monitor stand', quantity: 1, price: 49, amount: 49 },
    { id: 5, item: 'USB-C cable', quantity: 3, price: 12.9, amount: 38.7 },
  ],
};

const round = (value: number): number => Math.round(value * 100) / 100;
const time = (): string => new Date().toLocaleTimeString('en-GB');

/**
 * The document of the application: one order. It lives here, in a service, and not in the component that shows it: the component fills the empty
 * document area of the engine, which is not a tab, so the engine neither saves it with the layout nor marks it as changed.
 */
@Injectable({ providedIn: 'root' })
export class OrderStore {
  readonly customer = signal('');
  readonly date = signal('');
  readonly lines = signal<OrderLine[]>([]);
  /** Something changed since the last save. */
  readonly changed = signal(false);
  /** The time of the last save while the page runs. */
  readonly savedAt = signal<string | null>(null);
  /** How many times the component of the document was made: the engine makes it once and keeps it. */
  readonly documentsMade = signal(0);
  /** What happened, the newest first. */
  readonly log = signal<string[]>([]);

  readonly pieces = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() => round(this.lines().reduce((sum, line) => sum + line.amount, 0)));

  constructor() {
    const saved = this.read();
    const order = saved ?? SAMPLE;
    this.customer.set(order.customer);
    this.date.set(order.date);
    this.lines.set(order.lines);
    this.write(saved ? 'The saved order is open' : 'A sample order is open (nothing saved yet)');
  }

  setCustomer(customer: string): void {
    this.customer.set(customer);
    this.changed.set(true);
  }

  setDate(date: string): void {
    this.date.set(date);
    this.changed.set(true);
  }

  /** A new quantity of a line: its amount follows. */
  setQuantity(id: number, quantity: number | null): void {
    const pieces = quantity ?? 0;
    this.lines.update((lines) =>
      lines.map((line) =>
        line.id === id ? { ...line, quantity: pieces, amount: round(pieces * line.price) } : line,
      ),
    );
    this.changed.set(true);
    const line = this.lines().find((one) => one.id === id);
    this.write(`${line?.item}: ${pieces} pieces`);
  }

  /** File › Save: the whole order under its own key. */
  save(): void {
    const order: SavedOrder = { customer: this.customer(), date: this.date(), lines: this.lines() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      this.write('The order could not be saved (localStorage is off or full)');
      return;
    }
    this.changed.set(false);
    this.savedAt.set(time());
    this.write('The order is saved');
  }

  /** The component of the document tells that it was made. */
  documentMade(): void {
    this.documentsMade.update((count) => count + 1);
    this.write(`The document component is made (${this.documentsMade()}×)`);
  }

  /** A line of the log. */
  write(text: string): void {
    this.log.update((lines) => [`${time()}  ${text}`, ...lines].slice(0, 50));
  }

  private read(): SavedOrder | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      return text ? (JSON.parse(text) as SavedOrder) : null;
    } catch {
      return null;
    }
  }
}
```

`src/app/order-document.ts`:

```ts
import { Component, effect, inject } from '@angular/core';
import {
  GrdDatePicker,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdGroupBox,
  GrdInput,
  tkx,
  type GrdGridCellEdit,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { OrderStore, type OrderLine } from './order';

const EUR = { style: 'currency', currency: 'EUR' } as const;

/**
 * The document: the order, a form and a table. It is the empty document area of the engine (`emptyDocument`), so it fills the middle of the
 * window without a tab. What it shows lives in `OrderStore`.
 */
@Component({
  selector: 'app-order-document',
  imports: [GrdDatePicker, GrdGrid, GrdGroupBox, GrdInput],
  template: `
    <!-- the trick of this tutorial, said on the page itself -->
    <p class="note">
      A single-document application (SDI), as the desktop programs of MFC had it, made with one
      trick: this order is the empty document area of the docking engine
      (<code>emptyDocument</code>), so it fills the middle of the window without a tab, and the
      tools dock around it.
    </p>
    <grd-group-box heading="Order" icon="grd:document">
      <grd-input
        label="Customer"
        required
        [value]="order.customer()"
        (valueChange)="order.setCustomer($event)"
      />
      <grd-date-picker label="Date" [value]="order.date()" (valueChange)="order.setDate($event)" />
    </grd-group-box>
    <!-- the quantity is edited in the table; the row of totals adds up the amounts -->
    <grd-grid
      [columns]="columns"
      [dataSource]="source"
      (cellEdited)="edit($event)"
      ariaLabel="Items of the order"
    />
  `,
  styles: `
    :host {
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      overflow: auto;
    }
    .note {
      margin: 0;
      max-width: 60em;
      line-height: 1.5;
    }
    grd-group-box {
      --grd-group-box-columns: repeat(auto-fit, minmax(min(12em, 100%), 1fr));
    }
    grd-grid {
      flex: 1;
      min-height: 12em;
    }
  `,
})
export class OrderDocument {
  protected readonly order = inject(OrderStore);

  protected readonly columns: GrdGridColumnDef<OrderLine>[] = [
    { field: 'item', header: 'Item', sortable: true },
    {
      field: 'quantity',
      header: 'Quantity',
      type: 'number',
      editable: true,
      editorOptions: { min: 0, max: 999, step: 1 },
    },
    { field: 'price', header: 'Price', type: 'number', format: EUR },
    { field: 'amount', header: 'Amount', type: 'number', format: EUR, footer: 'sum' },
  ];

  protected readonly source = new GrdGridArrayDataSource<OrderLine>(this.order.lines(), {
    getRowId: (line) => line.id,
    i18n: { text: tkx },
  });

  constructor() {
    this.order.documentMade();
    // The lines live in the store: the table shows them again whenever they change.
    effect(() => this.source.setRows(this.order.lines()));
  }

  /** `cellEdited`: the grid changes no data; the store does, and the table follows it. */
  protected edit(edit: GrdGridCellEdit): void {
    if (edit.field === 'quantity') {
      this.order.setQuantity(Number(edit.rowId), edit.value as number | null);
    }
  }
}
```

`src/app/summary-tool.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { OrderStore } from './order';

const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

/** A tool: the order at a glance. It reads the same store as the document, so it follows every change. */
@Component({
  selector: 'app-summary-tool',
  template: `
    <dl>
      <dt>Customer</dt>
      <dd>{{ order.customer() || '—' }}</dd>
      <dt>Items</dt>
      <dd>{{ order.lines().length }} lines, {{ order.pieces() }} pieces</dd>
      <dt>Total</dt>
      <dd class="total">{{ total() }}</dd>
      <dt>Saved</dt>
      <dd>{{ saved() }}</dd>
      <dt>Document made</dt>
      <dd>{{ order.documentsMade() }}×</dd>
    </dl>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px;
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 12px;
      margin: 0;
    }
    dt {
      /* the text color a little fainter (88 %), so it keeps its contrast in every theme */
      opacity: 0.88;
    }
    dd {
      margin: 0;
    }
    .total {
      font-weight: 600;
    }
  `,
})
export class SummaryTool {
  protected readonly order = inject(OrderStore);
  protected readonly total = computed(() => money.format(this.order.total()));
  protected readonly saved = computed(() => {
    if (this.order.changed()) return 'Unsaved changes';
    const at = this.order.savedAt();
    return at ? `Saved at ${at}` : 'Nothing changed';
  });
}
```

`src/app/log-tool.ts`:

```ts
import { Component, inject } from '@angular/core';
import { OrderStore } from './order';

/** A tool: what happened to the order, the newest first. */
@Component({
  selector: 'app-log-tool',
  template: `
    <ul>
      @for (line of order.log(); track $index) {
        <li>{{ line }}</li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--grd-font-mono);
    }
  `,
})
export class LogTool {
  protected readonly order = inject(OrderStore);
}
```

`src/app/app.config.ts`, `src/main.ts` and `src/styles.scss` are the ones of 025.

## How it fits together

### The document is the empty area

- **No tab, no header.** In the roles mode the document panel that has no tab shows `emptyDocument`, and that panel has no header: no tab, no title, no collapse button, the whole panel is the content (the engine draws it so in `grd-panel-renderer.ts`). The application opens no document tab, so the area is always empty and always shows the order.
- **Made once, kept.** The engine makes the component when the area appears and keeps it while it is shown: docking, floating, a splitter, closing and opening a tool draw the panels again, but the component stays (the engine keeps it under one id, `EMPTY_DOCUMENT_TAB_ID` in `grd-engine-core.ts`). Its own state survives all of that: sort the table, float a tool, and the table is still sorted.
- **Made anew.** The component is destroyed when a document tab takes the area, when `emptyDocument` changes, and on **Reset layout** and on loading a layout (`resetLayout()`, `loadLayout()`), which make every component of the engine anew. Then the next one shows the store again, and Summary counts one more.
- **Only the roles mode.** In the free mode a tool may go into any panel, and the empty area is shown only while no panel is docked at all (020).

### What it is not

The order is not a tab, so it has none of what a tab has:

- no title in a tab strip, no menu of a tab, no close button;
- it cannot float, and it cannot go to a popout window (140);
- the engine does not count it as a document: it is not in `documents()`, not the `activeDocumentTab()`, and not in the block `grd:documents` of the View menu (that block lists the open document tabs, so it would stay empty here, and the View menu leaves it out);
- nothing of it is saved with the layout (no `GrdPersistable`, no `setDirty`): the store saves it.

A document tab opened by code (`openComponentTab` or `openHtmlTab` without `role: 'tool'`) would take the area: the order goes away, and comes back, made anew, when that tab is closed. That is why this application has no command that opens a document.

### The store

The store is the document: a service of the application (`providedIn: 'root'`), made once for the whole page, with the data as signals. The component of the document, Summary and Log only read it and call its methods, so it does not matter which of them exists at the moment or how often the engine makes them. It saves the order under its own key; the engine saves the layout under its key (`setAutoSaveLayout(true)`, as in 015), and the two do not know about each other.

## What you get without writing any of it

- **A document without a tab.** The empty document area has no header, and tools cannot be docked into it, only beside it.
- **The tools of a docking application.** Dragging, splitting, floating windows, closing; the View menu with a check mark for every tool; a closed tool coming back to its place (by its tag).
- **The layout after F5**, and **File › Reset layout** back to the default one.
- **The shortcut.** `Mod+S` is shown as Ctrl+S (⌘S on a Mac) and works while the menu is closed.
- **The table.** Editing a number with its limits, the formats of the money, the row of totals.

## Build it from 025

The quick way: `npm run tutorial:eject 026 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 025.

1. Start from your application of 025 (or one made by `npm run tutorial:eject 025 path/to/new-folder` in the root of the repository) and delete `counter.ts`, `clock-tool.ts` and `empty-area.ts`.
2. Add `order.ts`, `order-document.ts`, `summary-tool.ts` and `log-tool.ts` (see the code above).
3. In `app.ts`, give the engine the default layout, the document as its empty area, the View blocks and its own key:

   ```html
   <grd-docking-engine
     layoutStorageKey="tutorial-026-layout"
     [defaultLayout]="layout"
     [emptyDocument]="document"
     viewSources
   />
   ```

4. Register the tools instead of the clock and the counter, and keep the roles mode and the automatic saving:

   ```ts
   registry.registerComponent('summary', SummaryTool);
   registry.registerComponent('log', LogTool);
   ```

5. Replace the menus: File with Save and Reset layout, View with the block `grd:tools`. The menus are a plain array again (no `computed`: nothing in them changes), and the menu bar gets `shortcuts` for Ctrl+S.
