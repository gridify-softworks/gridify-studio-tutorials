import { Component, inject } from '@angular/core';
import { LayoutLog } from './layout-log';

/** The tool of the key `output`: what the application did with the layouts. */
@Component({
  selector: 'app-output',
  template: `
    @for (line of log.lines(); track $index) {
      <div>{{ line }}</div>
    } @empty {
      <p>Nothing yet: choose a layout in the menu Layout.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font: 12px/1.6 var(--grd-font-mono);
      color: var(--grd-text-main);
    }
    p {
      margin: 0;
    }
  `,
})
export class OutputComponent {
  protected readonly log = inject(LayoutLog);
}
