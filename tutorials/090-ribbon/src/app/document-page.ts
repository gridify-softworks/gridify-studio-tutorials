import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { countWords, Doc, Editor } from './editor';

/** The colors of the paper (the select Paper). */
const PAPER: Record<string, string> = { white: '#ffffff', cream: '#fdf6e3', mint: '#ecfdf5' };

/**
 * A document in a tab of the engine: a sheet of paper with the text, drawn in the format the ribbon gives it. The format is of the
 * whole text; the table and the word count come under it.
 */
@Component({
  selector: 'app-document-page',
  template: `
    @let f = doc().format();
    <div
      class="page"
      [class.frame]="f.frame"
      [class.narrow]="f.width === 'narrow'"
      [style.background]="paper()"
    >
      <textarea
        #area
        aria-label="The text of the document"
        spellcheck="false"
        placeholder="Type here…"
        [value]="doc().text()"
        (input)="doc().text.set(area.value)"
        [style.font-family]="f.font"
        [style.font-size.px]="f.size"
        [style.font-weight]="f.bold ? 700 : 400"
        [style.font-style]="f.italic ? 'italic' : 'normal'"
        [style.text-decoration]="f.underline ? 'underline' : 'none'"
        [style.color]="f.color === 'auto' ? '#000000' : f.color"
        [style.background]="f.highlight === 'none' ? 'transparent' : f.highlight"
        [style.text-align]="f.align"
        [style.line-height]="f.spacing"
      ></textarea>
      @if (f.table; as table) {
        <table aria-label="The table of the document">
          @for (row of rows(table.rows); track row) {
            <tr>
              @for (column of rows(table.columns); track column) {
                <td>{{ row === 0 ? 'Column ' + (column + 1) : '' }}</td>
              }
            </tr>
          }
        </table>
      }
      @if (editor.showCount()) {
        <p class="count">{{ words() }} words · {{ f.font }}, {{ f.size }} px · {{ f.style }}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      box-sizing: border-box;
      padding: 16px;
    }
    .page {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 760px;
      min-height: calc(100% - 8px);
      box-sizing: border-box;
      margin: 0 auto;
      padding: 24px 32px;
      color: #1f2937;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
    }
    .page.narrow {
      max-width: 480px;
    }
    .page.frame {
      outline: 2px dashed #94a3b8;
      outline-offset: -12px;
    }
    textarea {
      flex: 1;
      min-height: 160px;
      resize: none;
      border: none;
      outline: none;
      padding: 4px;
      font: inherit;
    }
    table {
      border-collapse: collapse;
      font-size: 13px;
    }
    td {
      border: 1px solid #9ca3af;
      min-width: 64px;
      height: 22px;
      padding: 2px 6px;
      color: #4b5563;
    }
    .count {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
  `,
})
export class DocumentPage {
  /** The document this page draws (`inputs` of the tab). */
  readonly doc = input.required<Doc>();
  protected readonly editor = inject(Editor);
  protected readonly words = computed(() => countWords(this.doc().text()));
  protected readonly paper = computed(() => PAPER[this.doc().format().paper] ?? PAPER['white']);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  constructor() {
    // A new document takes the focus, so the user types into it at once (and the shortcuts of the ribbon work there).
    afterNextRender(() => this.area().nativeElement.focus());
  }

  /** 0, 1, … count - 1, for the cells of the table. */
  protected rows(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }
}
