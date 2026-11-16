import { AfterViewInit, Component, computed, DestroyRef, inject, viewChild } from '@angular/core';
import {
  GrdBackButton,
  type GrdCanLeave,
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
  GrdToast,
  GrdUrlBridge,
} from '@gridify/studio';
import { ASK, STAY, TELL } from './back-button';
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
    <grd-menu-bar [menus]="menus()" />
    <!-- The engine keeps WHERE the tabs are (localStorage); the address says WHICH invoices are open. -->
    <grd-docking-engine layoutStorageKey="tutorial-044-layout" [defaultLayout]="layout" />
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
export class App implements AfterViewInit {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly links = inject(Links);
  private readonly toast = inject(GrdToast);
  /** The Back button of the browser in the application (set in app.config.ts). */
  private readonly back = inject(GrdBackButton);

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

  /** The choices of the menu Back button: what Back does when it would leave the application. */
  private readonly choices: { label: string; canLeave: GrdCanLeave | null }[] = [
    { label: '&Ask before leaving', canLeave: ASK },
    { label: '&Stay, and say why', canLeave: TELL },
    { label: 'Stay &quietly', canLeave: STAY },
    { label: '&Leave, as on any page', canLeave: null },
  ];

  /** A computed: the check mark of the menu Back button follows the function in force. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        // The same as a link in the application: open (or show) an invoice by its tag.
        { label: 'Open invoice 100&3', run: () => this.links.bridge?.open(invoiceTag('1003')) },
        {
          label: 'Open invoice &9999 (there is none)',
          run: () => this.links.bridge?.open(invoiceTag('9999')),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'back',
      label: '&Back button',
      // The menu changes what Back does while the application runs: setCanLeave() with another
      // function, or null for Back as on any page. canLeave() is the function in force.
      items: this.choices.map((choice) => ({
        label: choice.label,
        checked: this.back.canLeave() === choice.canLeave,
        run: () => this.back.setCanLeave(choice.canLeave),
      })),
    },
  ]);
}
