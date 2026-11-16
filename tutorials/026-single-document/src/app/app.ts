import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { LogTool } from './log-tool';
import { OrderStore } from './order';
import { OrderDocument } from './order-document';
import { SummaryTool } from './summary-tool';

/** The document area in the middle, Summary on its right, Log under both. The document area has no tabs: the order fills it. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    {
      type: 'row',
      size: 75,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 70,
          activeTab: 0,
          collapsed: false,
          tabs: [],
        },
        {
          tag: 'right',
          type: 'panel',
          role: 'tool',
          size: 30,
          activeTab: 0,
          collapsed: false,
          tabs: [{ tag: 'summary', role: 'tool', title: 'Summary', componentKey: 'summary' }],
        },
      ],
    },
    {
      tag: 'bottom',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" shortcuts />
    <!-- the document is the empty document area: no tab, no tab strip -->
    <grd-docking-engine
      layoutStorageKey="tutorial-026-layout"
      [defaultLayout]="layout"
      [emptyDocument]="document"
      viewSources
    />
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
  private readonly order = inject(OrderStore);
  protected readonly layout = LAYOUT;
  protected readonly document = OrderDocument;

  constructor() {
    const settings = inject(GrdEngineSettings);
    // Documents go into the document area, tools around it (the default mode). The free mode would not do: there the empty area shows only
    // when no panel is docked at all.
    settings.setDockingMode('roles');
    settings.setAutoSaveLayout(true);
    // The tools are saved with the layout by their keys.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('summary', SummaryTool);
    registry.registerComponent('log', LogTool);
  }

  // No New document, no Open: the application has one document.
  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: '&Save', shortcut: 'Mod+S', run: () => this.order.save() },
        { separator: true },
        {
          label: '&Reset layout',
          run: () => {
            this.engine().resetLayout();
            this.order.write('The layout is reset');
          },
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      // One item for every tool, with a check mark while it is open: a click closes or opens it.
      items: [{ source: 'grd:tools' }],
    },
  ];
}
