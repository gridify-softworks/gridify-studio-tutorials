import { Component, inject, Injectable, signal } from '@angular/core';

/** The lines of the log: the events of the windows, the newest first. */
@Injectable({ providedIn: 'root' })
export class WindowLog {
  readonly lines = signal<readonly string[]>([]);

  add(event: string, text: string): void {
    const time = new Date().toLocaleTimeString();
    this.lines.update((lines) => [`${time}  ${event}  ${text}`, ...lines].slice(0, 50));
  }
}

/** A tool that shows the log. It reads a service of the application, so it works in any window. */
@Component({
  selector: 'app-window-log',
  template: `
    @for (line of log.lines(); track $index) {
      <div class="line">{{ line }}</div>
    } @empty {
      <p>Move a tab to a window of its own: what happens is written here.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font-family: var(--grd-font-mono);
      font-size: 12px;
    }
    .line {
      white-space: nowrap;
    }
    p {
      font-family: var(--grd-font-main);
      font-size: inherit;
      margin: 0;
    }
  `,
})
export class WindowLogTool {
  protected readonly log = inject(WindowLog);
}
