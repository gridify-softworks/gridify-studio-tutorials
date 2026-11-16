import { computed, Injectable, signal, WritableSignal } from '@angular/core';

/** How a document looks: what the ribbon shows and changes. The format is of the whole document (a tutorial, not a word processor). */
export interface DocFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  font: string;
  size: number;
  color: string;
  highlight: string;
  align: 'left' | 'center' | 'right' | 'justify';
  spacing: string;
  style: string;
  frame: boolean;
  width: 'narrow' | 'wide';
  paper: string;
  table: { columns: number; rows: number } | null;
}

/** One document: its tab id, its title, its text and its format. */
export interface Doc {
  id: string;
  title: string;
  text: WritableSignal<string>;
  format: WritableSignal<DocFormat>;
}

/** What a new document starts with (the arrow of New document). */
export type Template = 'blank' | 'letter' | 'report';

/** The styles of the gallery: each sets a few properties of the format at once. */
export const STYLES: Record<string, Partial<DocFormat>> = {
  normal: { font: 'Georgia', size: 16, bold: false, italic: false, color: '#1f2937' },
  title: { font: 'Trebuchet MS', size: 30, bold: true, italic: false, color: '#1e3a8a' },
  heading: { font: 'Trebuchet MS', size: 22, bold: true, italic: false, color: '#0f766e' },
  quote: { font: 'Georgia', size: 18, bold: false, italic: true, color: '#6b7280' },
  code: { font: 'Courier New', size: 14, bold: false, italic: false, color: '#9a3412' },
};

const START: DocFormat = {
  ...(STYLES['normal'] as Pick<DocFormat, 'font' | 'size' | 'bold' | 'italic' | 'color'>),
  underline: false,
  highlight: 'none',
  align: 'left',
  spacing: '1.5',
  style: 'normal',
  frame: false,
  width: 'wide',
  paper: 'white',
  table: null,
};

const TEXTS: Record<Template, string> = {
  blank: '',
  letter:
    'Dear Ms. Novak,\n\nthank you for your letter. The ribbon above changes how this text looks.\n\nKind regards,\nJan',
  report:
    'Quarterly report\n\nSales grew in every region. The next quarter starts with three new products and a new shop.',
};

/**
 * The documents of the application and the one that is active. The ribbon reads the format of the active document from here, and its
 * commands change it here; the documents (`DocumentPage`) draw themselves from it.
 */
@Injectable({ providedIn: 'root' })
export class Editor {
  private counter = 0;

  readonly documents = signal<readonly Doc[]>([]);
  /** The tab id of the document the user works in (the engine tells it: `tabActiveChanged` in `App`). */
  readonly activeId = signal<string | null>(null);
  readonly active = computed(
    () => this.documents().find((doc) => doc.id === this.activeId()) ?? null,
  );
  readonly format = computed(() => this.active()?.format() ?? null);
  readonly noDocument = computed(() => this.active() === null);
  readonly words = computed(() => countWords(this.active()?.text() ?? ''));

  /** The tab of the ribbon that is shown (the Guide follows it). */
  readonly ribbonTab = signal<string | undefined>('basics');
  /** Shows the word count under every document (the toggle Word count, two-way). */
  readonly showCount = signal(true);
  /** How many words the documents should have (the spinner Goal). */
  readonly goal = signal(50);

  /** Makes a new document; the caller opens its tab. */
  create(template: Template, from?: Doc): Doc {
    const id = `doc-${++this.counter}`;
    const doc: Doc = {
      id,
      title: from ? `${from.title} (copy)` : `Document ${this.counter}`,
      text: signal(from ? from.text() : TEXTS[template]),
      format: signal(from ? { ...from.format() } : { ...START }),
    };
    this.documents.update((all) => [...all, doc]);
    return doc;
  }

  /** The tab of the document was closed. */
  remove(id: string): void {
    this.documents.update((all) => all.filter((doc) => doc.id !== id));
    if (this.activeId() === id) this.activeId.set(null);
  }

  /** Changes the format of the active document. */
  patch(change: Partial<DocFormat>): void {
    this.active()?.format.update((format) => ({ ...format, ...change }));
  }

  /** Writes a text at the end of the active document, on a line of its own. */
  insert(text: string): void {
    this.active()?.text.update((all) =>
      all === '' || all.endsWith('\n') ? all + text : `${all}\n${text}`,
    );
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}
