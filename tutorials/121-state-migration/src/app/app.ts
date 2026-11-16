import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  type GrdPersistedState,
} from '@gridify/studio';
import { Counter } from './counter';
import { Note } from './note';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-121-layout';

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
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly settings = inject(GrdEngineSettings);
  private readonly dialogs = inject(GrdDialog);
  protected readonly layoutKey = LAYOUT_KEY;

  constructor() {
    this.settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('note', Note);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &note',
          run: () => this.engine().openComponentTab({ title: 'Note', componentKey: 'note' }),
        },
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { separator: true },
        { label: 'Write an &old (version 1) save', run: () => this.writeOldSave() },
        { label: 'Write a &newer (version 3) save', run: () => this.writeNewerSave() },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];

  /** Only for the tutorial: the notes as the first release saved them, in version 1 (only the text). */
  private writeOldSave(): void {
    this.rewriteNotes((data) => ({ v: 1, data: { text: data.text } }));
    this.tell(
      'An old save is written',
      'The notes are saved in version 1 now, as the first release saved them. Press F5: they come back migrated to version 2. Until then nothing is saved.',
    );
  }

  /** Only for the tutorial: the notes as a newer release would save them, in version 3 (one field more), which this code does not know. */
  private writeNewerSave(): void {
    this.rewriteNotes((data) => ({ v: 3, data: { ...data, pinned: true } }));
    this.tell(
      'A newer save is written',
      'The notes are saved in version 3 now, as a newer release would save them. Press F5: this code cannot read them, so the notes start empty, and their saved state stays as it is until a note is changed.',
    );
  }

  /**
   * Only for the tutorial: makes the saved layout look as if another release had saved it, with every note in the state that
   * `stateOf` makes of its text and color. An application never writes the saved layout itself.
   */
  private rewriteNotes(
    stateOf: (data: { text: string; color: string }) => GrdPersistedState,
  ): void {
    // Save now, so that the last change is in, then stop saving: the engine would write the notes in version 2 again
    // (after the next change, and when the page is closed). After F5 the constructor turns the saving on again.
    this.engine().saveLayout();
    this.settings.setAutoSaveLayout(false);

    const saved = localStorage.getItem(LAYOUT_KEY);
    if (!saved) return;
    // Every tab of a note, wherever it is in the layout (a panel, a floating window), gets the new state.
    const rewritten = JSON.parse(saved, (_key, value) =>
      value?.componentKey === 'note' && value.persistedState
        ? { ...value, persistedState: stateOf(value.persistedState.data) }
        : value,
    );
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(rewritten));
  }

  /** A dialog with a title, a text and OK. */
  private tell(title: string, text: string): void {
    this.dialogs.open({
      title,
      text,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
