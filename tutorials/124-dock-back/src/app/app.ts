import { Component, inject, viewChild } from '@angular/core';
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

/** A document of the default layout. Its tag names it after a reload, when the ids of the tabs are new. */
const page = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'document',
  title,
  content: `<p>${text}</p>`,
});

/** Two documents and a tool on the right. The panels have tags: a tab that docks back finds them by them. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [
        page('readme', 'Readme', 'What the project is.'),
        page('changes', 'Changes', 'What is new in this version.'),
      ],
    },
    {
      tag: 'tools',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          tag: 'outline',
          role: 'tool',
          title: 'Outline',
          content: '<p>The headings of the page.</p>',
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
    <grd-docking-engine layoutStorageKey="tutorial-124-layout" [defaultLayout]="layout" />
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
    // Save the layout after every change (by default the engine only loads a saved layout).
    settings.setAutoSaveLayout(true);
    // Every floating window gets the button that docks it back (by default only the menu of the window has Dock back).
    settings.setShowDockButton(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
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
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
