# 163 – Columns the user arranges

This tutorial shows how to let the user arrange the columns of a grid (hide, show, move, widen and pin them) and how to keep the arrangement after a reload. You will learn how to:

- freeze columns at the left edge, so they stay while the others scroll sideways (`frozen`);
- give every title a menu with sorting, pinning, moving, fitting and hiding (`columnMenu`), and keep a column from being hidden (`hideable: false`);
- add the Columns button, where the user shows and hides the columns (the bar item `columnChooser`);
- save the arrangement when it changes and give it back to the grid at the start (`(columnStateChange)`, `[columnState]`, `GrdGridColumnState`);
- go back to the columns of the code (`resetColumns`).

It is the application of 160 with the columns of the user instead of the selection, from the series about the grid (160–168).

```
npm run tutorial 163
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30163, open the menu of **Department** (the three dots in its title) and choose **Hide column**, make **City** wider by dragging the edge of its title, and press F5.

Every tutorial runs on an address of its own (this one on http://localhost:30163), so it has a `localStorage` of its own. It still keeps its columns under a key of its own (here `tutorial-163-columns`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 160 (or one made by `npm run tutorial:eject 160 path/to/new-folder` in the root of the repository). The switch, the line under the grid and their code are not needed here: take out `several`, `selection`, `opened`, `setSeveral`, `open` and `line`.

### Step 1: frozen columns, and one that cannot be hidden

`frozen: 'left'` freezes a column at the left edge: Id and Name stay while the other columns scroll sideways (in a narrow window). `hideable: false` keeps Name from being hidden:

```ts
{ field: 'id', header: 'Id', type: 'number', sortable: true, frozen: 'left' },
{ field: 'name', header: 'Name', sortable: true, frozen: 'left', hideable: false },
```

### Step 2: the menu of a column and the Columns button

`columnMenu` gives every title a button with three dots (the right mouse button on a title opens the same menu): sort, pin to the left or the right, move left or right, fit the width to the content, hide, and the submenu **Columns** with every column. The bar item `columnChooser` is the **Columns** button above the header:

```html
<!-- columnMenu: the three dots in every title; [columnState] and (columnStateChange) keep the columns -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  columnMenu
  [aboveHeader]="{ start: ['rowCount'], end: ['columnChooser'] }"
  [columnState]="columnState"
  (columnStateChange)="saveColumns($event)"
  ariaLabel="People"
/>
```

### Step 3: keep the columns

`columnStateChange` tells every change of the user: the order of the columns, the hidden ones, the widths the user gave them, the frozen ones. It is a `GrdGridColumnState`, plain data that `JSON.stringify` can write:

```json
{
  "order": ["id", "name", "department", "city", "age", "salary", "hired", "active"],
  "hidden": ["department"],
  "widths": { "city": 236 }
}
```

Two small functions keep it in `localStorage` under a key of the application, and read it back:

```ts
/** Where the columns of the user are kept. */
const COLUMNS_KEY = 'tutorial-163-columns';

/** The columns as the user left them, or `null` the first time (and when localStorage is not there). */
function loadColumns(): GrdGridColumnState | null {
  try {
    const saved = localStorage.getItem(COLUMNS_KEY);
    return saved ? (JSON.parse(saved) as GrdGridColumnState) : null;
  } catch {
    return null;
  }
}

/** Keeps the columns of the user, or forgets them (`null`). */
function keepColumns(state: GrdGridColumnState | null): void {
  try {
    if (state) localStorage.setItem(COLUMNS_KEY, JSON.stringify(state));
    else localStorage.removeItem(COLUMNS_KEY);
  } catch {
    // No localStorage (a browser may turn it off): the columns are not kept.
  }
}
```

The component saves every change, and gives the saved state to the grid when it starts (`[columnState]`):

```ts
/** The columns of the last visit: the grid takes them when it starts. */
protected readonly columnState = loadColumns();
```

```ts
/** `columnStateChange`: the user moved, hid, showed, widened or froze a column. */
protected saveColumns(state: GrdGridColumnState): void {
  keepColumns(state);
  const widths = Object.keys(state.widths).length;
  this.saved.set(`Saved: ${state.hidden.length} hidden, ${widths} with a width of their own.`);
}
```

### Step 4: back to the default

`resetColumns()` gives the grid the columns of the code again: their order, all of them shown, no widths of the user. The key is removed, so the next visit starts with the default too:

```ts
/** The columns of the code again, and nothing saved: the next visit starts with the default ones. */
protected defaultColumns(): void {
  this.grid().resetColumns();
  keepColumns(null);
  this.saved.set('The default columns.');
}
```

### Step 5: run it

```
npm run tutorial 163
```

## Try it

1. **Hide.** Open the menu of **Department** and choose **Hide column**. The Columns button says _7/8_, and the line _Saved: 1 hidden_.
2. **Move.** In the menu of **Age** choose **Move right**, or drag a title to another place.
3. **Widen.** Drag the right edge of the title **City**. A double click on the edge fits the column to its content.
4. **F5.** The columns come back as you left them: _Your columns are back._
5. **Show again.** Open **Columns** above the header: a check box for every column. Tick **Department**. The check box of **Name** is off: it cannot be hidden.
6. **Pin.** In the menu of **Salary** choose **Pin to the right**. Make the window narrow: Id and Name stay at the left, Salary at the right, and the columns between them scroll.
7. **Default columns.** Press the button: the columns of the code, and F5 keeps them.
8. **See it.** In the developer tools of the browser, _Application › Local storage › http://localhost:30163_ has the key `tutorial-163-columns`.

## The code

`src/app/app.ts`:

```ts
import { Component, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridArrayDataSource,
  tkx,
  type GrdGridColumnDef,
  type GrdGridColumnState,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

/** Where the columns of the user are kept. */
const COLUMNS_KEY = 'tutorial-163-columns';

/** The columns as the user left them, or `null` the first time (and when localStorage is not there). */
function loadColumns(): GrdGridColumnState | null {
  try {
    const saved = localStorage.getItem(COLUMNS_KEY);
    return saved ? (JSON.parse(saved) as GrdGridColumnState) : null;
  } catch {
    return null;
  }
}

/** Keeps the columns of the user, or forgets them (`null`). */
function keepColumns(state: GrdGridColumnState | null): void {
  try {
    if (state) localStorage.setItem(COLUMNS_KEY, JSON.stringify(state));
    else localStorage.removeItem(COLUMNS_KEY);
  } catch {
    // No localStorage (a browser may turn it off): the columns are not kept.
  }
}

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid],
  template: `
    <grd-app-header
      productName="Grid columns"
      subtitle="columns kept after a reload"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-button label="Default columns" (pressed)="defaultColumns()" />
        <span class="saved">{{ saved() }}</span>
      </div>
      <!-- columnMenu: the three dots in every title; [columnState] and (columnStateChange) keep the columns -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        columnMenu
        [aboveHeader]="{ start: ['rowCount'], end: ['columnChooser'] }"
        [columnState]="columnState"
        (columnStateChange)="saveColumns($event)"
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
      align-items: center;
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
  private readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);

  /**
   * `frozen: 'left'`: the column stays while the others scroll sideways. `hideable: false`: the column
   * cannot be hidden. The others can be hidden, moved, widened and frozen by the user.
   */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true, frozen: 'left' },
    { field: 'name', header: 'Name', sortable: true, frozen: 'left', hideable: false },
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

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** The columns of the last visit: the grid takes them when it starts. */
  protected readonly columnState = loadColumns();
  protected readonly saved = signal(
    this.columnState ? 'Your columns are back.' : 'The default columns.',
  );

  /** `columnStateChange`: the user moved, hid, showed, widened or froze a column. */
  protected saveColumns(state: GrdGridColumnState): void {
    keepColumns(state);
    const widths = Object.keys(state.widths).length;
    this.saved.set(`Saved: ${state.hidden.length} hidden, ${widths} with a width of their own.`);
  }

  /** The columns of the code again, and nothing saved: the next visit starts with the default ones. */
  protected defaultColumns(): void {
    this.grid().resetColumns();
    keepColumns(null);
    this.saved.set('The default columns.');
  }
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **The grid keeps the changes of the user** while the page runs; `columnStateChange` is the moment to save them. A width is told when the pointer is let go, not while it moves.
- **`columnState` is read at the start.** The saved state names the columns by their fields: a column that the code no longer has is left out, a new column of the code is shown at its place. So a new version of the application does not break the saved columns.
- **The sorting and the filters are not in the state**: they belong to the data, not to the columns.
- **Frozen columns stay together.** Pinning moves a column to the edge of the frozen ones; a frozen column is dragged only among the frozen ones, and a scrolling one among the scrolling ones.
- **A key of the application.** As with the layout of the docking engine (113), everything on one address shares one `localStorage`, so the key names the application. For a layout of every user, put the user into the key (122).

## What you get without writing any of it

- **The menu of a column** from the three dots, the right mouse button and the Menu key; on a touch screen the dots are always shown.
- **The Columns button** with a search (from 8 columns on), _Show all_ and _Default_; a hidden column that still filters or sorts is tagged, so nobody wonders where the rows went.
- **Moving a column** by dragging its title, with a line where it goes; at the edge of the table it scrolls by itself, and Esc leaves the column where it was.
- **The last shown column** cannot be hidden, and a menu that hides a column always has the way back (_Columns_).

## Build it from 160

The quick way: `npm run tutorial:eject 163 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 160 (_Build it yourself from scratch_ there), and replace `src/app/app.ts` with the code above.
