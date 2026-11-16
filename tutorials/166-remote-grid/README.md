# 166 – Rows from a server

This tutorial shows how to show rows that live on a server: the grid asks for the pages it shows, and the server sorts and filters them. You will learn how to:

- give the grid a data source that asks a server for one page at a time (`GrdGridRemoteDataSource`);
- answer its questions on the server: the rows from `start` to `end`, after the filters and the sorting, and their count (`GrdGridRemoteFetchParams`, `GrdGridRemoteFetchResult`);
- stop a request that nobody needs any more, when the user scrolls on (`signal`);
- show an error of the server, and let the user try again (`retry`, Try again);
- scroll through all the rows, or go page by page (`mode`), and load the data again (the bar item `refresh`).

It is the grid of 160 with the filters of 161, over 20 000 people of a pretend server instead of an array, from the series about the grid (160–168).

```
npm run tutorial 166
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30166, drag the scrollbar of the grid down fast, click the title **Salary**, and type `jana` under **Name**. Watch the line under the grid.

## Step by step

Start from the application of 161 (or one made by `npm run tutorial:eject 161 path/to/new-folder` in the root of the repository).

### Step 1: a server

A real application asks its API. This one has a pretend server in the page, `src/app/people-server.ts` (see _The code_): it holds 20 000 people, waits a while before it answers, can fail, and counts the requests. Its one method for the grid gets a page:

```ts
/** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
  this.requests.update((count) => count + 1);
  this.lastRequest.set(describe(params));
  await this.wait(params.signal);
  const found = this.select(params);
  return {
    rows: found.slice(params.start, params.end),
    isLast: params.end >= found.length,
    // The server counts the rows, so the grid knows how long the table is at once.
    exactTotalCount: found.length,
    unfilteredTotalCount: this.people.length,
  };
}
```

`params` has the range (`start`, `end`), the sorting (`sorts`, a list of fields with their directions), the filters (`filters`, by field, the same data as in 161) and an `AbortSignal`. A real server turns the sorting and the filters into `ORDER BY` and `WHERE`; the pretend one uses the functions of the library that the array source uses:

```ts
const tests = grdGridActiveFilterEntries(params.filters).map(([field, filter]) => ({
  field: field as keyof Person,
  test: grdGridCompileFilter(filter),
}));
const found = this.people.filter((person) => tests.every((t) => t.test(person[t.field])));
const compare = grdGridCompareRows<Person>(params.sorts, 'en', SORT_TYPES);
return compare ? found.sort(compare) : found;
```

With a real API the method is one `fetch(url, { signal: params.signal })`: the signal goes with the request, so a request that the grid stops is stopped in the network too.

### Step 2: the source

`GrdGridRemoteDataSource` takes the function that gets a page, the id of a row, the size of a page, a function for the totals (167; none here), and options:

```ts
protected readonly source = new GrdGridRemoteDataSource<Person>(
  (params) => this.server.fetchPage(params),
  (person) => person.id,
  50,
  undefined,
  { retry: { attempts: 1, baseDelayMs: 500 } },
);
```

`retry` says what happens when a page fails: here one more attempt after half a second (the default is three, after 1, 2 and 4 seconds). Then the grid shows the error with **Try again**.

The source has requests and timers running, so it stops them when the page goes:

```ts
constructor() {
  // The source stops its requests and its timers with the page.
  inject(DestroyRef).onDestroy(() => this.source.destroy());
}
```

### Step 3: the grid

The grid is the grid of 161: the columns are the same, the source is another one. `filterOptions` of Department and City are written out (`DEPARTMENTS`, `CITIES`); a list of `'auto'` would need the values from the server (167). The bar has the number of rows, the chips of the filters and **Refresh**:

```html
<!-- the same grid as with an array: only the source is another one -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  [mode]="paged() ? 'pagination' : 'virtual'"
  [aboveHeader]="{ start: ['rowCount', 'filterChips'], end: ['refresh'] }"
  ariaLabel="People"
/>
```

`mode` is `virtual` by default: one long table, and the source asks for the pages as you scroll. `pagination` shows one page at a time, with the pager under the table.

### Step 4: the controls of the server

The delay and the failure of the pretend server, and the line that says what the grid asked for:

```html
<grd-select
  label="Server delay"
  [options]="delays"
  [value]="server.delay()"
  (valueChange)="server.delay.set($event ?? 0)"
  [reserveMessageSpace]="false"
/>
<grd-switch
  label="The server fails"
  [reserveMessageSpace]="false"
  [checked]="server.failing()"
  (checkedChange)="server.failing.set($event)"
/>
```

```ts
protected readonly line = computed(
  () =>
    `Requests: ${this.server.requests()} (${this.server.aborted()} stopped). ` +
    `Last: ${this.server.lastRequest()}.`,
);
```

### Step 5: run it

```
npm run tutorial 166
```

## Try it

1. **The first pages.** At the start the line says _Requests: 2_: the page you see and the next one (the source asks for it before you scroll there).
2. **Scroll fast.** Drag the scrollbar down quickly: the rows show as grey placeholders until their page comes, and the requests for the pages you passed are stopped (_… stopped_). The server gets only the pages where you stop.
3. **Sort.** Click **Salary**: the server sorts. The old rows stay, dimmed, until the first new page comes, and the table goes to the top.
4. **Filter.** Type `jana` under **Name**: the grid waits until you stop typing and sends the filter to the server. _Found 1,960 of 20,000 rows._
5. **A slow server.** Choose 3000 ms and scroll: the placeholders, and the progress bar of the grid while it waits.
6. **A failing server.** Turn on **The server fails** and press **Refresh** (or scroll to rows that are not loaded yet). After one more attempt the grid says _The data could not be loaded: The server does not answer_, with **Try again**. Turn the failure off and press **Try again**.
7. **Page by page.** Turn on **Page by page**: the pager under the table, _Page 1 / 400_, and the choice of the rows per page. Click the text of the page to jump to another one.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdGrid,
  GrdGridRemoteDataSource,
  GrdSelect,
  GrdSwitch,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { CITIES, DEPARTMENTS, type Person } from './people';
import { PeopleServer } from './people-server';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Remote grid"
      subtitle="20 000 people from a server"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-select
          label="Server delay"
          [options]="delays"
          [value]="server.delay()"
          (valueChange)="server.delay.set($event ?? 0)"
          [reserveMessageSpace]="false"
        />
        <grd-switch
          label="The server fails"
          [reserveMessageSpace]="false"
          [checked]="server.failing()"
          (checkedChange)="server.failing.set($event)"
        />
        <grd-switch label="Page by page" [reserveMessageSpace]="false" [(checked)]="paged" />
      </div>
      <!-- the same grid as with an array: only the source is another one -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [mode]="paged() ? 'pagination' : 'virtual'"
        [aboveHeader]="{ start: ['rowCount', 'filterChips'], end: ['refresh'] }"
        ariaLabel="People"
      />
      <p class="line" aria-live="polite">{{ line() }}</p>
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    main {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
    }
    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: 8px 24px;
    }
    .line {
      margin: 0;
    }
    /* The grid takes the rest of the height and scrolls its rows itself. */
    grd-grid {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  protected readonly server = new PeopleServer();

  /**
   * The rows come from the server, a page of 50 at a time: the source asks for the pages the grid
   * shows. A page that fails is asked for once more after half a second; then the grid shows the error
   * and Try again.
   */
  protected readonly source = new GrdGridRemoteDataSource<Person>(
    (params) => this.server.fetchPage(params),
    (person) => person.id,
    50,
    undefined,
    { retry: { attempts: 1, baseDelayMs: 500 } },
  );

  /** The columns of 160 with the filters of 161: the server sorts and filters now. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterOptions: DEPARTMENTS,
    },
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: CITIES },
    { field: 'age', header: 'Age', type: 'number', sortable: true, filterable: true },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    },
    {
      field: 'hired',
      header: 'Hired',
      type: 'date',
      sortable: true,
      filterable: true,
      format: 'd MMM yyyy',
    },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true, filterable: true },
  ];

  protected readonly delays = [0, 300, 1000, 3000].map((ms) => ({ value: ms, label: `${ms} ms` }));
  protected readonly paged = signal(false);

  protected readonly line = computed(
    () =>
      `Requests: ${this.server.requests()} (${this.server.aborted()} stopped). ` +
      `Last: ${this.server.lastRequest()}.`,
  );

  constructor() {
    // The source stops its requests and its timers with the page.
    inject(DestroyRef).onDestroy(() => this.source.destroy());
  }
}
```

`src/app/people-server.ts`:

```ts
import { signal } from '@angular/core';
import {
  grdGridActiveFilterEntries,
  grdGridCompareRows,
  grdGridCompileFilter,
  type GrdGridRemoteFetchParams,
  type GrdGridRemoteFetchResult,
  type GrdGridSortColumn,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

/** The types of the fields the server sorts: numbers as numbers, dates as dates, the rest as text. */
const SORT_TYPES: GrdGridSortColumn[] = [
  { field: 'id', type: 'number' },
  { field: 'age', type: 'number' },
  { field: 'salary', type: 'number' },
  { field: 'hired', type: 'date' },
  { field: 'active', type: 'boolean' },
];

/**
 * A pretend server in the page. It holds 20 000 people and answers the questions of the grid the way an
 * API over a database would: a page of rows after the filters and the sorting. A real application asks
 * its API here instead, with `fetch(url, { signal })`.
 */
export class PeopleServer {
  /** How long the server thinks before it answers, in ms. */
  readonly delay = signal(300);
  /** While it is on, every answer is an error. */
  readonly failing = signal(false);
  /** How many pages the grid asked for, and how many of the requests it stopped (aborted). */
  readonly requests = signal(0);
  readonly aborted = signal(0);
  /** The last request, as a short text. */
  readonly lastRequest = signal('nothing yet');

  private readonly people = makePeople(20_000);

  /** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
  async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
    this.requests.update((count) => count + 1);
    this.lastRequest.set(describe(params));
    await this.wait(params.signal);
    const found = this.select(params);
    return {
      rows: found.slice(params.start, params.end),
      isLast: params.end >= found.length,
      // The server counts the rows, so the grid knows how long the table is at once.
      exactTotalCount: found.length,
      unfilteredTotalCount: this.people.length,
    };
  }

  /** The work of the database: WHERE (the filters) and ORDER BY (the sorting). */
  private select(params: GrdGridRemoteFetchParams): Person[] {
    const tests = grdGridActiveFilterEntries(params.filters).map(([field, filter]) => ({
      field: field as keyof Person,
      test: grdGridCompileFilter(filter),
    }));
    const found = this.people.filter((person) => tests.every((t) => t.test(person[t.field])));
    const compare = grdGridCompareRows<Person>(params.sorts, 'en', SORT_TYPES);
    return compare ? found.sort(compare) : found;
  }

  /** The time the server takes, or its error. A request the grid stops (aborts) ends at once. */
  private wait(abort: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const stop = () => {
        clearTimeout(timer);
        this.aborted.update((count) => count + 1);
        reject(abort.reason);
      };
      const timer = setTimeout(() => {
        abort.removeEventListener('abort', stop);
        if (this.failing()) reject(new Error('The server does not answer'));
        else resolve();
      }, this.delay());
      abort.addEventListener('abort', stop, { once: true });
    });
  }
}

/** `rows 100–150, sorted by salary ↓, 2 filters` */
function describe(params: GrdGridRemoteFetchParams): string {
  const parts = [`rows ${params.start}–${params.end}`];
  const sorts = params.sorts.map((sort) => `${sort.field} ${sort.direction === 'asc' ? '↑' : '↓'}`);
  if (sorts.length) parts.push(`sorted by ${sorts.join(', ')}`);
  const filters = grdGridActiveFilterEntries(params.filters).length;
  if (filters) parts.push(filters === 1 ? '1 filter' : `${filters} filters`);
  return parts.join(', ');
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **The grid asks, the source fetches.** The grid tells the source which rows it draws; the source asks for the missing pages, keeps the pages it got (10 000 rows at most by default, the least used go first), and asks for one more page in the direction of the scrolling.
- **Requests nobody needs are stopped.** When the window leaves a page that is still loading, its `signal` aborts. While the user scrolls fast, nothing is sent until the window stops for a moment (`scrollDebounceMs`, 80 ms); after typing into a filter the source waits 250 ms (`filterDebounceMs`).
- **A sorting or a filter** drops the pages and asks again from the top; an answer that comes for the old sorting is thrown away, so the table never mixes two orders.
- **Refresh** (`source.refresh()`) loads the data again and keeps the sorting, the filters and the place in the table: the way to show what changed on the server.
- **The count.** `exactTotalCount` tells the length of the table at once, `unfilteredTotalCount` the number without filters (for _Found … of …_). Without them the table grows as the pages come (167).
- **What a server source cannot do:** grouping needs all the rows in the browser (162), so the Group button is off over this source. Totals need the server to compute them (167).

## What you get without writing any of it

- **Placeholders** for the rows whose page has not come, and a progress bar while a page of the window loads.
- **Dimmed old rows** after a sorting or a filter, until the new ones come, so the table does not flicker.
- **The error bar** with the message of the server and **Try again**, and retries with a growing delay before it.
- **The pager** of the paged mode, with the rows per page and a jump to a page.

## Build it from 161

The quick way: `npm run tutorial:eject 166 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 160 (_Build it yourself from scratch_ there), replace `src/app/app.ts` with the code above and add `src/app/people-server.ts`.
