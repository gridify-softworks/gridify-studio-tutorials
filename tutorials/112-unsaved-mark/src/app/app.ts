import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockingEngine,
  type GrdEventMap,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  host: { '(window:beforeunload)': 'leaving($event)' },
  template: `
    <grd-menu-bar [menus]="menus" shortcuts>
      <grd-button
        grdMenuBarEnd
        label="Save layout"
        variant="primary"
        [disabled]="!unsaved()"
        (pressed)="save()"
      />
    </grd-menu-bar>
    <!-- The mark: every change of what is saved sets it, a save clears it. -->
    <grd-docking-engine
      layoutStorageKey="tutorial-112-layout"
      (layoutChanged)="changed($event)"
      (layoutSaved)="unsaved.set(false)"
    />
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
  /** The layout has changed since it was saved last: F5 would not show it as it is. */
  protected readonly unsaved = signal(false);

  protected readonly status = computed<GrdStatusItem[]>(() => [
    this.unsaved()
      ? { id: 'layout', text: '● Unsaved changes', variant: 'warning', live: true }
      : { id: 'layout', text: 'All changes are saved', live: true },
  ]);

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** A change of what the layout saves sets the mark. A change of the shell (`persisted: false`) is never saved, so it does not. */
  protected changed(event: GrdEventMap['layoutChanged']): void {
    if (event.persisted) this.unsaved.set(true);
  }

  protected save(): void {
    this.engine().saveLayout();
  }

  /** Reset throws away the changes that are not saved: it asks first, but only when there are some. */
  protected async reset(): Promise<void> {
    if (this.unsaved()) {
      const sure = await this.messages.confirm(
        'The layout has changes that are not saved. Reset it anyway and lose them?',
        { title: 'Reset the layout', danger: true, confirmLabel: 'Reset', cancelLabel: 'Keep' },
      );
      if (!sure) return;
    }
    this.engine().resetLayout();
  }

  /** The page is about to go (F5, the tab is closed, another address): with unsaved changes the browser asks first. */
  protected leaving(event: BeforeUnloadEvent): void {
    if (this.unsaved()) event.preventDefault();
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
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
        { label: '&Reset layout', run: () => this.reset() },
      ],
    },
  ];
}
