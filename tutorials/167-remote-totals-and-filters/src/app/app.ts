import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdGrid,
  GrdGridRemoteDataSource,
  GrdSelect,
  GrdSwitch,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { type Person } from './people';
import { PeopleServer } from './people-server';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Remote totals and filters"
      subtitle="the server counts and sums"
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
        <grd-switch
          label="The server counts the rows"
          [reserveMessageSpace]="false"
          [checked]="server.countsRows()"
          (checkedChange)="countRows($event)"
        />
      </div>
      <!-- the same grid as with an array: only the source is another one -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [mode]="paged() ? 'pagination' : 'virtual'"
        [aboveHeader]="{ start: ['rowCount', 'filterChips'], end: ['refresh'] }"
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
   * The source of 166 with two more questions for the server: the totals of the columns with a
   * `footer` (the fourth parameter) and the values of the filters with `filterOptions: 'auto'`
   * (`fetchFilterOptions`).
   */
  protected readonly source = new GrdGridRemoteDataSource<Person>(
    (params) => this.server.fetchPage(params),
    (person) => person.id,
    50,
    (params) => this.server.fetchTotals(params),
    {
      retry: { attempts: 1, baseDelayMs: 500 },
      fetchFilterOptions: (params) => this.server.fetchValues(params),
    },
  );

  /** The columns of 166; the lists of the filters come from the server, and two columns have totals. */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true, filterable: true },
    {
      field: 'department',
      header: 'Department',
      sortable: true,
      filterable: true,
      filterOptions: 'auto',
    },
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: 'auto' },
    {
      field: 'age',
      header: 'Age',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { maximumFractionDigits: 1 },
      footer: 'avg',
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      filterable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      footer: ['sum', 'avg'],
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

  protected readonly line = computed(
    () =>
      `Requests: pages ${this.server.requests()}, totals ${this.server.totalsRequests()}, ` +
      `lists of values ${this.server.valuesRequests()}. Last: ${this.server.lastRequest()}.`,
  );

  /** The server counts from now on, or stops: the source loads the data again to see it. */
  protected countRows(on: boolean): void {
    this.server.countsRows.set(on);
    this.source.refresh();
  }

  constructor() {
    // The source stops its requests and its timers with the page.
    inject(DestroyRef).onDestroy(() => this.source.destroy());
  }
}
