import { Component, signal } from '@angular/core';
import { GrdTextarea } from '@gridify/studio';

/** A tool: a text field that fills the panel. The text lives as long as the page. */
@Component({
  selector: 'app-notes-tool',
  imports: [GrdTextarea],
  template: `
    <grd-textarea
      fill
      ariaLabel="Notes"
      placeholder="Notes for this session…"
      [(value)]="text"
      [reserveMessageSpace]="false"
      [validationMessage]="false"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      box-sizing: border-box;
      padding: 8px;
    }
  `,
})
export class NotesTool {
  protected readonly text = signal('');
}
