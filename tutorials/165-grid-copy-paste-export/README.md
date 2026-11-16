# 165 – Copy, paste and export

This tutorial shows how the grid works together with a spreadsheet: the user copies cells and rows with Ctrl+C, pastes a table from Excel with Ctrl+V, and downloads all the rows as a CSV file. You will learn how to:

- select a range of cells and sum it up in the bar (`cellSelectionMode`, `aggregate`, the bar item `summary`);
- choose what Ctrl+C copies: the values of the data or the texts of the cells, with the titles or without (`copyFormat`, `copyHeaders`);
- take a pasted table into the data, and tell the user which cells were refused and why (`cellsPasted`, `applyEdits`);
- download all the rows as CSV (`exportFileName`, the bar items `copy` and `export`);
- switch between rows and cells from the bar (`navigationToggle`).

It is the application of 164 (the editable columns) with the bar of copying and exporting, from the series about the grid (160–168).

```
npm run tutorial 165
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30165, click the salary in row 1, Shift+click the salary in row 3, press Ctrl+C, click the salary in row 6 and press Ctrl+V.

## Step by step

Start from the application of 164 (or one made by `npm run tutorial:eject 164 path/to/new-folder` in the root of the repository).

### Step 1: what the summary counts

`aggregate` says what the summary may compute from a column, for the selected cells or rows:

```ts
aggregate: ['avg', 'min', 'max'],
```

on **Age**, and on **Salary**:

```ts
aggregate: ['sum', 'avg'],
```

### Step 2: the grid

```html
<!-- copyFormat="raw": Ctrl+C copies the values of the data (73600), not the texts of the cells (€73,600) -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  navigation="cell"
  selectionMode="multiple"
  copyFormat="raw"
  [copyHeaders]="withTitles()"
  exportFileName="people"
  [aboveHeader]="{ start: ['summary'], end: ['navigationToggle', 'copy', 'export'] }"
  (cellEdited)="save($event)"
  (cellsPasted)="pasted($event)"
  ariaLabel="People"
/>
```

- In the cell mode (`navigation="cell"`, from 164) Shift+click, Shift+arrows or dragging select a range of cells (`cellSelectionMode` is `multiple` by default).
- `selectionMode="multiple"` gives the rows check boxes, for copying whole rows.
- `copyFormat="raw"` copies the values as the data has them: `73600`, `2011-10-05`, `true`. A spreadsheet counts with them. The default, `display`, copies the texts of the cells (`€73,600`, `05/10/2011`), for reading. Both paste back into the grid as the same values.
- `copyHeaders` starts a copy of rows with a line of the titles.
- `exportFileName` is the start of the name of the CSV file; the date and the time are added.
- The bar: the summary at the start, and at the end the buttons Rows / Cells, **Copy** and **Export CSV**.

### Step 3: the titles or not

A switch above the grid:

<!-- prettier-ignore -->
```html
<grd-switch
  label="Copy the titles too"
  [reserveMessageSpace]="false"
  [(checked)]="withTitles"
/>
```

```ts
/** Ctrl+C starts with a row of the titles of the columns. */
protected readonly withTitles = signal(false);
```

### Step 4: a pasted table

Ctrl+V in the cell mode lays the table of the clipboard on the cells, from the active cell on (tabs between the cells and line breaks between the rows, as a spreadsheet copies them). Each text is read by its column, as a typed value is, and judged by its rules: a number, a date written as the column writes it or as an ISO date, yes or no, a value of a list, `required`, the limits, `validate`. The grid changes no data and tells `cellsPasted`: `edits` are the cells that get a new value, `rejected` the texts that were not good, with the reason:

```ts
/** `cellsPasted`: Ctrl+V laid a table on the cells. The good cells go into the rows at once. */
protected pasted(paste: GrdGridPaste): void {
  this.source.applyEdits(paste.edits);
  const refused = paste.rejected.map((cell) => `"${cell.text}" (${cell.error})`);
  this.lastChange.set(
    `Pasted ${paste.edits.length} cells` +
      (refused.length ? `; not taken: ${refused.join(', ')}` : '.'),
  );
}
```

`applyEdits` writes all the cells with one change of the data. `cellEdited` is not told for the cells of a paste.

### Step 5: run it

```
npm run tutorial 165
```

## Try it

1. **A range.** Click the salary in row 1 and Shift+click the salary in row 3: the bar says _Range 3 × 1 (3 cells)_ and the sum and the average of the three salaries.
2. **Copy.** Press Ctrl+C (or **Copy** in the bar). A message under the table says what was copied; paste it into a text editor: `73600`, `62400`, `100000`.
3. **Paste.** Click the salary in row 6 and press Ctrl+V: rows 6 to 8 get the three salaries. _Pasted 3 cells._
4. **From a spreadsheet.** Copy two rows of two cells from Excel or LibreOffice, a department and a city in each (for example _Sales, Prague_ and _Marketing, Vienna_), click a department and press Ctrl+V. _Marketing_ is not one of the departments: it is refused, with the reason, and the other three cells are taken.
5. **Rows.** Press **Rows** in the bar, tick two rows and turn on **Copy the titles too**; Ctrl+C copies the titles and the two rows, all the columns.
6. **One value into many cells.** Copy one age (click it, Ctrl+C), select a range of ages and press Ctrl+V: the one value fills the whole range.
7. **Export.** Press **Export CSV**: a file `people-…csv` with the titles and all 500 rows, after the filters and the sorting. Open it in a spreadsheet.

## The code

`src/app/app.ts`:

```ts
import { Component, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdSwitch,
  tkx,
  type GrdGridCellEdit,
  type GrdGridColumnDef,
  type GrdGridPaste,
} from '@gridify/studio';
import { CITIES, DEPARTMENTS, makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSwitch],
  template: `
    <grd-app-header
      productName="Copy, paste and export"
      subtitle="the grid and a spreadsheet"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-switch
          label="Copy the titles too"
          [reserveMessageSpace]="false"
          [(checked)]="withTitles"
        />
      </div>
      <!-- copyFormat="raw": Ctrl+C copies the values of the data (73600), not the texts of the cells (€73,600) -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        navigation="cell"
        selectionMode="multiple"
        copyFormat="raw"
        [copyHeaders]="withTitles()"
        exportFileName="people"
        [aboveHeader]="{ start: ['summary'], end: ['navigationToggle', 'copy', 'export'] }"
        (cellEdited)="save($event)"
        (cellsPasted)="pasted($event)"
        ariaLabel="People"
      />
      <p class="line" aria-live="polite">{{ lastChange() }}</p>
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
  /** The columns of 164; `aggregate` says what the summary computes from the selected cells. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      editable: true,
      editorOptions: { required: true, maxLength: 40 },
    },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      editable: true,
      editorOptions: { options: DEPARTMENTS },
    },
    {
      field: 'city',
      header: 'City',
      sortable: true,
      editable: true,
      editor: 'combobox',
      editorOptions: { options: CITIES },
    },
    {
      field: 'age',
      header: 'Age',
      type: 'number',
      sortable: true,
      editable: true,
      editorOptions: { min: 18, max: 70 },
      aggregate: ['avg', 'min', 'max'],
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      editable: true,
      editorOptions: { min: 0, step: 1000 },
      aggregate: ['sum', 'avg'],
    },
    {
      field: 'hired',
      header: 'Hired',
      type: 'date',
      sortable: true,
      format: 'dd/MM/yyyy',
      editable: true,
    },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true, editable: true },
  ];

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** Ctrl+C starts with a row of the titles of the columns. */
  protected readonly withTitles = signal(false);
  protected readonly lastChange = signal('No change yet.');

  /** `cellEdited`: one cell, as in 164. */
  protected save(edit: GrdGridCellEdit): void {
    this.source.applyEdit(edit);
    this.lastChange.set(`Row ${edit.rowId}, ${edit.field}: ${edit.text}`);
  }

  /** `cellsPasted`: Ctrl+V laid a table on the cells. The good cells go into the rows at once. */
  protected pasted(paste: GrdGridPaste): void {
    this.source.applyEdits(paste.edits);
    const refused = paste.rejected.map((cell) => `"${cell.text}" (${cell.error})`);
    this.lastChange.set(
      `Pasted ${paste.edits.length} cells` +
        (refused.length ? `; not taken: ${refused.join(', ')}` : '.'),
    );
  }
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **The clipboard is text.** Ctrl+C writes the cells with tabs and line breaks (`copyAs: 'text'`, a spreadsheet pastes it as a table); `aligned` lines the columns up with spaces for an e-mail, `csv` writes CSV. Ctrl+Shift+C copies whole rows.
- **What was copied pastes back.** The grid reads a pasted number in its language (`1234.5`, `1 234,5`, `1.234,5`; `73,600` is 73600 in English and 73.6 in Czech) and with what the format of its column writes around it (the currency of `€73,600`), a date as an ISO text or in the order of the pattern of its column, and a value of a list by its label or its value. So the raw values and the texts of the cells both paste back as the same values; this tutorial copies the raw values because a spreadsheet counts with them.
- **A paste changes the data once.** `applyEdits` writes all the cells together; a paste over a server saves them together with `saveEdits` (see 168 for `saveEdit`).
- **The export** takes all the rows after the filters and the sorting, not only the drawn ones. It writes the values of the data (`exportFormat: 'raw'`, the default); `display` writes the texts of the cells.
- **What a paste does not do:** it adds no rows or columns; a table longer than the rows is cut.

## What you get without writing any of it

- **Selecting a range** with Shift+click, Shift+arrows, dragging (the edge of the table scrolls it), the handles in the corners of the outline, Ctrl+A.
- **The summary** of the range or of the selected rows, in the bar and for a screen reader.
- **The messages** under the table after a copy and after a paste with refused cells.
- **The CSV file** in the form a spreadsheet opens, with the date and the time in its name.

## Build it from 164

The quick way: `npm run tutorial:eject 165 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 164 (_Build it from 160_ there), and replace `src/app/app.ts` with the code above.
