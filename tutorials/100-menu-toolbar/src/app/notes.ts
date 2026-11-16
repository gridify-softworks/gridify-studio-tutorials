import { Injectable, signal } from '@angular/core';
import type { NoteDocument } from './note-document';

/** The steps of the zoom: the toolbar, the View menu and the status bar offer the same ones. */
export const ZOOMS = ['75%', '100%', '125%', '150%', '200%'];

/**
 * What the notes share, and the notes that are open. The wrapping of the lines and the zoom are one setting for all the notes: the menu, the toolbar and the
 * status bar change these signals, and every note reads them. A note tells that it is open by the id of its tab, so a command finds the note of the active tab.
 */
@Injectable({ providedIn: 'root' })
export class Notes {
  readonly wrap = signal(true);
  readonly zoom = signal('100%');
  private readonly open = signal<ReadonlyMap<string, NoteDocument>>(new Map());

  add(tabId: string, note: NoteDocument): void {
    this.open.update((notes) => new Map(notes).set(tabId, note));
  }

  remove(tabId: string): void {
    this.open.update((notes) => {
      const next = new Map(notes);
      next.delete(tabId);
      return next;
    });
  }

  /** The note in a tab; `undefined` for a tab that is no note (About) and for no tab. */
  get(tabId: string | undefined): NoteDocument | undefined {
    return tabId === undefined ? undefined : this.open().get(tabId);
  }
}
