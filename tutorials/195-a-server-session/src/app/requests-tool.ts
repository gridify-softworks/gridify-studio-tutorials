import { Component } from '@angular/core';
import { server } from './pretend-server';

/** A tool: every request that the server got, the newest first. */
@Component({
  selector: 'app-requests-tool',
  template: `
    @for (line of log(); track $index) {
      <div>{{ line }}</div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font-family: var(--grd-font-mono, monospace);
      font-size: 0.9em;
    }
  `,
})
export class RequestsTool {
  protected readonly log = server.log;
}
