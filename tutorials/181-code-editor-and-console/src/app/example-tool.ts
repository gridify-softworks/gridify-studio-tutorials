import { Component, inject } from '@angular/core';
import { GrdButton, GrdCodeBlock } from '@gridify/studio';
import { EXAMPLE_TEXT } from './settings';
import { Workspace } from './workspace';

/** A tool: settings that are in order, as code to read (with a Copy button), and a button that uses them. */
@Component({
  selector: 'app-example-tool',
  imports: [GrdButton, GrdCodeBlock],
  template: `
    <p>Settings that are in order:</p>
    <grd-code-block language="yaml" heading="settings.yaml" lineNumbers [code]="example" />
    <grd-button label="Use these settings" (pressed)="use()" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 12px;
    }
    grd-code-block {
      align-self: stretch;
    }
    p {
      margin: 0;
    }
  `,
})
export class ExampleTool {
  private readonly workspace = inject(Workspace);
  protected readonly example = EXAMPLE_TEXT;

  /** The editor shows the example: it shows the text of the workspace, whoever changes it. */
  protected use(): void {
    this.workspace.text.set(EXAMPLE_TEXT);
    this.workspace.write('The example is in settings.yaml now.', 'success');
  }
}
