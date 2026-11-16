import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { GrdTabContext } from '@gridify/studio';

/**
 * A component that listens to the keys itself. It counts them twice: in the window its tab is in now
 * (`GrdTabContext.window`), and on the global `document`, which is always the one of the main page.
 */
@Component({
  selector: 'app-key-counter',
  template: `
    <p>
      Where this tab is: <b>{{ where() }}</b>
    </p>
    <p>Click into the tab and press a few keys.</p>
    <p>
      Keys heard in the window of the tab: <b class="in-tab">{{ inTab() }}</b>
    </p>
    <p>
      Keys heard on the global <code>document</code>: <b class="on-page">{{ onPage() }}</b>
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class KeyCounter {
  private readonly tab = inject(GrdTabContext);
  protected readonly inTab = signal(0);
  protected readonly onPage = signal(0);

  /** The window the tab is in: the main window, or the id of a popout window. */
  protected readonly where = computed(() => {
    const win = this.tab.window();
    return win.kind === 'main' ? 'the main window' : `the popout window ${win.id}`;
  });

  constructor() {
    // Right: the document of the window the tab is in now, and again after every move.
    effect((onCleanup) => {
      const doc = this.tab.window().document;
      const count = () => this.inTab.update((n) => n + 1);
      doc.addEventListener('keydown', count);
      onCleanup(() => doc.removeEventListener('keydown', count));
    });
    // Wrong for a tab that can move: the global document is the one of the main page, always.
    const countOnPage = () => this.onPage.update((n) => n + 1);
    document.addEventListener('keydown', countOnPage);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', countOnPage));
  }
}
