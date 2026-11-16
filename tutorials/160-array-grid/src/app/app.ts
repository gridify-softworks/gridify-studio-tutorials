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
