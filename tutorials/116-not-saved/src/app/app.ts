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
const LAYOUT_KEY = 'tutorial-116-layout';

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

  /** Five tabs, each saved in another way (or not at all): the title says which. */
  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add HTML, &saved',
          run: () =>
            this.engine().openHtmlTab({
              title: 'HTML (saved)',
              content: `<p>An HTML tab without <code>serialize</code>, so <code>'html'</code>: its HTML is saved. It is back after F5.</p>`,
            }),
        },
        {
          label: 'Add HTML, &not saved',
          run: () =>
            this.engine().openHtmlTab({
              title: 'HTML (not saved)',
              serialize: 'none',
              content: `<p>An HTML tab with <code>serialize: 'none'</code>: it is not saved. It is gone after F5.</p>`,
            }),
        },
        { separator: true },
        {
          label: 'Add component, s&aved',
          run: () =>
            this.engine().openComponentTab({ title: 'Counter (saved)', componentKey: 'counter' }),
        },
        {
          label: 'Add component, n&ot saved',
          run: () =>
            this.engine().openComponentTab({
              title: 'Counter (not saved)',
              componentType: Counter,
              serialize: 'none',
            }),
        },
        {
          label: 'Add component without a &key',
          run: () =>
            this.engine().openComponentTab({ title: 'Counter (no key)', componentType: Counter }),
        },
        { separator: true },
        { label: 'Show what is sa&ved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];

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
