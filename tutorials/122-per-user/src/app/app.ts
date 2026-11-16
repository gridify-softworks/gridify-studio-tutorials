import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAuth,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  grdUserName,
} from '@gridify/studio';
import { Counter } from './counter';
import { demoServer } from './demo-server';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <p class="who">
      {{ who() }}. The layout is saved under <code>{{ layoutKey() }}</code>
    </p>
    <!-- every user has a key of their own; a new key loads the layout of that user -->
    <grd-docking-engine [layoutStorageKey]="layoutKey()" />
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
    .who {
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
  private readonly auth = inject(GrdAuth);

  /** `tutorial-122-layout` when nobody is signed in, `tutorial-122-layout:alice` for Alice. */
  protected readonly layoutKey = computed(() => this.auth.userKey('tutorial-122-layout'));

  protected readonly who = computed(() => {
    const user = this.auth.user();
    return user ? `Signed in as ${grdUserName(user)}` : 'Nobody is signed in';
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
      id: 'user',
      label: '&User',
      items: [
        ...demoServer.accountList().map(({ username, password, user }) => ({
          label: `Sign in as ${grdUserName(user)}`,
          checked: this.auth.user()?.id === user.id,
          run: () => void this.auth.signIn('password', { username, password }),
        })),
        { separator: true },
        {
          label: 'Sign &out',
          enabled: this.auth.isAuthenticated(),
          run: () => void this.auth.signOut(),
        },
      ],
    },
  ]);
}
