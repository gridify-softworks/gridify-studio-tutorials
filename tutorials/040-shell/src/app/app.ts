import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EventsTool } from './events-tool';
import { NotesTool } from './notes-tool';

/** Four bars of the shell around the dockable core. The shell comes from here every time; only the core is saved. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    // At the top: 48 px, no header, plain HTML.
    {
      type: 'panel',
      role: 'tool',
      size: '48px',
      shell: true,
      shellHeader: 'none',
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          role: 'tool',
          title: 'Banner',
          content: '<div class="banner"><b>Shell</b> · the frame of the application</div>',
        },
      ],
    },
    {
      type: 'row',
      size: 100,
      children: [
        // On the left: 300 px that the user may drag, the clock.
        {
          type: 'panel',
          role: 'tool',
          size: '300px',
          resizable: true,
          shell: true,
          shellHeader: 'text',
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Clock', componentType: ClockTool }],
        },
        // The dockable core: everything the user opens goes here.
        { type: 'panel', role: 'document', size: 100, activeTab: 0, collapsed: false, tabs: [] },
        // On the right: 200 px, fixed, plain HTML.
        {
          type: 'panel',
          role: 'tool',
          size: '200px',
          shell: true,
          shellHeader: 'text',
          activeTab: 0,
          collapsed: false,
          tabs: [
            {
              role: 'tool',
              title: 'About',
              content: '<p>The shell cannot be closed, dragged or docked into.</p>',
            },
          ],
        },
      ],
    },
    // At the bottom: 300 px, Events and Notes side by side (two panels in a row).
    {
      type: 'row',
      size: '300px',
      shell: true,
      children: [
        {
          type: 'panel',
          role: 'tool',
          size: 50,
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Events', componentType: EventsTool }],
        },
        {
          type: 'panel',
          role: 'tool',
          size: 50,
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Notes', componentType: NotesTool }],
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="shell" [defaultLayout]="layout" />
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
    const settings = inject(GrdEngineSettings);
    settings.setDockingMode('roles');
    settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('clock', ClockTool);
    registry.registerComponent('counter', Counter);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'New &tool',
          run: () =>
            this.engine().openComponentTab({ title: 'Clock', role: 'tool', componentKey: 'clock' }),
        },
        {
          label: 'New &document',
          run: () =>
            this.engine().openComponentTab({
              title: 'Counter',
              role: 'document',
              componentKey: 'counter',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
