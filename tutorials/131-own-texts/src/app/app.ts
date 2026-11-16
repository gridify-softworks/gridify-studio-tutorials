import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  GrdStatusItem,
  t,
  tkx,
  tx,
} from '@gridify/studio';
import { Counter } from './counter';
import { Log } from './log';

/** The HTML of the welcome page: a signal, so the engine writes the page again in another language. */
const welcome = computed(() => `<h2>${tx('Welcome')}</h2><p>${tkx('app.welcome')}</p>`);

/** The welcome page and the counter as documents, the log as a tool. The titles are signals (t). */
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
      tabs: [
        { tag: 'welcome', role: 'document', title: t('Welcome'), content: welcome },
        { tag: 'counter', role: 'document', title: t('Counter'), componentKey: 'counter' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: t('Log'), componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-app-header productName="Own texts" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine
      layoutStorageKey="tutorial-131-layout"
      [defaultLayout]="layout"
      viewSources
    />
    <grd-status-bar [items]="statusItems()" />
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
  private readonly i18n = inject(GrdI18n);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by the keys that the layout names.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('log', Log);
  }

  /** The menus: tx inside a computed, so the computed makes them again in another language. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [
        {
          label: tx('Add a &counter'),
          // The tag of the counter of the layout: after F5 the title finds its signal by it.
          run: () =>
            this.engine().openComponentTab({
              tag: 'counter',
              title: t('Counter'),
              componentKey: 'counter',
            }),
        },
        {
          label: tx('Add a &welcome page'),
          run: () =>
            this.engine().openHtmlTab({ tag: 'welcome', title: t('Welcome'), content: welcome }),
        },
      ],
    },
    {
      id: 'view',
      label: tx('&View'),
      items: [{ source: 'grd:tools' }, { separator: true }, { source: 'grd:restore-layout' }],
    },
  ]);

  /** The status bar: a computed as well, with the name of the language as the value of {name}. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    {
      id: 'language',
      text: tx('Language: {name}', { name: this.i18n.languageName(this.i18n.language()) }),
    },
  ]);
}
