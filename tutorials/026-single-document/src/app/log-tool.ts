import { Component, inject } from '@angular/core';
import { OrderStore } from './order';

/** A tool: what happened to the order, the newest first. */
@Component({
  selector: 'app-log-tool',
  template: `
    <ul>
      @for (line of order.log(); track $index) {
        <li>{{ line }}</li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--grd-font-mono);
    }
  `,
})
export class LogTool {
  protected readonly order = inject(OrderStore);
}
