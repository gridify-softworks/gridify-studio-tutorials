import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { DefaultsTool } from './defaults-tool';
import { SignupForm } from './signup-form';

/** The form (a document) on the left, the settings of the defaults (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 55,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'form', role: 'document', title: 'Sign-up form', componentKey: 'form' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 45,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'defaults', role: 'tool', title: 'Defaults', componentKey: 'defaults' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-102-layout" [defaultLayout]="layout" />
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
    registry.registerComponent('form', SignupForm);
    registry.registerComponent('defaults', DefaultsTool);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
