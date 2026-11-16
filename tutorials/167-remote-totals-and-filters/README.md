# 167 – Totals and lists of values from the server

This tutorial shows how a grid over a server gets what only the server knows: the totals of all the rows, the values of a column for its filter, and the number of the rows. You will learn how to:

- let the server compute the totals row (the fourth parameter of `GrdGridRemoteDataSource`, `GrdGridRemoteAggregateParams`, `GrdGridAggregateValues`);
- let the server give the values of a filter, with the number of their rows (`filterOptions: 'auto'`, the option `fetchFilterOptions`);
- see what happens when the server does not count the rows: the table grows as the pages come, and the bar says _100+ rows_ until the last one (`exactTotalCount`, `knownCount`);
- load the data again from the code (`refresh`).

It is the application of 166 with totals and lists of values from the server, from the series about the grid (160–168).

```
npm run tutorial 167
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30167, look at the totals under the table, open the filter of **Department** and tick **Sales**.

## Step by step

Start from the application of 166 (or one made by `npm run tutorial:eject 166 path/to/new-folder` in the root of the repository).

### Step 1: the totals on the server

The totals row (`footer`, 162) counts all the rows after the filters, and only the server has them all. It gets a request: the filters, and for each column the kinds of totals:

```ts
/** The totals row: the sum, the average, the minimum or the maximum of a column, after the filters. */
async fetchTotals(params: GrdGridRemoteAggregateParams): Promise<GrdGridAggregateValues> {
  this.totalsRequests.update((count) => count + 1);
  await this.wait();
  const found = this.select(params.filters, []);
  const totals: GrdGridAggregateValues = {};
  for (const { field, kinds } of params.request) {
    const values = found.map((person) => Number(person[field as keyof Person]));
    const sum = values.reduce((total, value) => total + value, 0);
    const avg = values.length ? sum / values.length : null;
    const all = { sum, avg, min: Math.min(...values), max: Math.max(...values) };
    totals[field] = Object.fromEntries(kinds.map((kind) => [kind, all[kind]]));
  }
  return totals;
}
```

The answer is `{ age: { avg: 41.9607 }, salary: { sum: 1497365900, avg: 74868.295 } }`; the format of a column writes it (_Ø 42_, _Σ €1,497,365,900_). A real server does it with `SUM` and `AVG`.

### Step 2: the values of a filter on the server

A list of values with `'auto'` asks the source for the values of the column. The array source has them all; the server source asks the server, with the filters of the other columns, so the counts are those of the rows the other filters leave:

```ts
/** The values of a column with the number of their rows, under the filters of the other columns. */
async fetchValues(params: GrdGridRemoteFilterOptionsParams): Promise<GrdGridFilterOption[]> {
  this.valuesRequests.update((count) => count + 1);
  await this.wait(params.signal);
  const values = this.select(params.filters, []).map((p) => p[params.field as keyof Person]);
  return grdGridDistinctOptions(values, { text: tkx });
}
```

`grdGridDistinctOptions` makes the list of `{ value, label, count }` that the panel shows; a real server answers the same list from `SELECT department, COUNT(*) … GROUP BY department`.

### Step 3: the source asks for them

The function of the totals is the fourth parameter of the source, the function of the values the option `fetchFilterOptions`:

```ts
protected readonly source = new GrdGridRemoteDataSource<Person>(
  (params) => this.server.fetchPage(params),
  (person) => person.id,
  50,
  (params) => this.server.fetchTotals(params),
  {
    retry: { attempts: 1, baseDelayMs: 500 },
    fetchFilterOptions: (params) => this.server.fetchValues(params),
  },
);
```

### Step 4: the columns

Department and City take their lists from the server (`'auto'`), Age and Salary have totals:

```ts
{
  field: 'department',
  header: 'Department',
  sortable: true,
  filterable: true,
  filterOptions: 'auto',
},
{ field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
```

```ts
format: { maximumFractionDigits: 1 },
footer: 'avg',
```

```ts
footer: ['sum', 'avg'],
```

### Step 5: a server that does not count

Counting all the rows (`COUNT(*)`) can be slow on a big table, so some servers do not do it. The pretend server has a switch for it; without the count it sends only the rows:

```ts
const page = {
  rows: found.slice(params.start, params.end),
  isLast: params.end >= found.length,
};
// Without the count the grid learns the length of the table only at the last page.
if (!this.countsRows()) return page;
return { ...page, exactTotalCount: found.length, unfilteredTotalCount: this.people.length };
```

The switch of the page turns it on or off and loads the data again, so that the change shows:

```ts
/** The server counts from now on, or stops: the source loads the data again to see it. */
protected countRows(on: boolean): void {
  this.server.countsRows.set(on);
  this.source.refresh();
}
```

### Step 6: run it

```
npm run tutorial 167
```

## Try it

1. **The totals.** Under the table: the average age, and the sum and the average of the salaries of all 20 000 people. The line says _totals 1_: one request.
2. **The values of a filter.** Open the filter of **Department**: _Loading…_, then the five departments with the number of their people. Tick **Sales**: the rows, and new totals for the people of Sales (_totals 2_).
3. **Under the other filters.** Open the filter of **City**: the cities with the number of their people **in Sales**; together they make the number in the bar.
4. **Remembered.** Open the filter of Department again: no new request, the source remembers the answer for the same filters.
5. **No count.** Turn off **The server counts the rows**: the bar says _100+ rows_ (the rows the source knows of, and the plus says there are more), and the scrollbar is short. Drag it to the end again and again: the table and the number grow by the pages that come, until the last page tells the end (_3,936 rows_ for Sales, without the plus).
6. **Sort and scroll.** The totals do not change with the sorting or the scrolling: they are asked for again only when the filters change, or after **Refresh**.

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
import { type Person } from './people';
import { PeopleServer } from './people-server';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Remote totals and filters"
      subtitle="the server counts and sums"
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
        <grd-switch
          label="The server counts the rows"
          [reserveMessageSpace]="false"
          [checked]="server.countsRows()"
          (checkedChange)="countRows($event)"
        />
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
   * The source of 166 with two more questions for the server: the totals of the columns with a
   * `footer` (the fourth parameter) and the values of the filters with `filterOptions: 'auto'`
   * (`fetchFilterOptions`).
   */
  protected readonly source = new GrdGridRemoteDataSource<Person>(
    (params) => this.server.fetchPage(params),
    (person) => person.id,
    50,
    (params) => this.server.fetchTotals(params),
    {
      retry: { attempts: 1, baseDelayMs: 500 },
      fetchFilterOptions: (params) => this.server.fetchValues(params),
    },
  );

  /** The columns of 166; the lists of the filters come from the server, and two columns have totals. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterOptions: 'auto',
    },
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
    {
      field: 'age',
      header: 'Age',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { maximumFractionDigits: 1 },
      footer: 'avg',
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      footer: ['sum', 'avg'],
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
      `Requests: pages ${this.server.requests()}, totals ${this.server.totalsRequests()}, ` +
      `lists of values ${this.server.valuesRequests()}. Last: ${this.server.lastRequest()}.`,
  );

  /** The server counts from now on, or stops: the source loads the data again to see it. */
  protected countRows(on: boolean): void {
    this.server.countsRows.set(on);
    this.source.refresh();
  }

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
  grdGridDistinctOptions,
  tkx,
  type GrdGridAggregateValues,
  type GrdGridFilter,
  type GrdGridFilterOption,
  type GrdGridRemoteAggregateParams,
  type GrdGridRemoteFetchParams,
  type GrdGridRemoteFetchResult,
  type GrdGridRemoteFilterOptionsParams,
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
  /** While it is on, the server counts the rows (`COUNT(*)`) and tells the grid how many there are. */
  readonly countsRows = signal(true);
  /** How many requests came: for pages, for the totals, for the values of a filter. */
  readonly requests = signal(0);
  readonly totalsRequests = signal(0);
  readonly valuesRequests = signal(0);
  /** The last request for a page, as a short text. */
  readonly lastRequest = signal('nothing yet');

  private readonly people = makePeople(20_000);

  /** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
  async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
    this.requests.update((count) => count + 1);
    this.lastRequest.set(describe(params));
    await this.wait(params.signal);
    const found = this.select(params.filters, params.sorts);
    const page = {
      rows: found.slice(params.start, params.end),
      isLast: params.end >= found.length,
    };
    // Without the count the grid learns the length of the table only at the last page.
    if (!this.countsRows()) return page;
    return { ...page, exactTotalCount: found.length, unfilteredTotalCount: this.people.length };
  }

  /** The totals row: the sum, the average, the minimum or the maximum of a column, after the filters. */
  async fetchTotals(params: GrdGridRemoteAggregateParams): Promise<GrdGridAggregateValues> {
    this.totalsRequests.update((count) => count + 1);
    await this.wait();
    const found = this.select(params.filters, []);
    const totals: GrdGridAggregateValues = {};
    for (const { field, kinds } of params.request) {
      const values = found.map((person) => Number(person[field as keyof Person]));
      const sum = values.reduce((total, value) => total + value, 0);
      const avg = values.length ? sum / values.length : null;
      const all = { sum, avg, min: Math.min(...values), max: Math.max(...values) };
      totals[field] = Object.fromEntries(kinds.map((kind) => [kind, all[kind]]));
    }
    return totals;
  }

  /** The values of a column with the number of their rows, under the filters of the other columns. */
  async fetchValues(params: GrdGridRemoteFilterOptionsParams): Promise<GrdGridFilterOption[]> {
    this.valuesRequests.update((count) => count + 1);
    await this.wait(params.signal);
    const values = this.select(params.filters, []).map((p) => p[params.field as keyof Person]);
    return grdGridDistinctOptions(values, { text: tkx });
  }

  /** The work of the database: WHERE (the filters) and ORDER BY (the sorting). */
  private select(
    filters: Record<string, GrdGridFilter>,
    sorts: GrdGridRemoteFetchParams['sorts'],
  ): Person[] {
    const tests = grdGridActiveFilterEntries(filters).map(([field, filter]) => ({
      field: field as keyof Person,
      test: grdGridCompileFilter(filter),
    }));
    const found = this.people.filter((person) => tests.every((t) => t.test(person[t.field])));
    const compare = grdGridCompareRows<Person>(sorts, 'en', SORT_TYPES);
    return compare ? found.sort(compare) : found;
  }

  /** The time the server takes, or its error. A request the grid stops (aborts) ends at once. */
  private wait(abort?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const stop = () => {
        clearTimeout(timer);
        reject(abort?.reason);
      };
      const timer = setTimeout(() => {
        abort?.removeEventListener('abort', stop);
        if (this.failing()) reject(new Error('The server does not answer'));
        else resolve();
      }, this.delay());
      abort?.addEventListener('abort', stop, { once: true });
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

- **The totals** are asked for when the columns with a `footer` change and when the filters change; the answer is remembered for the same filters and request. `refresh()` asks again. A failed request is not remembered: the next one tries again.
- **The lists of values** are asked for when a panel opens, with the filters of the other columns; the answer is remembered per column and filters. An answer that comes after the panel was closed is dropped.
- **Without the count** the source estimates: the rows it knows of and one more page. The scrollbar grows as the pages come, and the last page (`isLast`, or a page shorter than the others) tells the end. Until then the bar shows the rows known so far with a plus (_100+ rows_, `knownCount` of the source; `totalIsExact()` is `false`), so a server that can count should do it.
- **The count without filters** (`unfilteredTotalCount`) gives the bar its _Found … of 20,000_.
- **Refresh** keeps the place in the table and the length of the table until the first page of the refresh comes; the old rows stay dimmed meanwhile.

## What you get without writing any of it

- **_Loading…_** in the panel of a filter while the values come, and a message when they cannot be loaded.
- **The counts** beside the values of a filter, and a search over a long list.
- **The totals row** with the signs of the kinds (Σ, Ø), written by the format of the column.
- **A growing table** that never asks for pages past the end once it knows the end.

## Build it from 166

The quick way: `npm run tutorial:eject 167 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 166 (_Build it from 161_ there), and replace `src/app/app.ts` and `src/app/people-server.ts` with the code above.
