# 160 – A grid over an array

This tutorial shows how to show the rows of an array in a grid (`grd-grid`), sort them and select them. You will learn how to:

- give the grid its rows through a data source over an array (`GrdGridArrayDataSource`);
- describe the columns: the field, the title, the type, the format of numbers and dates (`GrdGridColumnDef`);
- let the user sort by one column, and by more (`sortable`, Shift+click);
- select one row, or several with check boxes (`selectionMode`, `[(selection)]`);
- open a row with a double click or Enter (`rowActivated`).

A series about the grid starts here, one thing at a time (160–168). The application starts from an empty `ng new`: a header, a switch and a grid of 500 made-up people. There is no docking engine.

```
npm run tutorial 160
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30160, click the title **Salary** twice, then click **Department** and Shift+click **Salary**. Double click a row. Then turn on **Select several rows** and tick a few rows.

## Step by step

Start from an empty Angular application with the library installed (see _Build it yourself from scratch_ below).

### Step 1: the rows

`src/app/people.ts` makes the data: 500 people of a company, the same every time (see _The code_). A row is a plain object:

```ts
export interface Person {
  id: number;
  name: string;
  department: string;
  city: string;
  age: number;
  /** A year's salary in euros. */
  salary: number;
  /** The day the person joined the company, an ISO date `yyyy-mm-dd`. */
  hired: string;
  active: boolean;
}
```

### Step 2: the columns

A column names the field of the row it shows and its title. The type tells the grid how to sort, align and show the values; `format` writes a number by the options of `Intl.NumberFormat`, and a date by a mask:

```ts
protected readonly columns: GrdGridColumnDef<Person>[] = [
  { field: 'id', header: 'Id', type: 'number', sortable: true },
  { field: 'name', header: 'Name', sortable: true },
  { field: 'department', header: 'Department', sortable: true },
  { field: 'city', header: 'City', sortable: true },
  { field: 'age', header: 'Age', type: 'number', sortable: true },
  {
    field: 'salary',
    header: 'Salary',
    type: 'number',
    sortable: true,
    format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
  },
  { field: 'hired', header: 'Hired', type: 'date', sortable: true, format: 'd MMM yyyy' },
  { field: 'active', header: 'Active', type: 'boolean', sortable: true },
];
```

`sortable` lets the title sort: a click sorts up, the next click down, the third one not at all. A `boolean` column shows a check box.

### Step 3: the data source

The grid keeps no data of its own: it asks a data source for the rows it draws. For rows in memory the source is `GrdGridArrayDataSource`; it sorts them in the browser:

```ts
protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
  getRowId: (person) => person.id,
  i18n: { text: tkx },
});
```

`getRowId` gives every row an id. The selection keeps ids, not positions, so a selected row stays selected when the table is sorted. `tkx` gives the source the texts of the library (the empty value of a filter, Yes and No).

### Step 4: the grid in the page

```html
<!-- the grid draws the rows that the source gives it; it keeps no data of its own -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  [selectionMode]="several() ? 'multiple' : 'single'"
  [(selection)]="selection"
  (rowActivated)="open($event)"
  ariaLabel="People"
/>
```

The grid fills the place it is given, so the place needs a height. Here the page is a column as tall as the window, and the grid takes what the header and the switch leave:

```scss
/* The grid takes the rest of the height and scrolls its rows itself. */
grd-grid {
  flex: 1;
  min-height: 0;
}
```

### Step 5: one row or several

`selectionMode` is `single` by default: a click selects one row. `multiple` gives the rows check boxes, and the check box in the header selects them all. The switch changes the mode and clears the selection:

```ts
protected setSeveral(on: boolean): void {
  this.several.set(on);
  this.selection.set(GRD_GRID_EMPTY_SELECTION);
}
```

`[(selection)]` is a `GrdGridSelection`: `{ all, ids }`. Usually `ids` are the selected rows. After the check box of the header `all` is `true`, and `ids` are the rows that are **not** selected; so "all" works for a table of a million rows too. The line under the grid counts them:

```ts
const { all, ids } = this.selection();
// "all" is every row except the ids (the check box of the header).
const selected = all ? (this.source.totalCount() ?? 0) - ids.size : ids.size;
```

### Step 6: open a row

A double click on a row, or Enter on the active row, tells `rowActivated`. An application opens a detail there; this one writes the person into the line:

```ts
/** `rowActivated`: a double click on a row, or Enter on the active row. */
protected open(event: GrdGridRowActivate<Person>): void {
  this.opened.set(event.row);
}
```

### Step 7: run it

```
npm run tutorial 160
```

## Try it

1. **Sort.** Click **Salary**: the lowest salaries first, an arrow in the title. Click it again: the highest first.
2. **Sort by two columns.** Click **Department**, then Shift+click **Salary**: the departments in order, and in each department the salaries. The titles show 1 and 2.
3. **Select.** Click a row; move with the arrow keys, Page Up and Page Down, Home and End. The line says _Selected: 1_.
4. **Open.** Double click a row, or press Enter: the line names the person.
5. **Several rows.** Turn on **Select several rows**. Tick three rows (_Selected: 3_), then the check box in the header (_Selected: 500_), then untick one (_Selected: 499_). Ctrl+click and Shift+click select rows too.
6. **The columns.** Drag the edge of a title to make the column wider (a double click on the edge fits it to its content), and drag a title to move the column.
7. **Scroll.** 500 rows scroll smoothly: the grid draws only the rows you see.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, signal } from '@angular/core';
import {
  GRD_GRID_EMPTY_SELECTION,
  GrdAppHeader,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdSwitch,
  tkx,
  type GrdGridColumnDef,
  type GrdGridRowActivate,
  type GrdGridSelection,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSwitch],
  template: `
    <grd-app-header
      productName="Array grid"
      subtitle="500 people from an array"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-switch
          label="Select several rows"
          [reserveMessageSpace]="false"
          [checked]="several()"
          (checkedChange)="setSeveral($event)"
        />
      </div>
      <!-- the grid draws the rows that the source gives it; it keeps no data of its own -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [selectionMode]="several() ? 'multiple' : 'single'"
        [(selection)]="selection"
        (rowActivated)="open($event)"
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
      align-items: center;
      gap: 8px 16px;
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
  /** The columns: the field of the row, the title, the type (it sorts and aligns), the format. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'department', header: 'Department', sortable: true },
    { field: 'city', header: 'City', sortable: true },
    { field: 'age', header: 'Age', type: 'number', sortable: true },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
    },
    { field: 'hired', header: 'Hired', type: 'date', sortable: true, format: 'd MMM yyyy' },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true },
  ];

  /** The rows in memory: the source sorts them in the browser. `tkx` gives it the texts of the library. */
  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** One row (a click) or several (the check boxes). */
  protected readonly several = signal(false);
  /** The ids of the selected rows. */
  protected readonly selection = signal<GrdGridSelection>(GRD_GRID_EMPTY_SELECTION);
  /** The person of the last row opened with a double click or Enter. */
  private readonly opened = signal<Person | null>(null);

  protected setSeveral(on: boolean): void {
    this.several.set(on);
    this.selection.set(GRD_GRID_EMPTY_SELECTION);
  }

  /** `rowActivated`: a double click on a row, or Enter on the active row. */
  protected open(event: GrdGridRowActivate<Person>): void {
    this.opened.set(event.row);
  }

  protected readonly line = computed(() => {
    const { all, ids } = this.selection();
    // "all" is every row except the ids (the check box of the header).
    const selected = all ? (this.source.totalCount() ?? 0) - ids.size : ids.size;
    const person = this.opened();
    const opened = person ? `${person.name} (${person.department}, ${person.city})` : 'nobody yet';
    return `Selected: ${selected}. Opened: ${opened}.`;
  });
}
```

`src/app/people.ts`:

```ts
/** A row of the grid: a person of a company. */
export interface Person {
  id: number;
  name: string;
  department: string;
  city: string;
  age: number;
  /** A year's salary in euros. */
  salary: number;
  /** The day the person joined the company, an ISO date `yyyy-mm-dd`. */
  hired: string;
  active: boolean;
}

export const DEPARTMENTS = ['Finance', 'HR', 'IT', 'Sales', 'Support'];
export const CITIES = ['Berlin', 'Brno', 'London', 'Prague', 'Vienna'];

const FIRST = ['Anna', 'Peter', 'Jana', 'Tom', 'Eva', 'Martin', 'Lucy', 'Jacob', 'Kate', 'David'];
const LAST = ['Novak', 'Smith', 'Dvorak', 'Brown', 'Black', 'Miller', 'Horak', 'Wagner', 'Marek'];

/**
 * `count` made-up people. They are the same every time: the numbers come from a fixed seed, not from
 * `Math.random()`, so a person keeps the id, the name and the salary after a reload.
 */
export function makePeople(count: number): Person[] {
  let seed = 7;
  const next = (max: number): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return Math.floor((seed / 2 ** 32) * max);
  };
  const people: Person[] = [];
  for (let id = 1; id <= count; id++) {
    const month = String(1 + next(12)).padStart(2, '0');
    const day = String(1 + next(28)).padStart(2, '0');
    people.push({
      id,
      name: `${FIRST[next(FIRST.length)]} ${LAST[next(LAST.length)]}`,
      department: DEPARTMENTS[next(DEPARTMENTS.length)],
      city: CITIES[next(CITIES.length)],
      age: 20 + next(45),
      salary: 30_000 + next(900) * 100,
      hired: `${2010 + next(16)}-${month}-${day}`,
      active: next(5) !== 0,
    });
  }
  return people;
}
```

`src/styles.scss`:

```scss
/* The themes, the density of the controls and the text styles of Gridify. */
@use '@gridify/studio/styles';

/* Without a docking engine nothing paints the page: the body takes the background and the text color of the theme. */
html,
body {
  height: 100%;
  margin: 0;
  font-family: var(--grd-font-main);
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}
```

`src/app/app.config.ts` is the one that `ng new` makes, without the router:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
```

## How it fits together

- **The data is yours.** The grid asks the source for the rows from `start` to `end` that it draws, and for their count. The array you give `GrdGridArrayDataSource` is never changed; the source keeps a copy. Tutorial 166 gives the same grid a source that asks a server.
- **The type of a column** decides the sorting (numbers as numbers, dates as dates, text by the language), the alignment (numbers to the end) and the filter of 161. A `date` column takes an ISO text, a `Date` or a number of milliseconds.
- **Formats.** A number is written by `Intl.NumberFormat` (here euros without cents), a date by a mask in the style of the Angular `DatePipe` (`d MMM yyyy` is _5 Oct 2011_). Both follow the language of the application.
- **Widths.** By default the columns are as wide as their content, and the rest of the width is shared out (`autoWidth` is `fill`). A column that the user widened keeps its width; 163 saves it.
- **The selection holds ids.** It survives sorting and scrolling; the row with the id 12 stays selected wherever it goes.
- **The size of the first load.** The grid is a big component: with the header it is about 1 MB of the first load, and the next tutorials add filters, editors and bars. The projects of the grid tutorials have an `initial` budget of `maximumWarning: 1.5MB` (`maximumError: 2MB`) in `angular.json`; with the 1 MB of the tutorials before, `ng build` would warn.

## What you get without writing any of it

- **Rows drawn as they scroll.** Only the rows in the window are in the page, so 500 rows or 500 000 scroll the same.
- **The keyboard.** The table is one tab stop; the arrow keys, Page Up and Page Down, Home and End move the active row, Space selects it, Ctrl+A selects all, Enter opens it.
- **Columns the user changes.** Widths by dragging the edge of a title (a double click fits the content), the order by dragging a title.
- **A screen reader** hears a table: the title of the grid, the number of rows and columns, the sorted column, the selected rows.
- **The theme and the density** of the header change the grid too; the height of a row follows the density.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 160 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new array-grid --style=scss --ssr=false --skip-tests
   cd array-grid
   ```

   Accept the defaults for any other question.

2. Install the library as in 010 (step 2 there, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. Write `src/styles.scss` as above: the styles of the library, the full height of the page, the font, and the background and the color of the theme.

4. Replace `src/app/app.ts` with the code above and add `src/app/people.ts`. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

5. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`).

6. Run it:

   ```
   ng serve
   ```
