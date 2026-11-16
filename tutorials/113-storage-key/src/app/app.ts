import { Component, inject, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** The keys of this tutorial: the panel at the bottom shows what `localStorage` has under them. */
const KEYS = ['tutorial-113-left', 'tutorial-113-right'];

/** A row of the panel: a key and what is stored under it. */
interface Stored {
  readonly key: string;
  readonly text: string;
}

/** The tabs in a saved layout: the docked ones (in `coreTree`) and the floating windows. */
function countTabs(node: { tabs?: unknown[]; children?: unknown[] }): number {
  if (Array.isArray(node.tabs)) return node.tabs.length;
  return (node.children ?? []).reduce<number>((sum, child) => sum + countTabs(child as object), 0);
}

/** What `localStorage` has under a key, in words. */
function describe(key: string): string {
  // A value that is not a saved layout (changed by hand, say) must not stop the page: the engine does not use it either.
  try {
    const json = localStorage.getItem(key);
    if (json === null) return 'nothing yet';
    const saved = JSON.parse(json) as { coreTree: object; floatingWindows?: unknown[] };
    const tabs = countTabs(saved.coreTree) + (saved.floatingWindows?.length ?? 0);
    return `${tabs} ${tabs === 1 ? 'tab' : 'tabs'}, ${json.length} characters`;
  } catch {
    return 'not a saved layout';
  }
}

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <div class="engines">
      <section>
        <h2>Left <code>tutorial-113-left</code></h2>
        <grd-docking-engine #left layoutStorageKey="tutorial-113-left" (layoutSaved)="read()" />
      </section>
      <section>
        <h2>Right <code>tutorial-113-right</code></h2>
        <grd-docking-engine #right layoutStorageKey="tutorial-113-right" (layoutSaved)="read()" />
      </section>
      <section>
        <h2>Scratch <code>null</code></h2>
        <!-- null: this engine loads nothing and saves nothing -->
        <grd-docking-engine #scratch [layoutStorageKey]="null" />
      </section>
    </div>
    <ul class="stored" aria-label="What localStorage has">
      @for (row of stored(); track row.key) {
        <li>
          <code>{{ row.key }}</code> {{ row.text }}
        </li>
      }
      <li>Scratch has no key: nothing of it is stored</li>
      <li>Other keys on this address: {{ others() }}</li>
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      /* the page shows more than the engines: the colors of the theme, light and dark */
      background: var(--grd-bg-main);
      color: var(--grd-text-main);
    }
    .engines {
      flex: 1;
      min-height: 0;
      display: flex;
      gap: 6px;
      padding: 6px;
    }
    section {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    h2 {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 600;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
      border: 1px solid var(--grd-border-color);
    }
    .stored {
      margin: 0;
      padding: 6px 12px 8px;
      list-style: none;
      border-top: 1px solid var(--grd-border-color);
      font-size: 13px;
      line-height: 1.6;
    }
    code {
      font-family: var(--grd-font-mono);
    }
  `,
})
export class App {
  private readonly left = viewChild.required<GrdDockingEngine>('left');
  private readonly right = viewChild.required<GrdDockingEngine>('right');
  private readonly scratch = viewChild.required<GrdDockingEngine>('scratch');

  /** What `localStorage` has under the keys of this tutorial; `read()` reads it again. */
  protected readonly stored = signal<Stored[]>([]);
  /** How many keys of `localStorage` are not this tutorial's (everything that runs on the same address shares it). */
  protected readonly others = signal(0);

  constructor() {
    // Save the layout after every change: the engines with a key save, the one with null does not.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
    this.read();
  }

  /** Reads `localStorage` again (after every save of the left or the right engine). */
  protected read(): void {
    this.stored.set(KEYS.map((key) => ({ key, text: describe(key) })));
    try {
      this.others.set(Object.keys(localStorage).filter((key) => !KEYS.includes(key)).length);
    } catch {
      // a blocked storage cannot be read: the count stays as it is
    }
  }

  /** A menu for one engine: the same commands, each for its own engine. */
  private menuOf(id: string, label: string, engine: () => GrdDockingEngine): GrdMenu {
    return {
      id,
      label,
      items: [
        {
          label: 'Add &component',
          run: () => engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            engine().openHtmlTab({ title: 'Notes', content: '<p>Plain <b>HTML</b> in a tab.</p>' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => engine().resetLayout() },
        { label: '&Forget the saved layout', run: () => this.forget(engine()) },
      ],
    };
  }

  /** Removes the saved layout of an engine: the tabs stay on the screen, and F5 shows the default layout. */
  private forget(engine: GrdDockingEngine): void {
    engine.clearSavedLayout();
    this.read();
  }

  protected readonly menus: GrdMenu[] = [
    this.menuOf('left', '&Left', () => this.left()),
    this.menuOf('right', '&Right', () => this.right()),
    this.menuOf('scratch', '&Scratch', () => this.scratch()),
  ];
}
