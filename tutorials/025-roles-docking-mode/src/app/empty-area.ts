import { Component } from '@angular/core';

/** What the empty document panel shows while no document is open (the choice Own component). */
@Component({
  selector: 'app-empty-area',
  template: `
    <h2>No document</h2>
    <p>File › Add document</p>
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
