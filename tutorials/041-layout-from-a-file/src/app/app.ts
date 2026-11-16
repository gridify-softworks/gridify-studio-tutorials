import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  grdLoadLayout,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { loadLayout } from './layout-loader';
import { LayoutLog } from './layout-log';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [defaultLayout]="layout" [layoutStorageKey]="null" />
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
  /** The layout of `layout.json`. The engine reads `[defaultLayout]` once, when it starts. */
  protected readonly layout = loadLayout();
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly registry = inject(GrdContentRegistry);
  private readonly settings = inject(GrdEngineSettings);
  private readonly log = inject(LayoutLog);

  constructor() {
    this.log.write('The default layout is layout.json, built into the application.');
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
    {
      id: 'layout',
      label: '&Layout',
      items: [
        { label: 'The layout of the &build (layout.json)', run: () => this.useBuilt() },
        {
          label: 'The layout from the &server (layouts/compact.json)',
          run: () => void this.useServer('layouts/compact.json'),
        },
        {
          label: 'A file of &another application (layouts/foreign.json)',
          run: () => void this.useServer('layouts/foreign.json'),
        },
        {
          label: 'A file that is &not there (layouts/missing.json)',
          run: () => void this.useServer('layouts/missing.json'),
        },
      ],
    },
  ];

  /** The layout of the build is the default layout again; the engine shows it at once. */
  private useBuilt(): void {
    this.engine().setDefaultLayout(this.layout);
    this.log.write('The default layout is layout.json again.');
  }

  /**
   * A file of the editor that the application fetches while it runs: from `public/`, so it can be replaced without a new build. `grdLoadLayout` reads it as `loadLayout()` reads
   * `layout.json`, given the registry only: its tabs can name only the components that the application has registered (here `loadLayout()` registered them), and a file with problems
   * is not shown. The docking mode it is made for is a setting of the whole page.
   */
  private async useServer(url: string): Promise<void> {
    let json: unknown;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      json = await response.json();
    } catch (error) {
      this.log.write(`${url} could not be loaded (${String(error)}); the layout stays.`);
      console.error(`Layout ${url}:`, error);
      return;
    }
    const loaded = grdLoadLayout(json, {
      registry: this.registry,
      onProblem: (problem) => this.log.write(`${url}: ${problem.message}`),
    });
    if (loaded.problems.length > 0) {
      this.log.write(`${url} is not shown; the layout stays.`);
      return;
    }
    this.settings.setDockingMode(loaded.dockingMode);
    this.engine().setDefaultLayout(loaded.layout);
    this.log.write(`The default layout is ${url}, fetched from the server.`);
  }
}
