import { Component } from '@angular/core';

/** The tool of the key `explorer`: a bar of the shell on the left in `layout.json`. */
@Component({
  selector: 'app-explorer',
  template: `
    <p class="hint">The component of the key <code>explorer</code>.</p>
    <ul>
      @for (file of files; track file) {
        <li>{{ file }}</li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      color: var(--grd-text-main);
    }
    .hint {
      margin: 0 0 8px;
      opacity: 0.88;
    }
    ul {
      margin: 0;
      padding-left: 18px;
    }
  `,
})
export class ExplorerComponent {
  protected readonly files = [
    'layout.json',
    'layout-loader.ts',
    'app.ts',
    'layouts/compact.json',
    'layouts/foreign.json',
  ];
}
