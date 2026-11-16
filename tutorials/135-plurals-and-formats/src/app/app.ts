import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  t,
  tx,
} from '@gridify/studio';
import { Formats } from './formats';
import { Plurals } from './plurals';

/** The plural forms on the left, the formats on the right. The titles are signals of `t()`, found again by their tags after F5. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 55,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'plurals', role: 'document', title: t('Plurals'), componentKey: 'plurals' }],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 45,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'formats', role: 'tool', title: t('Formats'), componentKey: 'formats' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-app-header productName="Plurals and formats" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-135-layout" [defaultLayout]="layout" />
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
    registry.registerComponent('plurals', Plurals);
    registry.registerComponent('formats', Formats);
  }

  /** A menu label is a plain text, so the menus are a `computed` that `tx()` makes again in the new language. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [{ label: tx('&Reset layout'), run: () => this.engine().resetLayout() }],
    },
  ]);
}
