import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GRD_I18N,
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdLanguageBusy,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdPreferenceFailure,
  GrdPreferenceSelect,
  GrdStatusBar,
  GrdStatusItem,
  GrdToast,
  grdCheckDictionaries,
  tk,
} from '@gridify/studio';
import { Counter } from './counter';
import { fetched, network, Network, setNetwork } from './network';

/** Two documents whose titles and HTML are signals of keys: they follow the language. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 100,
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
  ],
};

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdPreferenceSelect,
    GrdMenuBar,
    GrdDockingEngine,
    GrdStatusBar,
    GrdLanguageBusy,
  ],
  template: `
    <!-- the selects of the theme and the language, put in by hand to hear a switch that failed -->
    <grd-app-header productName="Lazy dictionaries" preferences="false">
      <grd-preference-select
        grdAppHeaderEnd
        kinds="theme language"
        (switchFailed)="failed($event)"
      />
    </grd-app-header>
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-134-layout" [defaultLayout]="layout" />
    <grd-status-bar [items]="status()" />
    <!-- covers the page while a dictionary loads (after 150 ms, so a fast load shows nothing) -->
    <grd-language-busy />
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
  private readonly toast = inject(GrdToast);
  private readonly messages = inject(GrdMessageBox);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => {
    const text = (key: string) => this.i18n.keyed(key);
    const choice = (label: string, value: Network) => ({
      label: text(label),
      checked: network() === value,
      run: () => setNetwork(value),
    });
    return [
      {
        id: 'file',
        label: text('app.menu.file'),
        items: [
          { label: text('app.menu.addCounter'), run: () => this.addCounter() },
          { separator: true },
          { label: text('app.menu.reset'), run: () => this.engine().resetLayout() },
        ],
      },
      {
        id: 'network',
        label: text('app.menu.network'),
        items: [
          choice('app.menu.fast', 'fast'),
          choice('app.menu.slow', 'slow'),
          choice('app.menu.offline', 'offline'),
        ],
      },
      {
        id: 'check',
        label: text('app.menu.check'),
        items: [{ label: text('app.menu.checkAll'), run: () => this.checkAll() }],
      },
    ];
  });

  /** The language, the one that is loading (`loadingLanguage`), what has come, and the network. */
  protected readonly status = computed<GrdStatusItem[]>(() => {
    const name = (code: string) => this.i18n.languageName(code);
    const loading = this.i18n.loadingLanguage();
    const came = fetched();
    return [
      {
        id: 'language',
        text: this.i18n.keyed('app.status.language', { name: name(this.i18n.language()) }),
      },
      {
        id: 'loading',
        text: this.i18n.keyed('app.status.loading', { name: loading ? name(loading) : '' }),
        busy: true,
        visible: loading !== null,
      },
      {
        id: 'fetched',
        align: 'end',
        text: came.length
          ? this.i18n.keyed('app.status.fetched', { languages: came.join(', ') })
          : this.i18n.keyed('app.status.nothingFetched'),
      },
      {
        id: 'network',
        align: 'end',
        text: this.i18n.keyed('app.status.network', {
          network: this.i18n.keyed(`app.network.${network()}`),
        }),
      },
    ];
  });

  /** A switch of the select failed (the dictionary did not come): the select is back on the old language. */
  protected failed(failure: GrdPreferenceFailure): void {
    const name = this.i18n.languageName(failure.value);
    this.toast.warning(this.i18n.keyed('app.failed', { name }), { detail: String(failure.error) });
  }

  private addCounter(): void {
    this.engine().openComponentTab({
      tag: 'counter',
      title: tk('app.tab.counter'),
      componentKey: 'counter',
    });
  }

  /** The check needs every dictionary: `loadAll()` fetches the ones that have not come yet. */
  private async checkAll(): Promise<void> {
    const title = this.i18n.keyed('app.check.title');
    try {
      await this.i18n.loadAll();
    } catch {
      this.messages.warning(this.i18n.keyed('app.check.failed'), { title });
      return;
    }
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    const count = (language: string) =>
      issues.filter((issue) => issue.language === language).length;
    const result = { fr: count('fr'), de: count('de'), ja: count('ja') };
    this.messages.info(this.i18n.keyed('app.check.result', result), { title });
  }
}
