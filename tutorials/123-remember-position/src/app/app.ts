import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdDockTabInput,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** A tool: a tab with a tag. The View menu finds it by the tag, and the engine remembers its place by it. */
const tool = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'tool',
  title,
  content: `<p>${text}</p>`,
});

/** Explorer on the left, the documents in the middle with Output under them, Properties on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('explorer', 'Explorer', 'The files of the project.')],
    },
    {
      type: 'column',
      size: 60,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 70,
          activeTab: 0,
          collapsed: false,
          tabs: [],
        },
        {
          tag: 'bottom',
          type: 'panel',
          role: 'tool',
          size: 30,
          activeTab: 0,
          collapsed: false,
          tabs: [tool('output', 'Output', 'What the last build said.')],
        },
      ],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('properties', 'Properties', 'The properties of what is selected.')],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <!-- viewSources: the engine fills the block grd:tools of the View menu with its tools -->
    <grd-docking-engine
      layoutStorageKey="tutorial-123-layout"
      [defaultLayout]="layout"
      viewSources
    />
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
  private readonly settings = inject(GrdEngineSettings);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    this.settings.setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
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
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        // One item for every tool, with a check mark while it is open: a click closes or opens it.
        { source: 'grd:tools' },
        { separator: true },
        {
          label: 'Remember the &position',
          checked: this.settings.rememberPosition(),
          run: () => this.settings.setRememberPosition(!this.settings.rememberPosition()),
        },
      ],
    },
  ]);
}
