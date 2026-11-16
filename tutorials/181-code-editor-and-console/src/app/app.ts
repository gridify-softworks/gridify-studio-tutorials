import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { ConsoleTool } from './console-tool';
import { ExampleTool } from './example-tool';
import { SettingsPage } from './settings-page';

/** As in an IDE: the file in the middle, the example on its right, the console under both. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    {
      type: 'row',
      size: 70,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 65,
          activeTab: 0,
          collapsed: false,
          tabs: [
            { tag: 'settings', role: 'document', title: 'settings.yaml', componentKey: 'settings' },
          ],
        },
        {
          tag: 'right',
          type: 'panel',
          role: 'tool',
          size: 35,
          activeTab: 0,
          collapsed: false,
          tabs: [{ tag: 'example', role: 'tool', title: 'Example', componentKey: 'example' }],
        },
      ],
    },
    {
      tag: 'bottom',
      type: 'panel',
      role: 'tool',
      size: 30,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'console', role: 'tool', title: 'Console', componentKey: 'console' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-181-layout" [defaultLayout]="layout" />
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
    registry.registerComponent('settings', SettingsPage);
    registry.registerComponent('example', ExampleTool);
    registry.registerComponent('console', ConsoleTool);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
