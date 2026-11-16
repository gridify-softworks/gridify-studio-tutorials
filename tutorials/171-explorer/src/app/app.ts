import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { ExplorerTool } from './explorer-tool';
import { FileView } from './file-view';
import { Files } from './files';

/** The explorer on the left, the files (documents) on the right. */
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
      tabs: [{ tag: 'explorer', role: 'tool', title: 'Explorer', componentKey: 'explorer' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 72,
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
    <!--
      [layoutStorageKey]="null": the layout is not saved. The files live in the memory of the
      pretend server, so after F5 everything starts again, the tabs too.
    -->
    <grd-docking-engine [layoutStorageKey]="null" [defaultLayout]="layout" />
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
  private readonly files = inject(Files);

  protected readonly layout = LAYOUT;

  constructor() {
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('explorer', ExplorerTool);
    registry.registerComponent('file', FileView);
    // The top of the tree comes from the server.
    void this.files.loadTop();
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
