import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EmptyArea } from './empty-area';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="free-docking-mode" [emptyDocument]="emptyArea" />
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
  // What the engine shows while no panel is docked.
  protected readonly emptyArea = EmptyArea;

  constructor() {
    const settings = inject(GrdEngineSettings);
    // All panels are equal: any tab can be docked into any panel.
    settings.setDockingMode('free');
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
          label: 'Add &tool',
          run: () =>
            this.engine().openComponentTab({ title: 'Clock', role: 'tool', componentKey: 'clock' }),
        },
        {
          label: 'Add &document',
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
