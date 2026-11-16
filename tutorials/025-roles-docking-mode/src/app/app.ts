import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  GrdMenuItem,
} from '@gridify/studio';
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EmptyArea } from './empty-area';

/** What the empty document panel shows: nothing, the caption of the engine, or a component of your own. */
type EmptyContent = 'nothing' | 'default' | 'own';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="roles-docking-mode" [emptyDocument]="emptyDocument()" />
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
  protected readonly emptyContent = signal<EmptyContent>('default');
  protected readonly emptyDocument = computed(() => {
    switch (this.emptyContent()) {
      case 'nothing':
        return null; // an empty panel
      case 'default':
        return undefined; // the caption of the engine
      case 'own':
        return EmptyArea; // a component of your own
    }
  });

  constructor() {
    const settings = inject(GrdEngineSettings);
    // Documents go into document panels, tools into tool panels (the default mode).
    settings.setDockingMode('roles');
    settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('clock', ClockTool);
    registry.registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
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
    {
      id: 'empty',
      label: '&Empty content',
      items: [
        this.choice('&Nothing', 'nothing'),
        this.choice('&Default', 'default'),
        this.choice('&Own component', 'own'),
      ],
    },
  ]);

  /** An item of the menu Empty content: checked while it is the choice. */
  private choice(label: string, content: EmptyContent): GrdMenuItem {
    return {
      label,
      checked: this.emptyContent() === content,
      run: () => this.emptyContent.set(content),
    };
  }
}
