import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { BoardPage } from './board-page';
import { DetailsTool } from './details-tool';

/** The board (a document) on the left, the details (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'board', role: 'document', title: 'Sprint 12', componentKey: 'board' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'details', role: 'tool', title: 'Details', componentKey: 'details' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-172-layout" [defaultLayout]="layout" />
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
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('board', BoardPage);
    registry.registerComponent('details', DetailsTool);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
