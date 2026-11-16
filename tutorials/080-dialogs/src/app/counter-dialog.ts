import { Component, input, linkedSignal } from '@angular/core';
import { GrdButton, injectGrdDialogRef } from '@gridify/studio';

/** The body of a dialog: a counter. Its state lives in the component while the dialog is open, and its own button closes the dialog with the count. */
@Component({
  selector: 'app-counter-dialog',
  imports: [GrdButton],
  template: `
    <p>A component in the body of a dialog: it has inputs, a state and buttons of its own.</p>
    <div class="row">
      <grd-button icon="grd:minus" iconOnly label="Less" (pressed)="count.set(count() - 1)" />
      <span class="count">{{ count() }}</span>
      <grd-button icon="grd:plus" iconOnly label="More" (pressed)="count.set(count() + 1)" />
    </div>
    <grd-button variant="primary" [label]="'Close with ' + count()" (pressed)="done()" />
  `,
  styles: `
    p {
      margin: 0 0 12px;
      max-width: 40ch;
      line-height: 1.45;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .count {
      min-width: 3ch;
      text-align: center;
      font-size: 1.4rem;
      font-weight: 600;
    }
  `,
})
export class CounterDialog {
  /** The first value, from `inputs` of the dialog. */
  readonly start = input(0);
  /** The count starts at `start` and then goes its own way. */
  protected readonly count = linkedSignal(() => this.start());
  /** The dialog this component is the body of: `close(value)` closes it with a result. */
  private readonly ref = injectGrdDialogRef<number>();

  protected done(): void {
    this.ref.close(this.count());
  }
}
