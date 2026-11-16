import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { GrdButton, GrdInput, GrdSpinner } from '@gridify/studio';
import { firstValueFrom } from 'rxjs';

/** A new order. The guard lets in only who may edit the orders (`orders.edit`). */
@Component({
  selector: 'app-new-order',
  imports: [GrdButton, GrdInput, GrdSpinner],
  template: `
    <h1>New order</h1>
    <div class="form">
      <grd-input label="Customer" required [(value)]="customer" />
      <grd-spinner label="Total" [min]="0" [(value)]="total" />
      <grd-button
        label="Save"
        variant="primary"
        [disabled]="!customer().trim()"
        (pressed)="save()"
      />
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    .form {
      display: grid;
      gap: 12px;
      max-width: 24em;
    }
  `,
})
export class NewOrderPage {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly customer = signal('');
  protected readonly total = signal<number | null>(100);

  /** POST /demo-api/orders: the server checks `orders.edit` again. Then back to the list. */
  protected async save(): Promise<void> {
    const order = { customer: this.customer().trim(), total: this.total() ?? 0 };
    await firstValueFrom(this.http.post('/demo-api/orders', order));
    void this.router.navigateByUrl('/orders');
  }
}
