import { AfterViewInit, Component, DestroyRef, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdEventMap,
  type GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdToast,
  GrdUnsavedWork,
  GrdUrlBridge,
} from '@gridify/studio';
import { InvoiceList } from './invoice-list';
import { InvoicePage } from './invoice-page';
import { findInvoice } from './invoices';
import { invoiceTag, Links } from './links';

/** The list of the invoices on the left, the place of the documents (the invoices) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'invoices', role: 'tool', title: 'Invoices', componentKey: 'invoices' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- The engine keeps WHERE the tabs are (localStorage); the address says WHICH invoices are open. -->
    <grd-docking-engine
      layoutStorageKey="tutorial-045-layout"
      [defaultLayout]="layout"
      (tabConfirmClose)="confirmClose($event)"
    />
    <!-- The unsaved work of the application: the marks of the tabs, in one place. -->
    <p class="status" role="status">
      {{
        unsaved.dirty()
          ? 'Unsaved changes: closing the page, a reload and Back ask first.'
          : 'Everything is saved: Back and closing the page leave as on any page.'
      }}
    </p>
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
    .status {
      margin: 0;
      padding: 4px 12px;
      border-top: 1px solid var(--grd-border-color);
    }
  `,
})
export class App implements AfterViewInit {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly links = inject(Links);
  private readonly toast = inject(GrdToast);
  private readonly box = inject(GrdMessageBox);
  /** The unsaved work of the application (the engine tells it the marks of its tabs). */
  protected readonly unsaved = inject(GrdUnsavedWork);

  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change, so F5 brings it back.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the keys must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('invoices', InvoiceList);
    registry.registerComponent('invoice', InvoicePage);
    // The root component lives as long as the page; a bridge in a component that goes away stops.
    inject(DestroyRef).onDestroy(() => this.links.bridge?.stop());
  }

  /** The engine is ready (it has restored its layout): now the bridge can start. */
  ngAfterViewInit(): void {
    const bridge = new GrdUrlBridge(this.engine(), {
      // How to open a tag of the address. The address is typed by anybody, so the resolver checks
      // the number: an invoice that does not exist gives null, and nothing is opened.
      resolve: {
        invoice: (id) =>
          findInvoice(id)
            ? {
                componentType: InvoicePage,
                componentKey: 'invoice',
                title: `Invoice ${id}`,
                inputs: { id },
              }
            : null,
      },
      // Each invoice that is opened or shown is a new entry of the history of the browser, so
      // Back goes to the one before. (Without it: 'replace', and the history does not grow.)
      history: 'push',
    });
    // A tag that could not be opened (a link to an invoice that does not exist): tell the user.
    bridge.on('unresolved', (event) =>
      this.toast.warning(`Not opened: ${event.tag} (${event.reason}).`),
    );
    // Open what the address names, and from now on keep the address up to date.
    bridge.start();
    this.links.bridge = bridge;
  }

  /**
   * A changed invoice is about to be closed: the close waits, and the user decides. Close closes it
   * anyway (its note is lost), Keep it open keeps it.
   */
  protected confirmClose(event: GrdEventMap['tabConfirmClose']): void {
    if (!event.dirty) return;
    event.cancel();
    void this.box
      .confirm(`${event.title} has a note that is not saved.`, {
        title: 'Close without saving?',
        confirmLabel: 'Close',
        cancelLabel: 'Keep it open',
        defaultAnswer: 'cancel',
      })
      .then((close) => {
        if (close) this.engine().api.closeTab(event.tabId, { force: true });
      });
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        // The same as a link in the application: open (or show) an invoice by its tag.
        { label: 'Open invoice 100&3', run: () => this.links.bridge?.open(invoiceTag('1003')) },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
