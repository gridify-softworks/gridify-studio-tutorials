import { Injectable, signal } from '@angular/core';

/** A line of the log of the backend, shown under the engine. */
export interface LogLine {
  time: string;
  text: string;
  kind: 'info' | 'ok' | 'warning' | 'error';
}

/** The switch of the backend is kept here: a real server stays down when you reload your page, too. */
const DOWN_KEY = 'tutorial-115-backend-down';

/** The backend answers after this long, so the loading can be seen (and a tab closed while it loads). */
const DELAY_MS = 2000;

const REPORTS: Record<number, { title: string; text: string }> = {
  1: { title: 'Sales of the week', text: '128 orders, 14,920 EUR.' },
  2: { title: 'Open support tickets', text: '17 open, 3 of them urgent.' },
};

/** The time of the day, `10:41:07`. */
const now = (): string => new Date().toLocaleTimeString('en-GB');

/**
 * A pretend server. It answers after two seconds, it can be down, and it writes every request into a log. A real application would call its server here
 * (`HttpClient`, `fetch`) and pass it the same `AbortSignal`.
 */
@Injectable({ providedIn: 'root' })
export class Backend {
  /** The switch Backend › The backend is down. */
  readonly down = signal(localStorage.getItem(DOWN_KEY) === 'yes');
  /** The requests, the newest first. */
  readonly log = signal<LogLine[]>([]);

  setDown(down: boolean): void {
    this.down.set(down);
    localStorage.setItem(DOWN_KEY, down ? 'yes' : 'no');
  }

  /**
   * The HTML of a report, two seconds later. When `signal` is aborted first (the engine does that when the tab is closed while it loads), the request stops
   * and the promise is rejected, the way `fetch(url, { signal })` does it.
   */
  report(id: number, signal: AbortSignal): Promise<string> {
    this.write(`report ${id}: asked for`, 'info');
    return new Promise((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        this.write(`report ${id}: cancelled, the tab was closed`, 'warning');
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', cancel);
        if (this.down()) {
          this.write(`report ${id}: failed, the backend is down`, 'error');
          reject(new Error('The backend is down (503).'));
          return;
        }
        this.write(`report ${id}: sent`, 'ok');
        const report = REPORTS[id] ?? { title: 'Unknown report', text: 'There is no such report.' };
        resolve(
          `<h3>Report ${id}: ${report.title}</h3><p>${report.text}</p><p><i>Loaded from the backend at ${now()}.</i></p>`,
        );
      }, DELAY_MS);
      signal.addEventListener('abort', cancel, { once: true });
    });
  }

  private write(text: string, kind: LogLine['kind']): void {
    this.log.update((lines) => [{ time: now(), text, kind }, ...lines].slice(0, 50));
  }
}
