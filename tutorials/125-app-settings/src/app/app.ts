import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdMenu,
  GrdMenuBar,
  GrdTheme,
  GrdUiSettings,
} from '@gridify/studio';
import { DENSITY_KEY } from './app.config';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- the selects of the header switch the theme, the density and the language by themselves -->
    <grd-app-header productName="App settings" preferences="theme density language" />
    <grd-menu-bar [menus]="menus()" />
    <p class="now">{{ now() }}</p>
    <grd-docking-engine layoutStorageKey="tutorial-125-layout" />
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
    .now {
      margin: 0;
      padding: 4px 12px;
      border-bottom: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
      color: var(--grd-text-main);
      font-size: var(--grd-font-size-base);
    }
  `,
})
export class App {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly theme = inject(GrdTheme);
  private readonly ui = inject(GrdUiSettings);
  private readonly i18n = inject(GrdI18n);

  /** What is in use now: the services are signals, so the line follows every switch. */
  protected readonly now = computed(() => {
    const system = this.theme.followsSystem() ? ' (follows the system)' : '';
    const kept = this.ui.storageKey() === null ? ' (not remembered)' : '';
    return `Theme ${this.theme.theme()}${system}, density ${this.ui.density()}${kept}, language ${this.i18n.language()}`;
  });

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'settings',
      label: '&Settings',
      items: [
        {
          // Forgets the chosen theme: the light or the dark theme follows the system again.
          label: '&Follow the system theme',
          enabled: !this.theme.followsSystem(),
          run: () => this.theme.followSystem(),
        },
        { separator: true },
        {
          // Off: no key (null), so a density chosen now lasts until F5. On: the key again, and what it keeps.
          label: '&Remember the density',
          checked: this.ui.storageKey() !== null,
          run: () => this.ui.setStorageKey(this.ui.storageKey() === null ? DENSITY_KEY : null),
        },
      ],
    },
  ]);
}
