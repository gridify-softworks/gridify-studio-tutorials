import { Component, computed, inject, input, signal } from '@angular/core';
import { GrdButton, GrdTabContext } from '@gridify/studio';

/** The customers of a pretend shop, by their id. */
const CUSTOMERS: Record<number, { name: string; city: string }> = {
  7: { name: 'Blue Harbor Café', city: 'Lisbon' },
  42: { name: 'Northwind Tools', city: 'Oslo' },
};

/**
 * A customer card. Which customer it shows is an input, `customerId`: the engine saves the inputs of the tab with the layout, so after a reload the card
 * shows the same customer. `compact` is an input too, which the card changes itself through the engine, so it is saved the same way. The calls counted
 * here are the component's own state, and that is not saved.
 */
@Component({
  selector: 'app-customer',
  imports: [GrdButton],
  template: `
    <h3>{{ customer().name }}</h3>
    @if (!compact()) {
      <p>Customer {{ customerId() }}, {{ customer().city }}.</p>
    }
    <grd-button [label]="'Calls: ' + calls()" (pressed)="calls.set(calls() + 1)" />
    <grd-button [label]="compact() ? 'More' : 'Less'" (pressed)="toggleCompact()" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    grd-button + grd-button {
      margin-inline-start: 8px;
    }
  `,
})
export class Customer {
  readonly customerId = input.required<number>();
  /** Only the name, without the line under it. Saved with the tab, like `customerId`. */
  readonly compact = input(false);

  /** The tab of the card: its id, and the engine it is in. */
  private readonly tab = inject(GrdTabContext);
  protected readonly customer = computed(
    () => CUSTOMERS[this.customerId()] ?? { name: 'Unknown customer', city: 'nowhere' },
  );
  protected readonly calls = signal(0);

  /**
   * Less or More: the card asks the engine for a new value of its own input. The engine sets it on the card at once and keeps it with the tab, so the
   * saved layout has `"compact": true`, and the card is compact again after a reload. A field set here would be forgotten, like the calls.
   */
  protected toggleCompact(): void {
    this.tab.engine.api.setTabInputs(this.tab.tabId, { compact: !this.compact() });
  }
}
