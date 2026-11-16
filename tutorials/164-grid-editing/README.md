# 164 – Editing cells

This tutorial shows how to let the user edit the cells of a grid in place, with the right field for every type of value and with rules of your own, and how to write the new values into the data. You will learn how to:

- make a column editable, with the editor of its type: a text, a number with limits, a list, a text with suggestions, a date, a check box (`editable`, `editor`, `editorOptions`);
- check a value by a rule of your own, with the message the cell shows (`validate`, `required`);
- move through the cells as in a spreadsheet and start an edit by typing (`navigation="cell"`, `typeToEdit`);
- write the value into the row when the edit ends (`cellEdited`, `applyEdit`).

It is the application of 160 with editable columns instead of the selection, from the series about the grid (160–168).

```
npm run tutorial 164
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30164, double click a name, change it and press Enter. Then choose another department from the list, and type a salary of 160 000 for someone who is not in IT.

## Step by step

Start from the application of 160 (or one made by `npm run tutorial:eject 160 path/to/new-folder` in the root of the repository). The switch, the line under the grid and their code are not needed here: take out `several`, `selection`, `opened`, `setSeveral`, `open` and `line`.

### Step 1: editable columns

`editable: true` lets the user edit the cells of a column. The editor follows the type of the column; `editorOptions` sets it up, and `editor` chooses another one:

```ts
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
},
```

- **Name** is a text field; `required` refuses an empty name, `maxLength` a long one.
- **Department** has `options`, so it is a list to choose from: only these values.
- **City** is a combobox: the list suggests, but any city may be typed.
- **Age** is a number field with limits: a number above 70 becomes 70.

**Active** gets `editable: true` too: its check box switches with a click, without an editor (see _The code_).

### Step 2: a rule of your own

`validate` gets the value of the editor and the row, and returns the message, or `null` when the value is good. While there is a message, Enter and Tab do not end the edit, the cell has a red frame and a bubble says why:

```ts
{
  field: 'salary',
  header: 'Salary',
  type: 'number',
  sortable: true,
  format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
  editable: true,
  editorOptions: { min: 0, step: 1000 },
  validate: (value, person) =>
    typeof value === 'number' && person.department !== 'IT' && value > 150_000
      ? 'Above 150 000 only in IT'
      : null,
},
```

### Step 3: a date that can be typed

The date field types a date by the pattern of the column, so here the format is one of digits. A format with the name of a month (`d MMM yyyy` of 160) is for reading; with it, the field would write the date the way the language does:

```ts
// A format of digits (dd, MM, yyyy) is also the pattern that the date field types.
{
  field: 'hired',
  header: 'Hired',
  type: 'date',
  sortable: true,
  format: 'dd/MM/yyyy',
  editable: true,
},
```

### Step 4: cells as in a spreadsheet

`navigation="cell"` makes one cell active instead of a whole row: the arrow keys, Tab, Home and End move it. `typeToEdit` starts the edit with the first character you type, as a spreadsheet does (Enter, F2 and a double click start it always):

```html
<!-- navigation="cell": one cell is active, as in a spreadsheet -->
<grd-grid
  [columns]="columns"
  [dataSource]="source"
  navigation="cell"
  typeToEdit
  (cellEdited)="save($event)"
  ariaLabel="People"
/>
```

### Step 5: write the value

The grid changes no data. When an edit ends with a new value, it tells `cellEdited`: the id of the row, the field, the new value, the old one, and the text the editor showed. `applyEdit` of the source writes the value into its row:

```ts
/** `cellEdited`: the grid changes no data, so the value goes into the row here. */
protected save(edit: GrdGridCellEdit): void {
  this.source.applyEdit(edit);
  this.lastChange.set(
    `Row ${edit.rowId}, ${edit.field}: ${String(edit.previous)} → ${String(edit.value)}`,
  );
}
```

The value has the type of the column: a number for Salary, `true` or `false` for Active, an ISO date for Hired (the form the data had). An application with a server sends it there; 168 shows how.

### Step 6: run it

```
npm run tutorial 164
```

## Try it

1. **A text.** Double click the name in row 1, change it and press Enter. The cell below is active now. The line says _Row 1, name: Peter Brown → …_.
2. **Esc.** Press F2, type something, press Esc: the change is thrown away.
3. **Required.** Edit a name, delete it all and press Enter: _A value is required_, and the edit goes on.
4. **A list.** Double click a department: choose from the five departments.
5. **Suggestions.** Double click a city and type `V`: the list suggests Vienna, but you may type any city.
6. **Type to edit.** Click an age and type `77`, then Enter: the number field makes it 70.
7. **Your rule.** Type 160000 into the salary of someone in HR: _Above 150 000 only in IT_. In IT it is taken.
8. **A date.** Edit a date: type `03/03/2020`, or open the calendar with its button.
9. **A check box.** Click the check box of **Active**: it switches at once.
10. **Sorted.** Sort by **Salary** and change one: the row moves to its new place.

## The code

`src/app/app.ts`:

```ts
import { Component, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdGrid,
  GrdGridArrayDataSource,
  tkx,
  type GrdGridCellEdit,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { CITIES, DEPARTMENTS, makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid],
  template: `
    <grd-app-header
      productName="Grid editing"
      subtitle="cells edited in place"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <p class="hint">
        Double click a cell, or press Enter or F2, or just type. Enter saves and goes down, Tab goes
        right, Esc throws the change away.
      </p>
      <!-- navigation="cell": one cell is active, as in a spreadsheet -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        navigation="cell"
        typeToEdit
        (cellEdited)="save($event)"
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
    .hint,
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
  /** `editable`: the cell is edited by the editor of its type, or by the one `editor` names. */
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
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      editable: true,
      editorOptions: { min: 0, step: 1000 },
      validate: (value, person) =>
        typeof value === 'number' && person.department !== 'IT' && value > 150_000
          ? 'Above 150 000 only in IT'
          : null,
    },
    // A format of digits (dd, MM, yyyy) is also the pattern that the date field types.
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

  protected readonly lastChange = signal('No change yet.');

  /** `cellEdited`: the grid changes no data, so the value goes into the row here. */
  protected save(edit: GrdGridCellEdit): void {
    this.source.applyEdit(edit);
    this.lastChange.set(
      `Row ${edit.rowId}, ${edit.field}: ${String(edit.previous)} → ${String(edit.value)}`,
    );
  }
}
```

`src/app/people.ts`, `src/app/app.config.ts` and `src/styles.scss` are the ones of 160.

## How it fits together

- **The grid never changes the data.** It tells the page what the user wants (`cellEdited`), and the page decides: write it (`applyEdit`), send it to a server (168), or refuse it. An edit that changes nothing tells nothing.
- **The editor by the type:** `number` is a number field (`min`, `max`, `step`, `decimals`), `date` a date field with a calendar, `boolean` a check box in the cell, `options` a list, `editor: 'combobox'` a text with suggestions, and the rest a text field. `editorTemplate` puts a template of your own in the cell.
- **The rules:** `required`, the limits and `maxLength` of `editorOptions`, and `validate` of the page. A value that is not good never reaches `cellEdited`.
- **`applyEdit`** writes the value into a copy of the row: the array given to the source is not changed, and the row takes its place by the sorting again.

## What you get without writing any of it

- **The keys of a spreadsheet:** Enter ends the edit and goes down, Tab and Shift+Tab go to the next cell that can be edited, Esc throws the edit away, a click elsewhere ends it.
- **The editors of the library** in the cell, with their keys: arrows in a number, the calendar of a date, the list of a select.
- **The message of a rule** in a bubble at the cell, and the red frame.
- **The width** of an editable column leaves room for its editor.

## Build it from 160

The quick way: `npm run tutorial:eject 164 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)).

By hand: make the application of 160 (_Build it yourself from scratch_ there), and replace `src/app/app.ts` with the code above.
