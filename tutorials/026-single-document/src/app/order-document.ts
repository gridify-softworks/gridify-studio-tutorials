import { Component, effect, inject } from '@angular/core';
import {
  GrdDatePicker,
  GrdGrid,
  GrdGridArrayDataSource,
  GrdGroupBox,
  GrdInput,
  tkx,
  type GrdGridCellEdit,
  type GrdGridColumnDef,
} from '@gridify/studio';
import { OrderStore, type OrderLine } from './order';

const EUR = { style: 'currency', currency: 'EUR' } as const;

/**
 * The document: the order, a form and a table. It is the empty document area of the engine (`emptyDocument`), so it fills the middle of the
 * window without a tab. What it shows lives in `OrderStore`.
 */
@Component({
  selector: 'app-order-document',
  imports: [GrdDatePicker, GrdGrid, GrdGroupBox, GrdInput],
  template: `
    <!-- the trick of this tutorial, said on the page itself -->
    <p class="note">
      A single-document application (SDI), as the desktop programs of MFC had it, made with one
      trick: this order is the empty document area of the docking engine
      (<code>emptyDocument</code>), so it fills the middle of the window without a tab, and the
      tools dock around it.
    </p>
    <grd-group-box heading="Order" icon="grd:document">
      <grd-input
        label="Customer"
        required
        [value]="order.customer()"
        (valueChange)="order.setCustomer($event)"
      />
      <grd-date-picker label="Date" [value]="order.date()" (valueChange)="order.setDate($event)" />
    </grd-group-box>
    <!-- the quantity is edited in the table; the row of totals adds up the amounts -->
    <grd-grid
      [columns]="columns"
      [dataSource]="source"
      (cellEdited)="edit($event)"
      ariaLabel="Items of the order"
    />
  `,
  styles: `
    :host {
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      overflow: auto;
    }
    .note {
      margin: 0;
      max-width: 60em;
      line-height: 1.5;
    }
    grd-group-box {
      --grd-group-box-columns: repeat(auto-fit, minmax(min(12em, 100%), 1fr));
    }
    grd-grid {
      flex: 1;
      min-height: 12em;
    }
  `,
})
export class OrderDocument {
  protected readonly order = inject(OrderStore);

  protected readonly columns: GrdGridColumnDef<OrderLine>[] = [
    { field: 'item', header: 'Item', sortable: true },
    {
      field: 'quantity',
      header: 'Quantity',
      type: 'number',
      editable: true,
      editorOptions: { min: 0, max: 999, step: 1 },
    },
    { field: 'price', header: 'Price', type: 'number', format: EUR },
    { field: 'amount', header: 'Amount', type: 'number', format: EUR, footer: 'sum' },
  ];

  protected readonly source = new GrdGridArrayDataSource<OrderLine>(this.order.lines(), {
    getRowId: (line) => line.id,
    i18n: { text: tkx },
  });

  constructor() {
    this.order.documentMade();
    // The lines live in the store: the table shows them again whenever they change.
    effect(() => this.source.setRows(this.order.lines()));
  }

  /** `cellEdited`: the grid changes no data; the store does, and the table follows it. */
  protected edit(edit: GrdGridCellEdit): void {
    if (edit.field === 'quantity') {
      this.order.setQuantity(Number(edit.rowId), edit.value as number | null);
    }
  }
}
