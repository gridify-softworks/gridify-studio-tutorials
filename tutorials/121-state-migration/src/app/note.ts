import { Component, inject, OnInit, signal } from '@angular/core';
import { GrdPersistable, GrdPersistedState, GrdTabContext } from '@gridify/studio';

type NoteColor = 'yellow' | 'green' | 'blue' | 'pink';

/** Version 1 of the state, as the first release saved it: a note was only a text. */
interface NoteV1 {
  text: string;
}

/** Version 2 of the state: a note has a color as well. */
interface NoteV2 {
  text: string;
  color: NoteColor;
}

/** The version of the state that this code writes. */
const VERSION = 2;

/**
 * Turns a saved state of any version this code knows into the current one. A note of version 1 gets the color that every note had
 * then, yellow. A version this code does not know (written by a newer release) gives `null`.
 */
function migrate(state: GrdPersistedState): NoteV2 | null {
  switch (state.v) {
    case 1: {
      const { text } = state.data as NoteV1;
      return { text, color: 'yellow' };
    }
    case 2:
      return state.data as NoteV2;
    default:
      return null;
  }
}

/** A sticky note: a text and a color. Its state carries a version, and `restore` reads the old versions too. */
@Component({
  selector: 'app-note',
  template: `
    <div class="colors" role="group" aria-label="Color">
      @for (option of colors; track option) {
        <button
          type="button"
          [class]="option"
          [attr.aria-label]="option"
          [attr.aria-pressed]="option === color()"
          (click)="setColor(option)"
        ></button>
      }
    </div>
    <textarea
      #textArea
      [class]="color()"
      aria-label="Note"
      placeholder="Write something…"
      [value]="text()"
      (input)="setText(textArea.value)"
    ></textarea>
    <p class="version">
      @if (unknownVersion !== null) {
        <strong>Not known:</strong> a state of version {{ unknownVersion }}. The note starts empty,
        and the state stays saved as it was until the note is changed.
      } @else {
        @switch (savedVersion) {
          @case (null) {
            A new note. It saves its state as version {{ version }}.
          }
          @case (version) {
            Restored from a state of version {{ version }}.
          }
          @default {
            <strong>Migrated</strong> from a state of version {{ savedVersion }} to version
            {{ version }}.
          }
        }
      }
    </p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 440px;
      padding: 16px;
    }
    .yellow {
      --note: #fff1a8;
    }
    .green {
      --note: #cdf2c9;
    }
    .blue {
      --note: #cfe4ff;
    }
    .pink {
      --note: #ffd3e4;
    }
    .colors {
      display: flex;
      gap: 8px;
    }
    .colors button {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid rgb(0 0 0 / 0.25);
      border-radius: 50%;
      background: var(--note);
      cursor: pointer;
    }
    .colors button[aria-pressed='true'] {
      outline: 2px solid var(--grd-accent);
      outline-offset: 2px;
    }
    textarea {
      min-height: 180px;
      padding: 12px;
      border: none;
      border-radius: 4px;
      background: var(--note);
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
      color: #1f2328;
      font: inherit;
      resize: vertical;
    }
    .version {
      margin: 0;
      opacity: 0.88;
    }
  `,
})
export class Note implements GrdPersistable, OnInit {
  private readonly tab = inject(GrdTabContext);
  protected readonly colors: NoteColor[] = ['yellow', 'green', 'blue', 'pink'];
  protected readonly version = VERSION;

  protected readonly text = signal('');
  protected readonly color = signal<NoteColor>('yellow');
  /** The version of the state the note came back from, or `null` for a new note. */
  protected savedVersion: number | null = null;
  /** The version of a saved state that this code cannot read (a newer release wrote it), or `null`. */
  protected unknownVersion: number | null = null;

  /** Always the current version. */
  persist(): GrdPersistedState<NoteV2> {
    return { v: VERSION, data: { text: this.text(), color: this.color() } };
  }

  /**
   * Any version: the old ones are migrated first. A version that is not known gives `false`: the engine keeps the saved state as it
   * is, so this older code does not write over what a newer release saved, until the note is changed.
   */
  restore(state: GrdPersistedState): boolean {
    const data = migrate(state);
    if (!data) {
      this.unknownVersion = state.v;
      return false;
    }
    this.text.set(data.text);
    this.color.set(data.color);
    this.savedVersion = state.v;
    return true;
  }

  ngOnInit(): void {
    // A migrated state is written back at once, in the current version.
    if (this.savedVersion !== null && this.savedVersion !== VERSION) this.tab.requestSave();
  }

  protected setText(text: string): void {
    this.text.set(text);
    this.tab.requestSave();
  }

  protected setColor(color: NoteColor): void {
    this.color.set(color);
    this.tab.requestSave();
  }
}
