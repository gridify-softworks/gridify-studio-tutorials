import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdEventMap,
  type GrdMaximize,
  type GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { LAYOUT } from './layout';

/** The choices of View › Panels that can be maximized: the values of the setting `maximize`. */
const CHOICES: { value: GrdMaximize; label: string }[] = [
  { value: 'off', label: '&Off' },
  { value: 'documents', label: '&Documents (the default of the library)' },
  { value: 'all', label: '&All panels' },
];

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine
      layoutStorageKey="tutorial-027-layout"
      [defaultLayout]="layout"
      (panelMaximized)="maximized($event)"
      (panelRestored)="restored($event)"
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
  private readonly engine = viewChild(GrdDockingEngine);
  protected readonly settings = inject(GrdEngineSettings);
  protected readonly layout = LAYOUT;
  /** What the last event of maximizing said, for the status bar. */
  protected readonly said = signal('Double-click a tab of the documents.');

  constructor() {
    // Nothing to turn on: the library lets the panels of the documents be maximized
    // ('documents'). A tab can say otherwise for itself (see layout.ts), and the View menu
    // switches the setting (setMaximize).
    this.settings.setAutoSaveLayout(true);
  }

  /** A panel was maximized: `tabId` is its active tab. */
  protected maximized(event: GrdEventMap['panelMaximized']): void {
    const api = this.engine()?.api;
    const tab = api?.findById(event.tabId);
    this.said.set(`Maximized with ${api?.isTab(tab) ? tab.title : 'its tab'}.`);
  }

  /**
   * The maximized panel went back; `reason` says why (user, api, drag, reveal, layout, gone,
   * setting).
   */
  protected restored(event: GrdEventMap['panelRestored']): void {
    this.said.set(`Restored (${event.reason}).`);
  }

  /**
   * The menus: a `computed`, so the check marks follow the setting and the maximized panel (a
   * signal of the engine).
   */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const maximize = this.settings.maximize();
    const maximized = this.engine()?.maximizedPanel() ?? null;
    return [
      {
        id: 'view',
        label: '&View',
        items: [
          {
            label: '&Maximize the document',
            checked: maximized !== null,
            enabled: maximize !== 'off' || maximized !== null,
            run: () => this.toggleMaximized(),
          },
          { label: 'Show the &properties', run: () => this.showProperties() },
          { separator: true },
          {
            label: 'Panels that can be ma&ximized',
            children: CHOICES.map((choice) => ({
              label: choice.label,
              checked: maximize === choice.value,
              run: () => this.settings.setMaximize(choice.value),
            })),
          },
          { separator: true },
          { label: '&Reset layout', run: () => this.engine()?.resetLayout() },
        ],
      },
    ];
  });

  /** The status bar: what happened last, the setting, and whether a panel is maximized now. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    { id: 'said', text: this.said(), shrink: true, live: true },
    { id: 'setting', text: `maximize: '${this.settings.maximize()}'`, align: 'end' },
    {
      id: 'state',
      text: this.engine()?.maximizedPanel() ? 'A panel is maximized' : 'Every panel is shown',
      align: 'end',
    },
  ]);

  /**
   * View › Maximize the document: the panel of the active document fills the core, or the
   * maximized panel goes back. The API takes the id of a tab too (its panel, with that tab as the
   * active one).
   */
  private toggleMaximized(): void {
    const engine = this.engine();
    if (!engine) return;
    if (engine.maximizedPanel() !== null) {
      engine.api.restorePanel();
      return;
    }
    const document = engine.activeDocumentTab();
    if (document && !engine.api.maximizePanel(document.tabId)) {
      this.said.set(`${document.title} cannot be maximized now.`);
    }
  }

  /**
   * View › Show the properties: a tab of another panel has to be seen, so a maximized panel goes
   * back by itself (reason `reveal`).
   */
  private showProperties(): void {
    const api = this.engine()?.api;
    const properties = api?.getByTag('properties')[0];
    if (api && properties) api.activateTab(properties.id);
    // The tab can be closed like any tool, and the layout is saved: then there is nothing to show.
    else if (api) this.said.set('Properties is closed: View › Reset layout brings it back.');
  }
}
