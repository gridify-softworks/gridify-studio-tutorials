import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Customer } from './customer';
import { Invoice } from './invoice';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-117-layout';

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  protected readonly layoutKey = LAYOUT_KEY;
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);
  private readonly registry = inject(GrdContentRegistry);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // Every key that can be in a saved layout is registered at startup, before the saved tabs come back.
    this.registry.registerComponent('customer', Customer);
    // The key 'invoice' is not registered here, on purpose: see openInvoice.
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Open customer &42', run: () => this.openCustomer(42) },
        { label: 'Open customer &7', run: () => this.openCustomer(7) },
        { separator: true },
        { label: 'Open an &invoice', run: () => this.openInvoice() },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'registry',
      label: 'Re&gistry',
      items: [{ label: '&Register the invoice now', run: () => this.registerInvoice() }],
    },
  ];

  /**
   * A customer tab: the component by its key, the customer by an input. Both are saved with the layout, `"componentKey": "customer"` and
   * `"inputs": { "customerId": 42 }`, and after a reload the engine makes the component again from them.
   */
  private openCustomer(customerId: number): void {
    this.engine().openComponentTab({
      title: `Customer ${customerId}`,
      componentKey: 'customer',
      inputs: { customerId },
    });
  }

  /**
   * An invoice tab, given by its class and a key together. That registers the key, but only while the page runs: after a reload nothing registers it,
   * and the tab shows an error. The cure is one line in the constructor, like the one of the customer.
   */
  private openInvoice(): void {
    this.engine().openComponentTab({
      title: 'Invoice 2026-118',
      componentType: Invoice,
      componentKey: 'invoice',
      inputs: { number: '2026-118' },
    });
  }

  /** What the constructor should have done. After it, Try again in the tab of the invoice finds the class. */
  private registerInvoice(): void {
    if (!this.registry.hasComponent('invoice')) this.registry.registerComponent('invoice', Invoice);
  }

  /** What the engine wrote into localStorage under the key, in a dialog: the saved layout as JSON. */
  private showSaved(): void {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const text = saved ? JSON.stringify(JSON.parse(saved), null, 2) : 'Nothing is saved yet.';
    this.dialogs.open({
      title: `localStorage["${LAYOUT_KEY}"]`,
      html: `<pre class="saved">${escapeHtml(text)}</pre>`,
      width: 720,
      height: 520,
      resizable: true,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
