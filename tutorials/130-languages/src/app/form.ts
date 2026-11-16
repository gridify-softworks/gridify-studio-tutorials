import { Component, signal } from '@angular/core';
import { GrdFileUpload, GrdInput } from '@gridify/studio';

/** Two controls of the library in a tab. The label Name is a text of the application; everything else is the library's. */
@Component({
  selector: 'app-form',
  imports: [GrdInput, GrdFileUpload],
  template: `
    <grd-input label="Name" required [(value)]="name" />
    <grd-file-upload />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
    }
  `,
})
export class Form {
  protected readonly name = signal('');
}
