import { computed, Injectable, signal } from '@angular/core';
import type { GrdCodeCursor, GrdConsoleKind, GrdConsoleLine } from '@gridify/studio';
import { checkSettings, START_TEXT } from './settings';

/** A line of the console, with a field of our own: the place in the file that the line speaks of. */
export interface ConsoleLine extends GrdConsoleLine {
  at?: GrdCodeCursor;
}

/** What the editor, the console and the example share: the text of the file and the lines of the console. */
@Injectable({ providedIn: 'root' })
export class Workspace {
  /** The text of settings.yaml. The editor shows it and changes it; the console reads it and changes it too. */
  readonly text = signal(START_TEXT);

  /** The problems of the text, found again whenever it changes. */
  readonly problems = computed(() => checkSettings(this.text()));

  /** The lines of the console, oldest first. */
  readonly lines = signal<ConsoleLine[]>([
    { id: 0, text: 'settings.yaml is open. Type help and press Enter.', kind: 'muted' },
  ]);

  /** The place that the editor is asked to show: the console sets it, the editor goes there. */
  readonly goTo = signal<GrdCodeCursor | null>(null);

  private nextId = 1;

  /** Writes a line to the console. A line with a place (`at`) is a link: a double click shows the place. */
  write(text: string, kind: GrdConsoleKind = 'info', at?: GrdCodeCursor): void {
    const line: ConsoleLine = { id: this.nextId++, text, kind, time: new Date() };
    if (at) {
      line.at = at;
      line.actionable = true;
      line.title = 'Double-click to show it in the editor';
    }
    this.lines.update((lines) => [...lines, line]);
  }
}
