import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { type GrdStatusItem, injectGrdDialogRef } from '@gridify/studio';

/**
 * The body of a dialog with a status bar: a note that fills the window. The component keeps the status bar up to date while it is typed in (the place of
 * the caret, the number of words, whether the note was edited), and one item of the bar is a menu (the wrapping of the lines). Save is enabled once the
 * note was edited, and its result is the note.
 */
@Component({
  selector: 'app-note-dialog',
  template: `
    <textarea
      #area
      aria-label="Note"
      spellcheck="false"
      [class.nowrap]="!wrap()"
      [value]="text()"
      (input)="text.set(area.value); caret()"
      (keyup)="caret()"
      (click)="caret()"
      (select)="caret()"
    ></textarea>
  `,
  styles: `
    :host {
      display: flex;
      height: 100%;
    }
    textarea {
      flex: 1;
      min-height: 0;
      resize: none;
      box-sizing: border-box;
      padding: 8px;
      border: 1px solid var(--grd-border-color);
      border-radius: 4px;
      background: var(--grd-input-bg, transparent);
      color: inherit;
      font: inherit;
      line-height: 1.45;
    }
    textarea.nowrap {
      white-space: pre;
      overflow-x: auto;
    }
  `,
})
export class NoteDialog {
  /** The note when the dialog opens. */
  readonly start = input('');

  protected readonly text = linkedSignal(() => this.start());
  protected readonly wrap = signal(true);
  private readonly line = signal(1);
  private readonly column = signal(1);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  private readonly words = computed(() => {
    const text = this.text().trim();
    return text ? text.split(/\s+/).length : 0;
  });

  constructor() {
    const ref = injectGrdDialogRef<string | null>();
    // The status bar of the dialog is the component's: it says what the note is like now. `update` changes only what it is given.
    effect(() => {
      const edited = this.text() !== this.start();
      const wrap = this.wrap();
      const items: GrdStatusItem[] = [
        {
          id: 'state',
          text: edited ? 'Edited' : 'Not edited',
          variant: edited ? 'warning' : 'neutral',
          live: true,
        },
        { id: 'caret', text: `Ln ${this.line()}, Col ${this.column()}`, align: 'end' },
        { id: 'words', text: `${this.words()} words`, align: 'end' },
        {
          id: 'wrap',
          text: wrap ? 'Wrap' : 'No wrap',
          tooltip: 'The wrapping of the lines',
          align: 'end',
          choices: [
            { label: 'Wrap the lines', checked: wrap, run: () => this.wrap.set(true) },
            { label: 'One line is one line', checked: !wrap, run: () => this.wrap.set(false) },
          ],
        },
      ];
      ref.update({ statusBar: items });
      ref.patchButton('save', { disabled: !edited, result: this.text() });
    });
  }

  /** Where the caret is: the line and the column, counted from 1. */
  protected caret(): void {
    const area = this.area().nativeElement;
    const before = area.value.slice(0, area.selectionStart);
    const lines = before.split('\n');
    this.line.set(lines.length);
    this.column.set(lines[lines.length - 1].length + 1);
  }
}
