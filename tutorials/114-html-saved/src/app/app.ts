import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-114-layout';

/** The time of the day, `10:41:07`. */
const now = (): string => new Date().toLocaleTimeString('en-GB');

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
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
  protected readonly layoutKey = LAYOUT_KEY;
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
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
        { label: 'Add &HTML', run: () => this.addHtml() },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [{ label: '&Change the active HTML tab', run: () => this.changeActive() }],
    },
  ];

  /**
   * An HTML tab. `serialize` is not given, so it is `'html'` (the default): the HTML itself is saved with the layout. The time in it is
   * written once, now; after a reload it is still this time, because the saved HTML comes back, not the code that made it.
   */
  private addHtml(): void {
    this.engine().openHtmlTab({
      title: 'Notes',
      content: `<p>Plain <b>HTML</b> in a tab, made at ${now()}.</p>`,
    });
  }

  /**
   * Adds a line to the HTML of the active tab. `setTabHtml` shows the new HTML at once and asks for a save, so the changed HTML is what
   * comes back after a reload. A component tab has no HTML: nothing happens for it.
   */
  private changeActive(): void {
    const engine = this.engine();
    const active = engine.activeTab();
    const tab = active ? engine.api.findById(active.tabId) : null;
    if (!engine.api.isTab(tab) || typeof tab.content !== 'string') return;
    engine.api.setTabHtml(tab.id, `${tab.content}<p>Changed at ${now()}.</p>`);
  }

  /** What the engine wrote into localStorage under the key, in a dialog: the saved layout as JSON. */
  private showSaved(): void {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const text = saved ? JSON.stringify(JSON.parse(saved), null, 2) : 'Nothing is saved yet.';
    this.dialogs.open({
      title: `localStorage["${LAYOUT_KEY}"]`,
      html: `<pre class="saved">${escapeHtml(text)}</pre>`,
      width: 720,
      height: 520,
      resizable: true,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
