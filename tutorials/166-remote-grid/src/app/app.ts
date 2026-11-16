import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdGrid,
  GrdGridRemoteDataSource,
  GrdSelect,
  GrdSwitch,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { CITIES, DEPARTMENTS, type Person } from './people';
import { PeopleServer } from './people-server';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdGrid, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Remote grid"
      subtitle="20 000 people from a server"
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

  /** The columns of 160 with the filters of 161: the server sorts and filters now. */
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
    { field: 'city', header: 'City', sortable: true, filterable: true, filterOptions: CITIES },
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

  protected readonly delays = [0, 300, 1000, 3000].map((ms) => ({ value: ms, label: `${ms} ms` }));
  protected readonly paged = signal(false);

  protected readonly line = computed(
    () =>
      `Requests: ${this.server.requests()} (${this.server.aborted()} stopped). ` +
      `Last: ${this.server.lastRequest()}.`,
  );

  constructor() {
    // The source stops its requests and its timers with the page.
    inject(DestroyRef).onDestroy(() => this.source.destroy());
  }
}
