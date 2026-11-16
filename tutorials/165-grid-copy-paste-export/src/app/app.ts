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
