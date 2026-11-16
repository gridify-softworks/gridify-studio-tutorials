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
