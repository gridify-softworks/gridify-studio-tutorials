import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { GrdTabContext } from '@gridify/studio';
import { Notes } from './notes';

/** Every word with a capital letter at its start. */
const titleCase = (text: string): string =>
  text
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => space + letter.toUpperCase());

/**
 * A document of the engine: a note in a text area. It follows the settings of all the notes (the wrapping of the lines, the zoom), tells the engine that it was
 * changed (the mark on its tab), and has the methods that the commands of the Edit menu call on the note of the active tab.
 */
@Component({
  selector: 'app-note-document',
  template: `
    <textarea
      #area
      aria-label="Note"
      spellcheck="false"
      [class.nowrap]="!notes.wrap()"
      [style.--zoom]="zoom()"
      [value]="text()"
      (input)="edit(area.value)"
    ></textarea>
  `,
  styles: `
    :host {
      display: flex;
      height: 100%;
    }
    textarea {
      flex: 1;
      min-width: 0;
      resize: none;
      box-sizing: border-box;
      margin: 0;
      padding: 12px 16px;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: calc(14px * var(--zoom, 1));
      line-height: 1.5;
    }
    textarea.nowrap {
      white-space: pre;
      overflow-x: auto;
    }
  `,
})
export class NoteDocument {
  /** The text the note opens with. */
  readonly start = input('');

  readonly text = linkedSignal(() => this.start());
  /** Changed since it was opened or saved. */
  readonly dirty = signal(false);
  readonly words = computed(() => {
    const text = this.text().trim();
    return text ? text.split(/\s+/).length : 0;
  });
  readonly lines = computed(() => this.text().split('\n').length);

  protected readonly notes = inject(Notes);
  protected readonly zoom = computed(() => parseInt(this.notes.zoom(), 10) / 100);
  private readonly tab = inject(GrdTabContext);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  constructor() {
    this.notes.add(this.tab.tabId, this);
    inject(DestroyRef).onDestroy(() => this.notes.remove(this.tab.tabId));
    // A new note is typed into at once.
    afterNextRender(() => this.area().nativeElement.focus());
  }

  /** Puts a text where the caret is, in place of the selection. */
  insert(text: string): void {
    const area = this.area().nativeElement;
    area.setRangeText(text, area.selectionStart, area.selectionEnd, 'end');
    area.focus();
    this.edit(area.value);
  }

  /** The selection, or the whole note when nothing is selected, in another case. */
  changeCase(to: 'upper' | 'lower' | 'title'): void {
    const area = this.area().nativeElement;
    const all = area.selectionStart === area.selectionEnd;
    const from = all ? 0 : area.selectionStart;
    const end = all ? area.value.length : area.selectionEnd;
    const part = area.value.slice(from, end);
    const changed =
      to === 'upper' ? part.toUpperCase() : to === 'lower' ? part.toLowerCase() : titleCase(part);
    const caret = area.selectionStart;
    area.setRangeText(changed, from, end, 'select');
    // Nothing was selected: the caret goes back where it was, or the next key would replace the whole (selected) note.
    if (all) area.setSelectionRange(caret, caret);
    area.focus();
    this.edit(area.value);
  }

  /** The note was saved: the mark on its tab goes. */
  saved(): void {
    this.dirty.set(false);
    this.tab.setDirty(false);
  }

  protected edit(value: string): void {
    this.text.set(value);
    this.dirty.set(true);
    this.tab.setDirty(true);
  }
}
