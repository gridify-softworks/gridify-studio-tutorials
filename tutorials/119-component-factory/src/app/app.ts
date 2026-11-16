import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';
import { CustomerCard } from './customer-card';
import { CustomerServer } from './customer-server';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <!-- a key of its own: everything that runs on one address shares one localStorage -->
    <grd-docking-engine layoutStorageKey="tutorial-119-layout" />
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
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly server = inject(CustomerServer);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    // The factory makes the content of a customer tab: it asks the server for the customer that the tab names (`params`,
    // saved with the tab), then gives the engine the component and its inputs. It runs when the tab is opened and again
    // after every reload.
    registry.registerComponentFactory('customer', async ({ params, signal }) => {
      const customer = await this.server.customer(Number(params['id']), signal);
      return { componentType: CustomerCard, inputs: { customer } };
    });
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: '&Open customer',
          children: this.server.customers.map((customer) => ({
            label: customer.name,
            run: () => this.openCustomer(customer.id, customer.name),
          })),
        },
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'server',
      label: '&Server',
      items: [
        {
          label: 'Server &online',
          checked: this.server.online(),
          run: () => this.server.setOnline(!this.server.online()),
        },
      ],
    },
  ]);

  /**
   * A tab whose content is made by the factory: only the key of the factory and the id of the customer are saved (with the title and the
   * placeholder, the text the tab shows while the factory runs).
   */
  private openCustomer(id: number, name: string): void {
    this.engine().openComponentTab({
      title: name,
      serialize: 'callback',
      callback: { key: 'customer', params: { id } },
      placeholder: `Asking the server for ${name}…`,
    });
  }
}
