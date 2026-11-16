import { Component, computed, effect, inject, signal } from '@angular/core';
import { GrdButton, GrdDialog, injectGrdDialogRef } from '@gridify/studio';
import { CustomerPicker } from './customer-picker';

/**
 * The parent of the layered dialogs: an order that needs a customer. "Choose a customer…" opens a second modal dialog over this one (the child), waits for
 * its result and shows it; the Confirm button of this dialog then closes it with the order.
 */
@Component({
  selector: 'app-order-dialog',
  imports: [GrdButton],
  template: `
    <p>
      Order <b>{{ number() }}</b>
    </p>
    <p>
      Customer: <b class="customer">{{ customer() ?? 'none yet' }}</b>
    </p>
    <grd-button label="Choose a customer…" (pressed)="choose()" />
  `,
  styles: `
    p {
      margin: 0 0 10px;
    }
  `,
})
export class OrderDialog {
  readonly number = signal(1042);
  protected readonly customer = signal<string | null>(null);
  private readonly dialogs = inject(GrdDialog);
  private readonly ref = injectGrdDialogRef<string>();

  constructor() {
    // Confirm is disabled until there is a customer; its result is the order as it is now.
    const order = computed(() => `Order ${this.number()} for ${this.customer()}`);
    effect(() => this.ref.patchButton('confirm', { disabled: !this.customer(), result: order() }));
  }

  /** The child dialog: modal over this one, which waits under it, and cascaded from it (parent). Its result comes back here, not to the page. */
  protected async choose(): Promise<void> {
    const child = this.dialogs.open<string | null>({
      title: 'Choose a customer',
      subtitle: 'The second level: the order waits under this dialog.',
      component: CustomerPicker,
      inputs: { current: this.customer() },
      parent: this.ref,
      buttons: [{ id: 'cancel', label: 'Cancel', cancel: true, result: null }],
    });
    const picked = await child.closed;
    if (picked) this.customer.set(picked);
  }
}
