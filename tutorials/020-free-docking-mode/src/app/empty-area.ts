import { Component } from '@angular/core';

/** What the engine shows while no tab is docked. */
@Component({
  selector: 'app-empty-area',
  template: `
    <h2>Nothing open</h2>
    <p>File › Add tool or File › Add document</p>
  `,
  styles: `
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--grd-text-main);
    }
    h2 {
      margin: 0;
      font-weight: 600;
    }
  `,
})
export class EmptyArea {}
