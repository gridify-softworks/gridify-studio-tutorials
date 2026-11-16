import { Component, computed, inject } from '@angular/core';
import { Editor } from './editor';

/** What to try on each tab of the ribbon. */
const GUIDES: Record<string, { title: string; points: string[] }> = {
  basics: {
    title: 'Basics',
    points: [
      'New document (Alt+N) opens a document below the ribbon; its arrow chooses a letter or a report.',
      'Close, Close all and Duplicate work on the document you are in.',
      'Bold, Italic and Underline (Ctrl+B, Ctrl+I, Ctrl+U) follow the active document: click another tab of the engine and they change.',
      'Press Alt and the KeyTips appear; Alt+Q searches all the commands.',
      'Double-click a tab of the ribbon to hide the ribbon, click it to see it again.',
    ],
  },
  controls: {
    title: 'Controls',
    points: [
      'Each control changes the active document: the font and its size, the colors, the alignment, the line spacing.',
      'A tile of the gallery sets a whole style at once.',
      'Frame, the width and the paper change the page; Table puts a table under the text.',
      'The progress bar counts the words towards the goal of the spinner beside it.',
      'With no document open the controls are off: hover one to see why.',
    ],
  },
  collapsing: {
    title: 'Collapsing',
    points: [
      'Make the window narrower. First the sections take their compact form: Symbols, Text, Links, Illustrations, Pages.',
      'Then they collapse into buttons: Symbols, Text, Comments, Illustrations. Pages never collapses (collapsible: false), and Links does not either: in its compact form it is three icons, narrower than the button it would become.',
      'A collapsed section is a button that opens the whole section.',
      'Every button writes something at the end of the active document.',
    ],
  },
};

/** The tool on the right: it explains the tab of the ribbon that is shown. */
@Component({
  selector: 'app-guide-tool',
  template: `
    <h3>{{ guide().title }}</h3>
    <ul>
      @for (point of guide().points; track point) {
        <li>{{ point }}</li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      box-sizing: border-box;
      padding: 8px 14px;
      line-height: 1.45;
    }
    h3 {
      margin: 4px 0 8px;
      font-size: 1rem;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
    li {
      margin-bottom: 6px;
    }
  `,
})
export class GuideTool {
  private readonly editor = inject(Editor);
  protected readonly guide = computed(
    () => GUIDES[this.editor.ribbonTab() ?? 'basics'] ?? GUIDES['basics'],
  );
}
