import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-menu-bar [menus]="menus" shortcuts>
      <grd-button grdMenuBarEnd label="Save layout" variant="primary" (pressed)="save()" />
    </grd-menu-bar>
    <!-- Automatic saving is off (the default): the layout is written only when save() asks for it. -->
    <grd-docking-engine layoutStorageKey="tutorial-110-layout" (layoutSaved)="saved()" />
    <grd-status-bar [items]="status()" />
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
  /** The time of the last save in this session; `null` before the first one. */
  private readonly savedAt = signal<string | null>(null);

  protected readonly status = computed<GrdStatusItem[]>(() => {
    const at = this.savedAt();
    const text = at
      ? `Layout saved at ${at}`
      : 'Not saved yet: F5 shows the layout that was saved last';
    return [{ id: 'saved', text, shrink: true, live: true }];
  });

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** Writes the layout as it is now; the engine answers with `layoutSaved`. */
  protected save(): void {
    this.engine().saveLayout();
  }

  /** `layoutSaved`: the layout is in localStorage now. */
  protected saved(): void {
    this.savedAt.set(new Date().toLocaleTimeString());
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
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
