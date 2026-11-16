# 168 – Saving edits on the server

This tutorial shows how to save what the user edits in a grid on the server: the new value is in the cell at once, the cell shows that it is being saved, and when the server refuses, the old value comes back and the cell is marked. You will learn how to:

- make the columns of a server grid editable (`editable`, as in 164);
- write a value into the row at once and save it on the server (`saveEdit`, `cellEdited`);
- show a cell that is being saved and one whose save failed (the marks of `saveEdit`), and take the marks away (`dismissEditMarks`);
- tell the user how the save ended (`GrdGridSaveResult`);
- load the saved data again (`refresh`).

It is the application of 166 with editable columns, from the series about the grid (160–168), and its last tutorial.

```
npm run tutorial 168
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30168, choose a server delay of 1000 ms, double click a salary, type a new one and press Enter. Then turn on **The server fails** and change a department.

## Step by step

Start from the application of 166 (or one made by `npm run tutorial:eject 166 path/to/new-folder` in the root of the repository).

### Step 1: the server saves

The pretend server gets a method that keeps a change of one person, after its wait; it fails while **The server fails** is on:

```ts
/** Keeps a change of one person, after the wait. It fails while `failing` is on. */
async save(id: number, change: Partial<Person>): Promise<void> {
  this.saves.update((count) => count + 1);
  await this.wait();
  const index = this.people.findIndex((person) => person.id === id);
  if (index < 0) throw new Error(`No person ${id}`);
  this.people[index] = { ...this.people[index], ...change };
}
```

A real application sends the change to its API here (`fetch` with `PATCH /api/people/12`, say) and throws when the answer is not OK.

### Step 2: editable columns

Name, Department and Salary can be edited, with the editors of 164:

```ts
{
  field: 'name',
  header: 'Name',
  sortable: true,
  filterable: true,
  editable: true,
  editorOptions: { required: true },
},
{
  field: 'department',
  header: 'Department',
  sortable: true,
  filterable: true,
  filterOptions: DEPARTMENTS,
  editable: true,
  editorOptions: { options: DEPARTMENTS },
},
```

**Salary** gets `editable: true` and `editorOptions: { min: 0, step: 1000 }` (see _The code_).

### Step 3: save the edit

The grid tells `cellEdited`, as in 164:

```html
<!-- (cellEdited): the value goes into the cell at once, and to the server -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  [mode]="paged() ? 'pagination' : 'virtual'"
  [aboveHeader]="{ start: ['rowCount', 'filterChips'], end: ['refresh'] }"
  (cellEdited)="save($event)"
  ariaLabel="People"
/>
```

`saveEdit` of the source does the rest: it writes the value into its row at once, marks the cell while the function saves it, and when the function throws, puts the old value back and marks the cell red. Its result says how it ended:

```ts
protected async save(edit: GrdGridCellEdit): Promise<void> {
  const change = { [edit.field]: edit.value } as Partial<Person>;
  this.line.set(`Saving ${edit.field} of ${edit.rowId}…`);
  const result = await this.source.saveEdit(edit, () =>
    this.server.save(edit.rowId as number, change),
  );
  this.line.set(
    result.ok
      ? `Saved: ${edit.field} of ${edit.rowId} is ${edit.text} (saves: ${this.server.saves()}).`
      : `Not saved: ${(result.error as Error).message}. The old value is back.`,
  );
}
```

### Step 4: the red marks

A failed cell keeps its red frame until it is edited again, or until the page takes the marks away:

```html
<grd-button label="Forget the red marks" (pressed)="source.dismissEditMarks()" />
```

### Step 5: run it

```
npm run tutorial 168
```

## Try it

1. **Save.** Choose **Server delay** 1000 ms. Double click the salary in row 1, type `80000` and press Enter: the cell shows €80,000 at once, dimmed while the server works, then _Saved: salary of 1 is 80000_.
2. **The server has it.** Press **Refresh**: the rows come from the server again, with the new salary.
3. **A failure.** Turn on **The server fails** and choose another department for a row: the new department is shown, and after a second the old one is back, in a red frame. _Not saved: The server does not answer._ Point at the cell: its tooltip says that the change was not saved.
4. **Edit again.** Edit the red cell again (with the server back): the mark goes, and the new value is saved.
5. **Forget the marks.** Make a save fail again and press **Forget the red marks**.
6. **Sorted.** Sort by **Salary** and change a salary: the row stays where it is until **Refresh**, because the server sorts. Then it moves to its new place.

## The code

`src/app/app.ts`:

```ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridRemoteDataSource,
  GrdSelect,
  GrdSwitch,
  type GrdGridCellEdit,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { CITIES, DEPARTMENTS, type Person } from './people';
import { PeopleServer } from './people-server';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Remote saving"
      subtitle="edits saved on the server"
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
        <grd-button label="Forget the red marks" (pressed)="source.dismissEditMarks()" />
      </div>
      <!-- (cellEdited): the value goes into the cell at once, and to the server -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [mode]="paged() ? 'pagination' : 'virtual'"
        [aboveHeader]="{ start: ['rowCount', 'filterChips'], end: ['refresh'] }"
        (cellEdited)="save($event)"
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

  /** The columns of 166; Name, Department and Salary can be edited (164). */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
      editable: true,
      editorOptions: { required: true },
    },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterOptions: DEPARTMENTS,
      editable: true,
      editorOptions: { options: DEPARTMENTS },
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
      editable: true,
      editorOptions: { min: 0, step: 1000 },
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

  protected readonly line = signal('Double click a name, a department or a salary, and change it.');

  /**
   * `cellEdited`: `saveEdit` writes the value into the row at once and calls the function that saves it.
   * While the server works the cell is dimmed; when it fails, the old value comes back and the cell gets
   * a red frame.
   */
  protected async save(edit: GrdGridCellEdit): Promise<void> {
    const change = { [edit.field]: edit.value } as Partial<Person>;
    this.line.set(`Saving ${edit.field} of ${edit.rowId}…`);
    const result = await this.source.saveEdit(edit, () =>
      this.server.save(edit.rowId as number, change),
    );
    this.line.set(
      result.ok
        ? `Saved: ${edit.field} of ${edit.rowId} is ${edit.text} (saves: ${this.server.saves()}).`
        : `Not saved: ${(result.error as Error).message}. The old value is back.`,
    );
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
  /** How many changes the grid sent to be saved. */
  readonly saves = signal(0);

  private readonly people = makePeople(20_000);

  /** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
  async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
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

  /** Keeps a change of one person, after the wait. It fails while `failing` is on. */
  async save(id: number, change: Partial<Person>): Promise<void> {
    this.saves.update((count) => count + 1);
    await this.wait();
    const index = this.people.findIndex((person) => person.id === id);
    if (index < 0) throw new Error(`No person ${id}`);
    this.people[index] = { ...this.people[index], ...change };
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
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **At once, then saved.** The user sees the new value right away; the server confirms it or not. That is why the grid changes no data by itself: the page decides when a value is true.
- **The marks** belong to the source (`editMarks`): `saving` (the cell is dimmed and busy for a screen reader) and `failed` (a red frame and a tooltip). The grid draws them.
- **When a save fails** the old value (`previous` of the edit) comes back, unless the cell was changed again meanwhile: then the newer value stays.
- **Several cells at once.** A paste (165) saves its cells with `saveEdits`: one function for all of them, and they stand or fall together.
- **The place of the row.** A server source does not sort or filter by itself, so a saved value that the table is sorted or filtered by does not move the row until **Refresh** (`source.refresh()`), which loads the pages again and keeps the place in the table.
- **The array source** (164) has the same `saveEdit`, for data that is in the browser but saved on a server.

## What you get without writing any of it

- **The marks of the cells** while saving and after a failure, with their tooltip.
- **The old value back** after a failure, and a newer edit never overwritten by an old answer.
- **The editors and the rules** of 164 in the cells of a server grid.

## Build it from 166

The quick way: `npm run tutorial:eject 168 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 166 (_Build it from 161_ there), and replace `src/app/app.ts` and `src/app/people-server.ts` with the code above.
