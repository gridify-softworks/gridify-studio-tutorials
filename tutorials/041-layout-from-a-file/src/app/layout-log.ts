import { Injectable, signal } from '@angular/core';

/** What the application did with the layouts, the newest on top. A service, because the tab Output is made again when another layout replaces the tabs. */
@Injectable({ providedIn: 'root' })
export class LayoutLog {
  readonly lines = signal<string[]>([]);

  write(line: string): void {
    const time = new Date().toLocaleTimeString();
    this.lines.update((lines) => [`${time}  ${line}`, ...lines].slice(0, 50));
  }
}
