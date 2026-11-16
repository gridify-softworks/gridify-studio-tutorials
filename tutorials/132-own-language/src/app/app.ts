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
  GrdMessageBox,
  GrdStatusBar,
  GrdStatusItem,
  tk,
} from '@gridify/studio';
import { Counter } from './counter';
import { FrenchCheck } from './french-check';

/**
 * The default layout. The titles and the HTML are signals of keys (`tk`), so the engine rewrites
 * them in place when the language changes; their tags link the tabs of a saved layout to the
 * signals again after a reload.
 */
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
        {
          tag: 'notes',
          role: 'document',
          title: tk('app.tab.notes'),
          content: tk('app.notes.html'),
        },
        { tag: 'counter', role: 'document', title: tk('app.tab.counter'), componentKey: 'counter' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [
        { tag: 'check', role: 'tool', title: tk('app.tab.check'), componentKey: 'french-check' },
      ],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <!-- the language select lists every language that has a dictionary: French too -->
    <grd-app-header productName="Own language" preferences="theme language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-132-layout" [defaultLayout]="layout" />
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
  private readonly messages = inject(GrdMessageBox);
  private readonly i18n = inject(GrdI18n);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the keys must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('french-check', FrenchCheck);
  }

  /** The menus read their texts in a `computed`, so they follow the language. */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const text = (key: string) => this.i18n.keyed(key);
    return [
      {
        id: 'file',
        label: text('app.menu.file'),
        items: [
          { label: text('app.menu.addCounter'), run: () => this.addCounter() },
          { label: text('app.menu.addNotes'), run: () => this.addNotes() },
          { separator: true },
          { label: text('app.menu.reset'), run: () => this.reset() },
        ],
      },
      {
        id: 'check',
        label: text('app.menu.check'),
        items: [{ label: text('app.menu.checkFrench'), run: () => this.showCheck() }],
      },
      {
        id: 'help',
        label: text('app.menu.help'),
        // No French for this one (`app-fr.ts` leaves it out): it stays in English.
        items: [{ label: text('app.menu.about'), run: () => this.about() }],
      },
    ];
  });

  /** The status bar: the language in use and a line that Canadian French says in its own way. */
  protected readonly status = computed<GrdStatusItem[]>(() => {
    const code = this.i18n.language();
    const name = this.i18n.languageName(code);
    return [
      { id: 'language', text: this.i18n.keyed('app.status.language', { name, code }) },
      { id: 'contact', text: this.i18n.keyed('app.status.contact'), align: 'end' },
    ];
  });

  /** A new tab with a signal title; its tag links it to that signal again after a reload. */
  private addCounter(): void {
    this.engine().openComponentTab({
      tag: 'counter',
      title: tk('app.tab.counter'),
      componentKey: 'counter',
    });
  }

  private addNotes(): void {
    this.engine().openHtmlTab({
      tag: 'notes',
      title: tk('app.tab.notes'),
      content: tk('app.notes.html'),
    });
  }

  /** The texts of the question are the application's, the buttons (OK, Cancel) the library's. */
  private async reset(): Promise<void> {
    const sure = await this.messages.confirm(this.i18n.keyed('app.reset.message'), {
      title: this.i18n.keyed('app.reset.title'),
    });
    if (sure) this.engine().resetLayout();
  }

  /** Shows the check (a tool of the layout); it was closed, it is opened again. */
  private showCheck(): void {
    const api = this.engine().api;
    const open = api.getByTag('check').find((node) => api.isTab(node));
    if (open) api.activateTab(open.id);
    else {
      this.engine().openComponentTab({
        tag: 'check',
        role: 'tool',
        title: tk('app.tab.check'),
        componentKey: 'french-check',
      });
    }
  }

  private about(): void {
    this.messages.info(this.i18n.keyed('app.about.message'), {
      title: this.i18n.keyed('app.about.title'),
    });
  }
}
