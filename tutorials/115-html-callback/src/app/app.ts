import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Backend } from './backend';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-115-layout';

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
    <section class="log" aria-label="Backend log">
      @for (line of backend.log(); track $index) {
        <div [class]="line.kind">{{ line.time }} {{ line.text }}</div>
      } @empty {
        <div>The log of the backend: every request for a report is written here.</div>
      }
    </section>
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
    .log {
      height: 6.5em;
      overflow: auto;
      padding: 4px 12px;
      border-top: 1px solid var(--grd-border-color);
      background: var(--grd-bg-main);
      color: var(--grd-text-main);
      font-family: var(--grd-font-mono);
      font-size: 12px;
      line-height: 1.5;
    }
    .ok {
      color: var(--grd-success-text);
    }
    .warning {
      color: var(--grd-warning-text);
    }
    .error {
      color: var(--grd-danger-text);
    }
  `,
})
export class App {
  protected readonly layoutKey = LAYOUT_KEY;
  protected readonly backend = inject(Backend);
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The callback is known by its key before the saved layout comes back: a saved tab names it by the key, with its parameters.
    inject(GrdContentRegistry).registerHtml('report', ({ params, signal }) =>
      this.backend.report(Number(params['id']), signal),
    );
  }

  /** The menus: a `computed`, so the check mark of Backend › The backend is down follows the switch. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Open report &1', run: () => this.openReport(1) },
        {
          label: 'Open report &2 (with a placeholder)',
          run: () => this.openReport(2, 'Loading report 2 from the backend…'),
        },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'backend',
      label: '&Backend',
      items: [
        {
          label: 'The backend is &down',
          checked: this.backend.down(),
          run: () => this.backend.setDown(!this.backend.down()),
        },
      ],
    },
  ]);

  /**
   * A report tab. It has no HTML of its own: `serialize: 'callback'` names the callback `report` of the registry, with the parameters it needs. Only the key
   * and the parameters are saved; after a reload the callback runs again and the HTML comes from the backend again.
   */
  private openReport(id: number, placeholder?: string): void {
    this.engine().openHtmlTab({
      title: `Report ${id}`,
      serialize: 'callback',
      callback: { key: 'report', params: { id } },
      placeholder,
    });
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
