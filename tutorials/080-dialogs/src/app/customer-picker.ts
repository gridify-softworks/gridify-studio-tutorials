import { Component, input } from '@angular/core';
import { GrdButton, injectGrdDialogRef } from '@gridify/studio';

/** The child of the layered dialogs: a list of customers. A click closes this dialog with the name (the order dialog under it gets it). */
@Component({
  selector: 'app-customer-picker',
  imports: [GrdButton],
  template: `
    <div class="list">
      @for (name of customers; track name) {
        <grd-button
          appearance="flat"
          icon="grd:user"
          [label]="name"
          [variant]="name === current() ? 'primary' : 'default'"
          (pressed)="pick(name)"
        />
      }
    </div>
  `,
  styles: `
    /* The names stand at the start of the buttons, as in a list. */
    .list {
      display: grid;
      gap: 2px;
      min-width: 260px;
      --grd-button-justify: flex-start;
    }
  `,
})
export class CustomerPicker {
  /** The customer the order has now (shown as chosen). */
  readonly current = input<string | null>(null);
  protected readonly customers = ['Jana Nováková', 'Petr Svoboda', 'Hana Dvořáková', 'Tomáš Černý'];
  private readonly ref = injectGrdDialogRef<string>();

  protected pick(name: string): void {
    this.ref.close(name);
  }
}
