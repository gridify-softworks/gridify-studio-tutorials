import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { CatalogTool } from './catalog-tool';
import { OrderTool } from './order-tool';
import { ProductPage } from './product-page';

/** The catalog on the left, the products (documents) in the middle, the order on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 28,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'catalog', role: 'tool', title: 'Catalog', componentKey: 'catalog' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 47,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'order', role: 'tool', title: 'Order', componentKey: 'order' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-170-layout" [defaultLayout]="layout" />
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

  protected readonly layout = LAYOUT;

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by their keys (the layout names them so, also after F5).
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('catalog', CatalogTool);
    registry.registerComponent('order', OrderTool);
    registry.registerComponent('product', ProductPage);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
