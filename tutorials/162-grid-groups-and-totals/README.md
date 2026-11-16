# 162 – Groups and totals

This tutorial shows how to group the rows of a grid by the values of a column, and how to add totals: in the group rows, in a totals row under the table, and for the rows the user selects. You will learn how to:

- let the rows be grouped by a column, on one level or more (`groupable`, `[(groupBy)]`);
- show a sum or an average of a column in every group row (`groupAggregate`);
- add a totals row under the table (`footer`);
- sum up the selected rows in the bar (`aggregate` and the bar item `summary`);
- fold and unfold the groups from the code (`expandAllGroups`, `collapseAllGroups`), and let the user group with the Group button of the bar (`grouping`).

It is the application of 160 with groups and totals instead of the switch, from the series about the grid (160–168).

```
npm run tutorial 162
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30162, press **By department**, then **Collapse all**, and look at the totals under the table.

## Step by step

Start from the application of 160 (or one made by `npm run tutorial:eject 160 path/to/new-folder` in the root of the repository). The switch, the line under the grid and their code are not needed here: take out `several`, `selection`, `opened`, `setSeveral`, `open` and `line`.

### Step 1: the columns

Four new fields of a column:

- `groupable`: the rows may be grouped by this column;
- `groupAggregate`: what a group row shows of this column, `'sum'`, `'avg'`, `'min'` or `'max'`;
- `footer`: the totals row under the table, one kind or a list of them;
- `aggregate`: what the summary of the selected rows may compute from the column.

```ts
{ field: 'department', header: 'Department', sortable: true, groupable: true },
{ field: 'city', header: 'City', sortable: true, groupable: true },
{
  field: 'age',
  header: 'Age',
  type: 'number',
  sortable: true,
  format: { maximumFractionDigits: 1 },
  groupAggregate: 'avg',
  footer: 'avg',
},
{
  field: 'salary',
  header: 'Salary',
  type: 'number',
  sortable: true,
  format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
  groupAggregate: 'sum',
  footer: ['sum', 'avg'],
  aggregate: ['sum', 'avg', 'min', 'max'],
},
```

The format of a column writes its totals too: the average age has one decimal, the salaries are in euros. **Active** is `groupable` as well (see _The code_).

### Step 2: the grouping

`groupBy` is a list of fields: the first is the top level, the next one groups the rows inside each group. It is a model, so `[(groupBy)]` keeps a signal of the page and the grid together:

```ts
/** The fields the rows are grouped by: the first is the top level. */
protected readonly groupBy = signal<readonly string[]>([]);
```

```html
<!-- [(groupBy)]: the buttons above and the Group button of the grid change the same list -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  [(groupBy)]="groupBy"
  selectionMode="multiple"
  [aboveHeader]="{ start: ['rowCount', 'summary'], end: ['grouping'] }"
  ariaLabel="People"
/>
```

The bar above the header has the number of rows, the summary of the selection (`summary`) and the Group button (`grouping`), where the user groups by the `groupable` columns and changes the order of the levels. `selectionMode="multiple"` gives the rows check boxes; a check box of a group row selects its rows.

### Step 3: the buttons

The buttons set the list; the grid folds and unfolds the groups:

<!-- prettier-ignore -->
```html
<grd-button label="By department" (pressed)="groupBy.set(['department'])" />
<grd-button
  label="By department and city"
  (pressed)="groupBy.set(['department', 'city'])"
/>
<grd-button label="No groups" (pressed)="groupBy.set([])" />
<grd-button label="Expand all" (pressed)="grid().expandAllGroups()" />
<grd-button label="Collapse all" (pressed)="grid().collapseAllGroups()" />
```

`grid` is the grid from `viewChild`, as in 161:

```ts
protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);
```

### Step 4: a line that follows the grouping

The line under the grid reads the same signal, so it follows the buttons and the Group button of the grid alike:

```ts
protected readonly grouped = computed(() => {
  const titles = this.groupBy().map(
    (field) => this.columns.find((c) => c.field === field)?.header,
  );
  return titles.length ? titles.join(' › ') : 'nothing';
});
```

### Step 5: run it

```
npm run tutorial 162
```

## Try it

1. **The totals.** Under the table: the average age (Ø) and the sum (Σ) and the average of the salaries of all 500 people.
2. **One level.** Press **By department**: a row for every department with the number of its people, the average age and the sum of the salaries.
3. **Fold.** Press **Collapse all**: five rows. Click a group row (or press Enter or the arrows on it) to open just that one.
4. **Two levels.** Press **By department and city**, then **Expand all**: the cities inside every department.
5. **The Group button.** Open **Group** in the bar: the levels, with buttons that move or remove them. Remove the grouping there, and the line says _Grouped by: nothing_.
6. **The summary.** Press **No groups** and tick two rows: the bar says _Selected: 2 rows_ and the sum, the average, the minimum and the maximum of their salaries.
7. **Sort inside the groups.** Group by department and click **Salary**: the groups stay, the rows inside them are sorted.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridArrayDataSource,
  tkx,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid],
  template: `
    <grd-app-header
      productName="Groups and totals"
      subtitle="rows grouped by their values, with totals"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-button label="By department" (pressed)="groupBy.set(['department'])" />
        <grd-button
          label="By department and city"
          (pressed)="groupBy.set(['department', 'city'])"
        />
        <grd-button label="No groups" (pressed)="groupBy.set([])" />
        <grd-button label="Expand all" (pressed)="grid().expandAllGroups()" />
        <grd-button label="Collapse all" (pressed)="grid().collapseAllGroups()" />
      </div>
      <!-- [(groupBy)]: the buttons above and the Group button of the grid change the same list -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [(groupBy)]="groupBy"
        selectionMode="multiple"
        [aboveHeader]="{ start: ['rowCount', 'summary'], end: ['grouping'] }"
        ariaLabel="People"
      />
      <p class="line">Grouped by: {{ grouped() }}</p>
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
      align-items: center;
      gap: 8px;
    }
    /* The grid takes the rest of the height and scrolls its rows itself. */
    grd-grid {
      flex: 1;
      min-height: 0;
    }
    .line {
      margin: 0;
    }
  `,
})
export class App {
  protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);

  /**
   * `groupable`: the rows may be grouped by the column. `groupAggregate`: what a group row shows of the
   * column. `footer`: the totals row under the table. `aggregate`: what the summary of the selected rows
   * computes.
   */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'department', header: 'Department', sortable: true, groupable: true },
    { field: 'city', header: 'City', sortable: true, groupable: true },
    {
      field: 'age',
      header: 'Age',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 1 },
      groupAggregate: 'avg',
      footer: 'avg',
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      groupAggregate: 'sum',
      footer: ['sum', 'avg'],
      aggregate: ['sum', 'avg', 'min', 'max'],
    },
    { field: 'hired', header: 'Hired', type: 'date', sortable: true, format: 'd MMM yyyy' },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true, groupable: true },
  ];

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** The fields the rows are grouped by: the first is the top level. */
  protected readonly groupBy = signal<readonly string[]>([]);

  protected readonly grouped = computed(() => {
    const titles = this.groupBy().map(
      (field) => this.columns.find((c) => c.field === field)?.header,
    );
    return titles.length ? titles.join(' › ') : 'nothing';
  });
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **Grouping needs all the rows.** The grid builds the groups in the browser from all the rows after the filters (`getAllRowsSync` of the source), so it groups over `GrdGridArrayDataSource`, in the virtual mode (not page by page). A source that asks a server for pages cannot group: the Group button is off there and says why.
- **Three kinds of totals.** `groupAggregate` counts the rows of a group, `footer` all the rows after the filters (`footerScope: 'page'` only the page shown), `aggregate` the selected rows or the selected cells (165).
- **Several totals in a column** (`footer: ['sum', 'avg']`) are stacked in the totals row, each with its sign: Σ, Ø, min, max.
- **The totals row stays** at the bottom of the table, under the horizontal scrollbar, while the rows scroll.

## What you get without writing any of it

- **Group rows** with an arrow, the column, the value, the number of rows and the totals; a click, Enter and the arrow keys fold and unfold them.
- **The Group button:** the levels, up, down, remove, _Expand all_, _Collapse all_, _Clear the grouping_.
- **The summary** of the selected rows, in the bar and for a screen reader.
- **A tree for a screen reader:** while the rows are grouped the table is a `treegrid`, with the levels and whether a group is open.

## Build it from 160

The quick way: `npm run tutorial:eject 162 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 160 (_Build it yourself from scratch_ there), and replace `src/app/app.ts` with the code above.
