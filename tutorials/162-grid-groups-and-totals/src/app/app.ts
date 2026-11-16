import { Component, computed, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGrid,
  GrdGridArrayDataSource,
  tkx,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGrid],
  template: `
    <grd-app-header
      productName="Groups and totals"
      subtitle="rows grouped by their values, with totals"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="bar">
        <grd-button label="By department" (pressed)="groupBy.set(['department'])" />
        <grd-button
          label="By department and city"
          (pressed)="groupBy.set(['department', 'city'])"
        />
        <grd-button label="No groups" (pressed)="groupBy.set([])" />
        <grd-button label="Expand all" (pressed)="grid().expandAllGroups()" />
        <grd-button label="Collapse all" (pressed)="grid().collapseAllGroups()" />
      </div>
      <!-- [(groupBy)]: the buttons above and the Group button of the grid change the same list -->
      <grd-grid
        [columns]="columns"
        [dataSource]="source"
        [(groupBy)]="groupBy"
        selectionMode="multiple"
        [aboveHeader]="{ start: ['rowCount', 'summary'], end: ['grouping'] }"
        ariaLabel="People"
      />
      <p class="line">Grouped by: {{ grouped() }}</p>
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
      gap: 8px;
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
  protected readonly grid = viewChild.required<GrdGrid<Person>>(GrdGrid);

  /**
   * `groupable`: the rows may be grouped by the column. `groupAggregate`: what a group row shows of the
   * column. `footer`: the totals row under the table. `aggregate`: what the summary of the selected rows
   * computes.
   */
  protected readonly columns: GrdGridColumnDef<Person>[] = [
    { field: 'id', header: 'Id', type: 'number', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'department', header: 'Department', sortable: true, groupable: true },
    { field: 'city', header: 'City', sortable: true, groupable: true },
    {
      field: 'age',
      header: 'Age',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 1 },
      groupAggregate: 'avg',
      footer: 'avg',
    },
    {
      field: 'salary',
      header: 'Salary',
      type: 'number',
      sortable: true,
      format: { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 },
      groupAggregate: 'sum',
      footer: ['sum', 'avg'],
      aggregate: ['sum', 'avg', 'min', 'max'],
    },
    { field: 'hired', header: 'Hired', type: 'date', sortable: true, format: 'd MMM yyyy' },
    { field: 'active', header: 'Active', type: 'boolean', sortable: true, groupable: true },
  ];

  protected readonly source = new GrdGridArrayDataSource<Person>(makePeople(500), {
    getRowId: (person) => person.id,
    i18n: { text: tkx },
  });

  /** The fields the rows are grouped by: the first is the top level. */
  protected readonly groupBy = signal<readonly string[]>([]);

  protected readonly grouped = computed(() => {
    const titles = this.groupBy().map(
      (field) => this.columns.find((c) => c.field === field)?.header,
    );
    return titles.length ? titles.join(' › ') : 'nothing';
  });
}
