import { Component, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
} from '@gridify/studio';
import { Report } from './report';
import { TextFinder } from './text-finder';

/** The documents (empty at the start, so the empty area shows) and the tool that finds texts. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 65,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'finder', role: 'tool', title: 'Find a text', componentKey: 'finder' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-app-header productName="Reports" preferences="language" />
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-133-layout" [defaultLayout]="layout" />
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
  private readonly messages = inject(GrdMessageBox);
  protected readonly layout = LAYOUT;

  constructor() {
    const settings = inject(GrdEngineSettings);
    settings.setAutoSaveLayout(true);
    // A floating window gets the button that puts it back: its tooltip is one of the company's texts.
    settings.setShowDockButton(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('report', Report);
    registry.registerComponent('finder', TextFinder);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: '&New report',
          run: () =>
            this.engine().openComponentTab({
              title: `Report ${this.engine().documents().length + 1}`,
              role: 'document',
              componentKey: 'report',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => void this.reset() },
      ],
    },
  ];

  /** Asks first: the question has the title and the Cancel button of the company. */
  private async reset(): Promise<void> {
    if (await this.messages.confirm('Reset the layout? The open reports are closed.')) {
      this.engine().resetLayout();
    }
  }
}
