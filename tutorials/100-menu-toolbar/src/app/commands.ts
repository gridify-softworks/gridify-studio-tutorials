import { computed, inject, Injectable, signal } from '@angular/core';
import { GrdCommand, GrdComponentTabConfig, GrdDockingEngine } from '@gridify/studio';
import { NoteDocument } from './note-document';
import { Notes } from './notes';

/** A note as a tab of the engine: the configuration of a component tab is a tab of the default layout too, and it opens with `openComponentTab`. */
export const noteTab = (title: string, text: string): GrdComponentTabConfig<NoteDocument> => ({
  role: 'document',
  icon: 'app:note',
  title,
  componentType: NoteDocument,
  inputs: { start: text },
});

/** The samples of File › Open sample. */
export const SAMPLES: Record<string, string> = {
  'Shopping list': 'Milk\nBread\nApples\nCoffee',
  'Meeting notes':
    'Monday, 10:00\n\n- the plan for the next release\n- who tests what\n- the next meeting',
  'A short poem': 'The menu above,\nthe toolbar below it,\nthe status at the end.',
};

/**
 * The commands of the notes, and what they need: the engine (the application gives it with `attach`), the active document and its note, and the message
 * and the progress of the status bar. A service of the root, so the application and a component in a tab of the engine (the popup menu) use the same ones.
 * A command (`GrdCommand` of the library) is written once: the menu bar, the toolbar and the popup menu are made from it (`grdMenuItemOf`, `grdToolbarItemOf`),
 * so they have the same text, icon, shortcut and state, and run the same code.
 */
@Injectable({ providedIn: 'root' })
export class NoteCommands {
  private readonly notes = inject(Notes);
  private readonly engine = signal<GrdDockingEngine | undefined>(undefined);
  private untitled = 0;

  /** The message on the left of the status bar. */
  readonly message = signal('Ready.');
  /** How far the saving is (0 to 1), `null` while nothing is saved. */
  readonly saving = signal<number | null>(null);

  /** The active document: the tab of the document that had the focus last (the engine keeps it). */
  readonly document = computed(() => this.engine()?.activeDocumentTab() ?? null);
  /** Its note, when it is one (About is a page). */
  readonly note = computed(() => this.notes.get(this.document()?.tabId));
  /** How many documents are open: the engine keeps the list of its documents (`documents`, a signal). */
  readonly documentCount = computed(() => this.engine()?.documents().length ?? 0);

  readonly newDocument: GrdCommand = {
    id: 'new',
    label: '&New document',
    icon: 'app:new',
    shortcut: 'Alt+N',
    run: () => this.open(`Untitled ${++this.untitled}`, ''),
  };
  readonly save: GrdCommand = {
    id: 'save',
    label: '&Save',
    icon: 'app:save',
    shortcut: 'Mod+S',
    enabled: () => !!this.note()?.dirty() && this.saving() === null,
    run: () => this.saveNote(),
  };
  readonly close: GrdCommand = {
    id: 'close',
    label: 'C&lose document',
    icon: 'app:close-doc',
    enabled: () => this.document() !== null,
    run: () => {
      const doc = this.document();
      if (doc) this.engine()?.api.closeTab(doc.tabId);
    },
  };
  readonly insertDate: GrdCommand = {
    id: 'date',
    label: 'Insert &date and time',
    icon: 'app:date',
    enabled: () => !!this.note(),
    run: () => this.note()?.insert(new Date().toLocaleString()),
  };
  readonly upperCase: GrdCommand = {
    id: 'upper',
    label: '&UPPER CASE',
    icon: 'app:case',
    enabled: () => !!this.note(),
    run: () => this.note()?.changeCase('upper'),
  };
  readonly lowerCase: GrdCommand = {
    id: 'lower',
    label: '&lower case',
    enabled: () => !!this.note(),
    run: () => this.note()?.changeCase('lower'),
  };
  readonly titleCase: GrdCommand = {
    id: 'title',
    label: '&Title Case',
    enabled: () => !!this.note(),
    run: () => this.note()?.changeCase('title'),
  };
  /** A command that is on or off: a check mark in a menu, a toggle button in the toolbar. Its `run` turns the setting; the toolbar never writes it. */
  readonly wrapLines: GrdCommand = {
    id: 'wrap',
    label: '&Wrap lines',
    icon: 'app:wrap',
    checked: this.notes.wrap,
    run: () => this.notes.wrap.update((on) => !on),
  };

  /** The commands by their name: the split button of the toolbar names the case by it. */
  readonly byId = new Map<string, GrdCommand>(
    [
      this.newDocument,
      this.save,
      this.close,
      this.insertDate,
      this.upperCase,
      this.lowerCase,
      this.titleCase,
    ].map((command) => [command.id, command]),
  );

  /** The application gives the engine once it is there (the commands open and close its tabs). */
  attach(engine: GrdDockingEngine | undefined): void {
    this.engine.set(engine);
  }

  /** Says something in the status bar. */
  say(text: string): void {
    this.message.set(text);
  }

  /** Opens a note as a new document of the engine; the engine makes it the active tab. */
  open(title: string, text: string): void {
    this.engine()?.openComponentTab(noteTab(title, text));
  }

  /** Help › About: a page of HTML as a document, opened once (a second press brings it forward). */
  about(): void {
    const engine = this.engine();
    if (!engine) return;
    const [open] = engine.api.getByTag('about');
    if (open) {
      engine.api.activateTab(open.id);
      return;
    }
    engine.openHtmlTab({
      tag: 'about',
      role: 'document',
      title: 'About',
      content:
        '<h2>Notes</h2><p>A tutorial of Gridify: <code>grd-menu-bar</code>, <code>grd-toolbar</code>, <code>grd-status-bar</code> and a popup menu around <code>grd-docking-engine</code>.</p>',
    });
  }

  /** Saves the note of the active document: the status bar shows the progress for a moment, then the mark of the change goes. */
  private saveNote(): void {
    const note = this.note();
    const title = this.document()?.title ?? '';
    if (!note) return;
    this.say(`Saving ${title}…`);
    this.saving.set(0);
    const timer = setInterval(() => {
      const next = (this.saving() ?? 0) + 0.25;
      if (next < 1) {
        this.saving.set(next);
        return;
      }
      clearInterval(timer);
      this.saving.set(null);
      note.saved();
      this.say(`Saved ${title}.`);
    }, 200);
  }
}
