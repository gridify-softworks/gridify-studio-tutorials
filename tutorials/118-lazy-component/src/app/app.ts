import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** Stands in for a slow network: on localhost the chunk arrives in a few milliseconds, and the loader of the tab would not be seen. */
const slowNetwork = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- a key of its own: everything that runs on one address shares one localStorage -->
    <grd-docking-engine layoutStorageKey="tutorial-118-layout" />
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

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    // A class: the counter is in the main bundle and is there at once, as in 015.
    registry.registerComponent('counter', Counter);
    // A function that loads the class: the report is a chunk of its own, loaded the first time a tab needs it.
    registry.registerComponent('report', async () => {
      await slowNetwork(1000);
      const { Report } = await import('./report');
      return Report;
    });
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &report (lazy)',
          run: () => this.engine().openComponentTab({ title: 'Report', componentKey: 'report' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
