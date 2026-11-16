# 161 – Filters in the header

This tutorial shows how to let the user filter the rows of a grid from its header, and how to set and clear the same filters from the code. You will learn how to:

- give a column a filter of its kind: a text, a list of values, a number, a date, yes / no (`filterable`, `filterOptions`);
- choose where the filters are: a row of fields under the titles, a funnel in each title, or none (`filterUi`);
- show the number of rows and a chip for every filter above the header (`aboveHeader` with `rowCount` and `filterChips`);
- set and clear filters from the code (`setFilter`, `clearAllFilters`);
- say what the table shows when no row is left (`emptyFilteredText`).

It is the application of 160 with filters instead of the selection, from the series about the grid (160–168).

```
npm run tutorial 161
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30161, type `jana` into the field under **Name**, then press **Sales in Prague** and **Clear the filters**.

## Step by step

Start from the application of 160 (or one made by `npm run tutorial:eject 160 path/to/new-folder` in the root of the repository). The switch of the selection and the line under the grid are not needed here: take them out, with `several`, `selection`, `opened`, `setSeveral`, `open` and `line`.

### Step 1: filterable columns

`filterable: true` gives a column a filter in the header. Its kind follows the type of the column: a text is typed, a number and a date have an operator and a range, a `boolean` is All, Yes or No. `filterOptions` makes it a list of values to tick: written out, or `'auto'` (the values that the data has, with the number of their rows):

```ts
{ field: 'name', header: 'Name', sortable: true, filterable: true },
{
  field: 'department',
  header: 'Department',
  sortable: true,
  filterable: true,
  filterOptions: DEPARTMENTS,
},
{ field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
{ field: 'age', header: 'Age', type: 'number', sortable: true, filterable: true },
```

The other columns get `filterable: true` too, except the id (see _The code_). `DEPARTMENTS` comes from `people.ts`.

### Step 2: the bar above the header

`aboveHeader` puts a bar above the titles. `rowCount` says how many rows there are (_Found 57 of 500 rows_ while a filter is on), `filterChips` shows a chip for every filter, with a cross that takes it away. `emptyFilteredText` is what the table says when the filters leave no row:

```html
<!-- the bar above the header: the number of rows and a chip for every filter -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  [filterUi]="filterUi()"
  [aboveHeader]="{ start: ['rowCount', 'filterChips'] }"
  emptyFilteredText="Nobody matches the filters."
  ariaLabel="People"
/>
```

### Step 3: where the filters are

`filterUi` is `row` by default: a row of fields under the titles. `icon` puts a funnel into each title instead, which opens the same panel, and `off` takes the filters out of the header (the chips and the code still work). A select switches it:

```ts
/** Where the filters are: a row of fields under the titles, a funnel in each title, or none. */
protected readonly filterUi = signal<GrdGridFilterUi>('row');
protected readonly filterUis: { value: GrdGridFilterUi; label: string }[] = [
  { value: 'row', label: 'A row under the titles' },
  { value: 'icon', label: 'A funnel in each title' },
  { value: 'off', label: 'None (only from the code)' },
];
```

```html
<grd-select
  label="Filters in the header"
  [options]="filterUis"
  [value]="filterUi()"
  (valueChange)="setFilterUi($event)"
  [reserveMessageSpace]="false"
/>
```

### Step 4: filters from the code

The methods of the grid are the same operations as the user's. `viewChild` gives the grid to the code:

```ts
protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);
```

A filter is plain data of its kind: here a list of values (`kind: 'select'`). The header, the chips and the rows follow it:

```ts
/** Filters from the code: the same filters the user sets in the header. */
protected salesInPrague(): void {
  this.grid().setFilter('department', { kind: 'select', values: ['Sales'] });
  this.grid().setFilter('city', { kind: 'select', values: ['Prague'] });
}
```

```html
<grd-button label="Sales in Prague" (pressed)="salesInPrague()" />
<grd-button label="Clear the filters" (pressed)="grid().clearAllFilters()" />
```

### Step 5: run it

```
npm run tutorial 161
```

## Try it

1. **A text.** Type `jana` under **Name**: the rows narrow while you type, and the bar says _Found 57 of 500 rows_. Case and accents do not matter. The funnel next to the field chooses another operator: starts with, equals, is empty…
2. **A list.** Open the filter of **City**: the values of the data with the number of their rows. Tick two cities.
3. **A number.** Open the filter of **Age**, type 30 and 39 (the operator _between_ is the default) and press Enter.
4. **The chips.** Each filter has a chip in the bar; its cross removes that filter, _Clear all filters_ removes them all.
5. **From the code.** Press **Sales in Prague**: the filters of Department and City are set, and the header shows them. **Clear the filters** clears them all.
6. **Nothing found.** Type something no name has: the table says _Nobody matches the filters._, with a button that clears them.
7. **Funnels.** Choose _A funnel in each title_: the row of fields goes, and a funnel in a title opens the panel of the filter. A filtered column has a lit funnel.

## The code

`src/app/app.ts`:

```ts
import { Component, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdSelect,
  tkx,
  type GrdGridColumnDef,
  type GrdGridFilterUi,
} from '@gridify/studio';
import { DEPARTMENTS, makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid, GrdSelect],
  template: `
    <grd-app-header
      productName="Grid filters"
      subtitle="filters in the header of the grid"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-select
          label="Filters in the header"
          [options]="filterUis"
          [value]="filterUi()"
          (valueChange)="setFilterUi($event)"
          [reserveMessageSpace]="false"
        />
        <grd-button label="Sales in Prague" (pressed)="salesInPrague()" />
        <grd-button label="Clear the filters" (pressed)="grid().clearAllFilters()" />
      </div>
      <!-- the bar above the header: the number of rows and a chip for every filter -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [filterUi]="filterUi()"
        [aboveHeader]="{ start: ['rowCount', 'filterChips'] }"
        emptyFilteredText="Nobody matches the filters."
        ariaLabel="People"
      />
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
      gap: 8px 16px;
    }
    /* The grid takes the rest of the height and scrolls its rows itself. */
    grd-grid {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);

  /** `filterable` puts a filter of its kind into the header: text, a list of values, number, date, yes / no. */
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
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
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

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** Where the filters are: a row of fields under the titles, a funnel in each title, or none. */
  protected readonly filterUi = signal<GrdGridFilterUi>('row');
  protected readonly filterUis: { value: GrdGridFilterUi; label: string }[] = [
    { value: 'row', label: 'A row under the titles' },
    { value: 'icon', label: 'A funnel in each title' },
    { value: 'off', label: 'None (only from the code)' },
  ];

  protected setFilterUi(value: GrdGridFilterUi | null): void {
    if (value) this.filterUi.set(value);
  }

  /** Filters from the code: the same filters the user sets in the header. */
  protected salesInPrague(): void {
    this.grid().setFilter('department', { kind: 'select', values: ['Sales'] });
    this.grid().setFilter('city', { kind: 'select', values: ['Prague'] });
  }
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **The source filters.** The grid gives every filter to its data source (`setFilter` of the source); `GrdGridArrayDataSource` filters in the browser, and a server source sends the filters to the server (166).
- **A filter is data.** `{ kind: 'text', op: 'contains', value: 'jana' }`, `{ kind: 'number', op: 'between', value: 30, value2: 39 }`, `{ kind: 'select', values: ['Sales'] }`… A filter that does not narrow anything yet (an empty text, a range without numbers) is kept, but does nothing and has no chip.
- **Lists of values.** `filterOptions` written out (`DEPARTMENTS`) is the list that the panel shows; `'auto'` asks the source for the values of the column with the numbers of their rows. A function that returns a list, or a promise of one, works too.
- **The rows narrow while you type**, also in the panels: every change goes to the grid at once.
- **The selection and the filters.** Rows that a filter hides stay selected, but they are not counted while hidden.

## What you get without writing any of it

- **Search without case and accents** in the text filters: `cesky` finds _Český_.
- **The panel of a filter:** the operators, a date picker for dates, a search in a long list of values, _Select all_, Done and Clear the filter; Enter and Esc close it, and the focus goes back to the field.
- **The chips** and the text of the empty table with its button.
- **The keyboard in the filters** belongs to them: arrows and Space in a field do not move the rows.

## Build it from 160

The quick way: `npm run tutorial:eject 161 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 160 (_Build it yourself from scratch_ there), and replace `src/app/app.ts` with the code above.
