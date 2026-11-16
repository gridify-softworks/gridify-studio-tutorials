import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdGrid, GrdGridArrayDataSource, GrdGridColumnDef, tkx } from '@gridify/studio';
import { COUNTRIES, Country } from './countries';

@Component({
  selector: 'app-table-page',
  imports: [GrdGrid, RouterLink],
  template: `
    <h1>Countries</h1>
    <p>
      A <code>grd-grid</code> on the page <code>/table</code>. Click the title of a column to sort
      by it.
    </p>
    <a routerLink="/form">Register a customer card →</a>
    <grd-grid [columns]="columns" [dataSource]="source" ariaLabel="Countries" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
      height: 100%;
      padding: 16px 20px;
    }
    h1,
    p {
      margin: 0;
    }
    h1 {
      font-size: 1.15rem;
    }
    a {
      align-self: start;
      color: var(--grd-link-color, var(--grd-accent));
    }
    /* The grid takes the rest of the height and scrolls its rows itself. */
    grd-grid {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class TablePage {
  protected readonly columns: GrdGridColumnDef<Country>[] = [
    { field: 'country', header: 'Country', sortable: true },
    { field: 'capital', header: 'Capital', sortable: true },
    { field: 'continent', header: 'Continent', sortable: true },
    {
      field: 'population',
      header: 'Population',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 0 },
    },
    {
      field: 'area',
      header: 'Area (km²)',
      type: 'number',
      sortable: true,
      format: { maximumFractionDigits: 0 },
    },
  ];

  /** The rows; `tkx` gives the grid the texts of the library (the empty table, the filters). */
  protected readonly source = new GrdGridArrayDataSource<Country>(COUNTRIES, {
    getRowId: (row) => row.code,
    i18n: { text: tkx },
  });
}
