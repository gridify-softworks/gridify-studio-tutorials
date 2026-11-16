import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { InboxPage } from './inbox-page';
import { NotesTool } from './notes-tool';

/** The inbox (a document) and a tool under it. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 78,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'inbox', role: 'document', title: 'Inbox', componentKey: 'inbox' }],
    },
    {
      tag: 'bottom',
      type: 'panel',
      role: 'tool',
      size: 22,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'notes', role: 'tool', title: 'Notes', componentKey: 'notes' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-043-layout" [defaultLayout]="layout" />
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
    registry.registerComponent('inbox', InboxPage);
    registry.registerComponent('notes', NotesTool);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
