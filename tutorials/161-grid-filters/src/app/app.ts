import { Component, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdSelect,
  tkx,
  type GrdGridColumnDef,
  type GrdGridFilterUi,
} from '@gridify/studio';
import { DEPARTMENTS, makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid, GrdSelect],
  template: `
    <grd-app-header
      productName="Grid filters"
      subtitle="filters in the header of the grid"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-select
          label="Filters in the header"
          [options]="filterUis"
          [value]="filterUi()"
          (valueChange)="setFilterUi($event)"
          [reserveMessageSpace]="false"
        />
        <grd-button label="Sales in Prague" (pressed)="salesInPrague()" />
        <grd-button label="Clear the filters" (pressed)="grid().clearAllFilters()" />
      </div>
      <!-- the bar above the header: the number of rows and a chip for every filter -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [filterUi]="filterUi()"
        [aboveHeader]="{ start: ['rowCount', 'filterChips'] }"
        emptyFilteredText="Nobody matches the filters."
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
      align-items: end;
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
  protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);

  /** `filterable` puts a filter of its kind into the header: text, a list of values, number, date, yes / no. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterOptions: DEPARTMENTS,
    },
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
    { field: 'age', header: 'Age', type: 'number', sortable: true, filterable: true },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
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

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** Where the filters are: a row of fields under the titles, a funnel in each title, or none. */
  protected readonly filterUi = signal<GrdGridFilterUi>('row');
  protected readonly filterUis: { value: GrdGridFilterUi; label: string }[] = [
    { value: 'row', label: 'A row under the titles' },
    { value: 'icon', label: 'A funnel in each title' },
    { value: 'off', label: 'None (only from the code)' },
  ];

  protected setFilterUi(value: GrdGridFilterUi | null): void {
    if (value) this.filterUi.set(value);
  }

  /** Filters from the code: the same filters the user sets in the header. */
  protected salesInPrague(): void {
    this.grid().setFilter('department', { kind: 'select', values: ['Sales'] });
    this.grid().setFilter('city', { kind: 'select', values: ['Prague'] });
  }
}
