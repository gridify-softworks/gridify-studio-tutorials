import { Component, inject, signal } from '@angular/core';
import { GrdEngineEvents } from '@gridify/studio';

/** A tool: what the engine reports, the newest on top. */
@Component({
  selector: 'app-events-tool',
  template: `
    @for (line of lines(); track $index) {
      <div>{{ line }}</div>
    } @empty {
      <p>Open, close, move or resize something.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font: 12px/1.6 var(--grd-font-mono);
      color: var(--grd-text-main);
    }
  `,
})
export class EventsTool {
  protected readonly lines = signal<string[]>([]);

  constructor() {
    const events = inject(GrdEngineEvents);
    const write = (line: string) => this.lines.update((lines) => [line, ...lines].slice(0, 50));
    events.on('tabOpened', (e) => write(`tabOpened ${e.title} (${e.role})`));
    events.on('tabClosed', (e) => write(`tabClosed ${e.title}`));
    events.on('tabDocked', (e) => write(`tabDocked ${e.title}: ${e.action}`));
    events.on('tabFloated', (e) => write(`tabFloated ${e.title}`));
    events.on('panelResized', (e) =>
      write(`panelResized ${e.sizes.map((s) => Math.round(s.size) + s.unit).join(' | ')}`),
    );
    events.on('layoutReset', () => write('layoutReset'));
  }
}
