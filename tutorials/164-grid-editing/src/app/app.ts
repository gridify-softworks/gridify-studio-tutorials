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
