import { Injectable, signal } from '@angular/core';

/** What happened, newest first: the events of GrdAuth and what the application did. */
@Injectable({ providedIn: 'root' })
export class EventLog {
  /** The lines, newest first (at most 30). */
  readonly lines = signal<string[]>([]);

  /** Writes a line with the time of the moment. */
  write(text: string): void {
    const time = new Date().toLocaleTimeString();
    this.lines.update((lines) => [`${time}  ${text}`, ...lines].slice(0, 30));
  }
}
