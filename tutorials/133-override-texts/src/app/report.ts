import { Component, signal } from '@angular/core';
import { GrdFileUpload, GrdSpinner } from '@gridify/studio';

/** A report with attachments: the upload shows texts of the library, three of them in the company's wording. */
@Component({
  selector: 'app-report',
  imports: [GrdFileUpload, GrdSpinner],
  template: `
    <p>A report of the company. Its attachments:</p>
    <grd-spinner label="Attachments allowed" [(value)]="allowed" [min]="1" [max]="10" />
    <grd-file-upload multiple [maxFiles]="allowed() ?? 1" maxSize="2.5MB" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      padding: 0 16px 16px;
    }
  `,
})
export class Report {
  protected readonly allowed = signal<number | null>(3);
}
