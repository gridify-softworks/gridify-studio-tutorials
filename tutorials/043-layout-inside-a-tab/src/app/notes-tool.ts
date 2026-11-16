import { Component } from '@angular/core';

/** A tool: a note, to show that the engine arranges the tabs and the splitter the inside of one. */
@Component({
  selector: 'app-notes-tool',
  template: `
    <p>The engine arranges the tabs: drag this tool to another side, or float it.</p>
    <p>
      The splitter arranges the inside of one tab: drag the line between the list and the message.
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
  `,
})
export class NotesTool {}
