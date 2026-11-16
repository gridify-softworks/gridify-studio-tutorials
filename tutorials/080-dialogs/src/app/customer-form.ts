import { Component, computed, effect, signal } from '@angular/core';
import { GrdInput, injectGrdDialogRef } from '@gridify/studio';

/** What the customer form gives back. */
export interface Customer {
  name: string;
  email: string;
}

/**
 * The body of a dialog with the buttons of the dialog (Cancel, Save): the form keeps the Save button up to date while it is typed in. Save is disabled
 * without a name, and its result is the customer as it is now, so the dialog closes with it.
 */
@Component({
  selector: 'app-customer-form',
  imports: [GrdInput],
  template: `
    <grd-input label="Name" required [(value)]="name" autocomplete="off" />
    <grd-input label="E-mail" type="email" [(value)]="email" autocomplete="off" />
  `,
  styles: `
    :host {
      display: grid;
      gap: 4px;
      min-width: 280px;
    }
  `,
})
export class CustomerForm {
  readonly name = signal('');
  readonly email = signal('');
  private readonly customer = computed<Customer>(() => ({
    name: this.name().trim(),
    email: this.email().trim(),
  }));

  constructor() {
    const ref = injectGrdDialogRef<Customer | null>();
    effect(() => {
      const customer = this.customer();
      ref.patchButton('save', { disabled: !customer.name, result: customer });
    });
  }
}
