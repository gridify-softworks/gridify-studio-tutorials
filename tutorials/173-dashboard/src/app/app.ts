import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { DashboardPage } from './dashboard-page';
import { FeedTool } from './feed-tool';

/** The dashboard (a document) in the middle, the live feed (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 72,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'dashboard', role: 'document', title: 'Dashboard', componentKey: 'dashboard' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 28,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'feed', role: 'tool', title: 'Live feed', componentKey: 'feed' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-173-layout" [defaultLayout]="layout" />
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
    registry.registerComponent('dashboard', DashboardPage);
    registry.registerComponent('feed', FeedTool);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
