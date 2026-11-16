import { Component, computed, inject } from '@angular/core';
import {
  GrdEngineEvents,
  type GrdProperty,
  type GrdPropertyChange,
  GrdPropertyGrid,
} from '@gridify/studio';
import { Notes, ZOOMS } from './notes';

/** The view of the notes: one setting for all of them, so a change here changes every note (and the menu, the toolbar and the status bar show it). */
const VIEW: GrdProperty[] = [
  {
    id: 'wrap',
    label: 'Wrap lines',
    category: 'View of all the notes',
    kind: 'boolean',
    defaultValue: true,
    description: 'Long lines go on in the next line. The same as View › Wrap lines.',
  },
  {
    id: 'zoom',
    label: 'Zoom',
    category: 'View of all the notes',
    kind: 'select',
    options: ZOOMS.map((zoom) => ({ value: zoom, label: zoom })),
    defaultValue: '100%',
    description: 'The size of the text. The same as the select of the toolbar.',
  },
];

/** The rows of a note: what it is (read only) and the view. */
const NOTE: GrdProperty[] = [
  { id: 'title', label: 'Title', category: 'Document', kind: 'readonly' },
  {
    id: 'changed',
    label: 'Changed',
    category: 'Document',
    kind: 'readonly',
    description: 'The note has changes that are not saved yet (File › Save, Ctrl+S).',
  },
  { id: 'words', label: 'Words', category: 'Text', kind: 'readonly' },
  { id: 'characters', label: 'Characters', category: 'Text', kind: 'readonly' },
  { id: 'lines', label: 'Lines', category: 'Text', kind: 'readonly' },
  ...VIEW,
];

/** The rows of a document that is no note (About). */
const PAGE: GrdProperty[] = [
  { id: 'title', label: 'Title', category: 'Document', kind: 'readonly' },
  { id: 'kind', label: 'Kind', category: 'Document', kind: 'readonly' },
  ...VIEW,
];

/**
 * A tool of the engine: the properties of the active document in a property grid. It reads the active document from `GrdEngineEvents`, the service of the
 * events of every engine. The rows of the text are only read; Wrap lines and Zoom can be changed here.
 */
@Component({
  selector: 'app-properties-tool',
  imports: [GrdPropertyGrid],
  template: `
    @if (document()) {
      <grd-property-grid
        [properties]="properties()"
        [values]="values()"
        [showToolbar]="false"
        ariaLabel="Properties of the document"
        (propertyChanged)="changed($event)"
      />
    } @else {
      <p>No document is active. Click into one, or open one with File › New document.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
    }
    grd-property-grid {
      flex: 1;
      min-height: 0;
    }
    p {
      margin: 0;
      padding: 10px 12px;
      line-height: 1.45;
      opacity: 0.88;
    }
  `,
})
export class PropertiesTool {
  private readonly notes = inject(Notes);
  /** The tab of the document that had the focus last; it stays while the user clicks into a tool. */
  protected readonly document = inject(GrdEngineEvents).activeDocumentTab();
  private readonly note = computed(() => this.notes.get(this.document()?.tabId));

  protected readonly properties = computed(() => (this.note() ? NOTE : PAGE));

  /** The values of the rows, by the id of the property. They follow the note as it is typed into. */
  protected readonly values = computed<Record<string, unknown>>(() => {
    const note = this.note();
    const view = { wrap: this.notes.wrap(), zoom: this.notes.zoom() };
    const title = this.document()?.title ?? '';
    if (!note) return { title, kind: 'a page, not a note', ...view };
    return {
      title,
      changed: note.dirty() ? 'yes' : 'no',
      words: note.words(),
      characters: note.text().length,
      lines: note.lines(),
      ...view,
    };
  });

  /** The user changed a row: only the view can be changed. */
  protected changed(change: GrdPropertyChange): void {
    if (change.id === 'wrap') this.notes.wrap.set(change.value === true);
    if (change.id === 'zoom') this.notes.zoom.set(String(change.value));
  }
}
