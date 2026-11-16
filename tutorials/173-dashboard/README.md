# 173 – A dashboard

This tutorial shows a board of widgets (`grd-widget-grid`) in a docking application: tiles with live business figures that the user arranges, with a digital display, a progress bar and lights, and a feed of the orders as a tool. You will learn how to:

- describe the widgets that can be put on the board (`GrdWidgetDef`);
- keep where they stand as plain data, and save it (`[(layout)]`, `GrdWidgetLayout`);
- switch the board into the edit mode, where the user moves, stretches, adds and removes widgets (`[(editing)]`);
- let a widget change its look with its size (a container query), or ask for its size (`injectGrdWidget`);
- show live data in several places at once, from one service.

```
npm run tutorial 173
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30173: a new order comes every three seconds.

## The words first

- **A widget** is a tile of the board: a title and a component. The board knows the widgets that _can_ be on it (the definitions), and the ones that _are_ on it (the layout).
- **The layout** is a list of places in cells: `{ id, x, y, w, h }` (the column and the row from the top left, the width and the height). The board never changes your list: it gives a new one after every change of the user.
- **The edit mode** shows the cells under the widgets: the user drags a widget by its header, stretches it by the corner, takes it off with the cross, and adds one from the list at the top.

## Step by step

### Step 1: the live data

`src/app/live-orders.ts` plays a server that pushes the orders of today:

```ts
import { computed, Injectable, signal } from '@angular/core';

/** An order that came in. */
export interface Order {
  readonly id: number;
  readonly customer: string;
  readonly amount: number;
  readonly time: string;
}

const CUSTOMERS = [
  'Northwind',
  'Contoso',
  'Fabrikam',
  'Kavárna Slavia',
  'Tailspin Toys',
  'Adventure Works',
];

/** The goal of the month in euros: the progress bar of the dashboard goes towards it. */
export const MONTHLY_GOAL = 50_000;

/**
 * A pretend live feed: a new order comes every three seconds, as if a server pushed it. The
 * widgets and the tool read the same signals, so they all change together.
 */
@Injectable({ providedIn: 'root' })
export class LiveOrders {
  private nextId = 1001;

  /** The orders of today, the newest first. */
  readonly orders = signal<readonly Order[]>([]);
  /** The revenue of the month before today. */
  private readonly earlier = 31_250;

  readonly count = computed(() => this.orders().length);
  readonly revenue = computed(
    () => this.earlier + this.orders().reduce((sum, order) => sum + order.amount, 0),
  );
  /** The customers with the most money today, the first three. */
  readonly topCustomers = computed(() => {
    const totals = new Map<string, number>();
    for (const order of this.orders())
      totals.set(order.customer, (totals.get(order.customer) ?? 0) + order.amount);
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 3);
  });

  constructor() {
    // Three orders at the start, then one every three seconds.
    for (let i = 0; i < 3; i++) this.arrive();
    setInterval(() => this.arrive(), 3000);
  }

  private arrive(): void {
    const order: Order = {
      id: this.nextId++,
      customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      amount: 50 + Math.round(Math.random() * 450),
      time: new Date().toLocaleTimeString(),
    };
    this.orders.update((orders) => [order, ...orders]);
  }
}

/** Money as text: €1,250. */
export function euro(amount: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
```

Everything is a signal (`orders`) or computed from it (`count`, `revenue`, `topCustomers`): whoever reads them is up to date by itself.

### Step 2: the widgets

`src/app/widgets.ts` has four small components. Each is an ordinary Angular component; the board puts it into a tile.

```ts
import { Component, inject } from '@angular/core';
import { GrdDigitalDisplay, GrdLed, GrdProgressBar, injectGrdWidget } from '@gridify/studio';
import { euro, LiveOrders, MONTHLY_GOAL } from './live-orders';

/** A widget: the number of the orders of today, on a digital display. */
@Component({
  selector: 'app-orders-widget',
  imports: [GrdDigitalDisplay],
  template: `
    <grd-digital-display [value]="live.count()" [digits]="4" />
    <p>orders today</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    p {
      margin: 4px 0 0;
      opacity: 0.88;
    }
  `,
})
export class OrdersWidget {
  protected readonly live = inject(LiveOrders);
}

/** A widget: the revenue of the month on its way to the goal. */
@Component({
  selector: 'app-revenue-widget',
  imports: [GrdProgressBar],
  template: `
    <grd-progress-bar
      [value]="live.revenue()"
      [max]="goal"
      [label]="euro(live.revenue()) + ' of ' + euro(goal)"
      showValue
    />
  `,
})
export class RevenueWidget {
  protected readonly live = inject(LiveOrders);
  protected readonly goal = MONTHLY_GOAL;
  protected readonly euro = euro;
}

/** A widget: the state of the services, as lights. */
@Component({
  selector: 'app-services-widget',
  imports: [GrdLed],
  template: `
    <grd-led variant="success" label="Web shop" />
    <grd-led variant="success" label="Payments" />
    <!-- A light that blinks catches the eye: the mail server is slow. -->
    <grd-led variant="warning" animation="blink" label="Mail (slow)" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `,
})
export class ServicesWidget {}

/** A widget: the best customers of today. A wide widget shows the amounts too. */
@Component({
  selector: 'app-customers-widget',
  template: `
    <ol>
      @for (entry of live.topCustomers(); track entry[0]) {
        <li>
          <span>{{ entry[0] }}</span>
          <span class="amount">{{ euro(entry[1]) }}</span>
        </li>
      }
    </ol>
    <p class="size">{{ widget.size().w }} × {{ widget.size().h }} cells</p>
  `,
  styles: `
    ol {
      margin: 0;
      padding-left: 1.2em;
    }
    li span {
      margin-right: 8px;
    }
    /* The body of a widget is a container named grd-widget: a narrow widget hides the amounts. */
    .amount {
      display: none;
    }
    @container grd-widget (min-width: 300px) {
      .amount {
        display: inline;
        font-weight: bold;
      }
    }
    .size {
      margin: 8px 0 0;
      opacity: 0.88;
      font-size: 0.85em;
    }
  `,
})
export class CustomersWidget {
  protected readonly live = inject(LiveOrders);
  protected readonly euro = euro;
  /** What the widget knows about its place on the board: its size in cells, among others. */
  protected readonly widget = injectGrdWidget();
}
```

- **`grd-digital-display`** shows a number on the digits of a display (`[digits]="4"`: four places).
- **`grd-progress-bar`** shows the revenue on its way to the goal, with a label and the percent (`showValue`).
- **`grd-led`** is a light with a label: `variant` gives its color, `animation="blink"` makes it blink.
- **The best customers** change with the width: the body of every widget is a container named `grd-widget`, so `@container grd-widget (min-width: 300px)` shows the amounts only in a wide tile. `injectGrdWidget()` tells a widget where it stands: here its size in cells (`widget.size()`).

### Step 3: the board

`src/app/dashboard-page.ts` is the document with the board:

```ts
import { Component, effect, signal } from '@angular/core';
import { GrdButton, type GrdWidgetDef, GrdWidgetGrid, type GrdWidgetLayout } from '@gridify/studio';
import { CustomersWidget, OrdersWidget, RevenueWidget, ServicesWidget } from './widgets';

/** What can be put on the board. The id names a widget in the saved layout: a word, not a number. */
const WIDGETS: GrdWidgetDef[] = [
  { id: 'orders', title: 'Orders today', component: OrdersWidget, defaultSize: { w: 1, h: 1 } },
  {
    id: 'revenue',
    title: 'Revenue of the month',
    component: RevenueWidget,
    defaultSize: { w: 2, h: 1 },
  },
  { id: 'services', title: 'Services', component: ServicesWidget, minSize: { w: 1, h: 1 } },
  {
    id: 'customers',
    title: 'Best customers',
    component: CustomersWidget,
    defaultSize: { w: 2, h: 1 },
  },
];

/** Where the widgets stand at the start: x and y in cells from the top left, w and h in cells. */
const START: GrdWidgetLayout = [
  { id: 'orders', x: 0, y: 0, w: 1, h: 1 },
  { id: 'revenue', x: 1, y: 0, w: 2, h: 1 },
  { id: 'services', x: 0, y: 1, w: 1, h: 1 },
];

/** The key in localStorage under which the board is kept. */
const KEY = 'tutorial-173-board';

/** The board as it was saved, or the one of the start. */
function savedLayout(): GrdWidgetLayout {
  try {
    const text = localStorage.getItem(KEY);
    return text ? (JSON.parse(text) as GrdWidgetLayout) : START;
  } catch {
    return START;
  }
}

/** The document: the board of widgets. */
@Component({
  selector: 'app-dashboard-page',
  imports: [GrdButton, GrdWidgetGrid],
  template: `
    <div class="bar">
      <grd-button
        [label]="editing() ? 'Done' : 'Edit the board'"
        [variant]="editing() ? 'primary' : 'default'"
        (pressed)="editing.set(!editing())"
      />
      <grd-button label="Start again" (pressed)="layout.set(start)" />
    </div>
    <!-- [(layout)] and [(editing)] are two-way: the board gives a new layout after every change. -->
    <grd-widget-grid [widgets]="widgets" [(layout)]="layout" [(editing)]="editing" />
  `,
  styles: `
    :host {
      display: block;
      padding: 12px;
    }
    .bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
  `,
})
export class DashboardPage {
  protected readonly widgets = WIDGETS;
  protected readonly start = START;
  protected readonly layout = signal<GrdWidgetLayout>(savedLayout());
  protected readonly editing = signal(false);

  constructor() {
    // The layout is plain data: it is kept whenever it changes, and comes back after F5.
    effect(() => {
      const text = JSON.stringify(this.layout());
      try {
        localStorage.setItem(KEY, text);
      } catch {
        // The storage is off or full: the board works, it only starts again after F5.
      }
    });
  }
}
```

- **`WIDGETS`** are the definitions: the `id` (what the saved layout names a widget by: a word, never a number of the list), the `title`, the `component`, and its sizes in cells (`defaultSize` when it is added, `minSize`, `maxSize`).
- **`START`** is the layout of the start: three widgets on the board. _Best customers_ is not there; it waits in the list of the edit mode.
- **`[(layout)]`** binds both ways: the board shows `layout`, and sets it after every move. An `effect` keeps it in `localStorage`, and `savedLayout()` reads it back at the start. A saved layout that is not right any more (a widget that was removed from `WIDGETS`) is put right by the board.
- **`[(editing)]`** is the edit mode; the button _Edit the board_ switches it, and _Start again_ gives the board the layout of the start.

### Step 4: the feed and the layout

`src/app/feed-tool.ts` lists the orders as they come; `src/app/app.ts` puts the board and the feed into the engine:

```ts
/** The dashboard (a document) in the middle, the live feed (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 72,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'dashboard', role: 'document', title: 'Dashboard', componentKey: 'dashboard' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 28,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'feed', role: 'tool', title: 'Live feed', componentKey: 'feed' }],
    },
  ],
};
```

The board and the feed read the same `LiveOrders`, so a new order is in the feed, on the display and in the revenue at the same moment.

### Step 5: run it

```
npm run tutorial 173
```

## Try it

1. **Live.** Watch the board: every three seconds the number of orders grows, the revenue moves on, and the feed on the right has a new line.
2. **The edit mode.** Press **Edit the board**: the cells show under the widgets, every widget has a grip, a cross and a handle at its corner.
3. **Move.** Drag _Revenue of the month_ by its header to another place: the others make room, and float up when the room is free again.
4. **Stretch.** Drag the corner of _Orders today_ to make it two cells wide.
5. **Add.** Choose _Best customers_ in the list at the top and press **Add**: it lands on the first free place where it fits (two cells), with the amounts.
6. **Narrow.** With the focus on the grip of _Best customers_, press Shift+Left: it is one cell wide, and the amounts are gone (the container query). It says _1 × 1 cells_.
7. **The keys.** On a grip, the arrows move a widget a cell, Shift and the arrows change its size, Delete takes it off.
8. **Done, then F5.** Press **Done** and reload the page: the board is as you left it (`localStorage`), and so are the tabs of the engine. **Start again** gives back the board of the start.

## More

- **The edit mode from the outside**: `[toolbar]="false"` takes the list and Add away, and the page adds widgets itself (`add(id)`, `remove(id)`).
- **Without titles**: `[titles]="false"` leaves only the widgets in the view (the edit mode keeps the titles, they are the grips).
- **The size of the cells**: `cellWidth` (the least width of a cell, 160 px), `rowHeight` (120 px) and `gap` (12 px).
- **A layout for each user**: keep it under a key of the user (`auth.userKey('tutorial-173-board')`, see 122 and 194).

## Build it yourself

`npm run tutorial:eject 173 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `live-orders.ts`, `widgets.ts`, `dashboard-page.ts` and `feed-tool.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
