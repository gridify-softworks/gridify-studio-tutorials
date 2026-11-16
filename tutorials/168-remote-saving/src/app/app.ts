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
