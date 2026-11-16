import { Component, signal } from '@angular/core';
import { GrdButton } from '@gridify/studio';

/** A real Angular component in a tab: it keeps its state while the tab is moved around. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>An Angular component with a signal.</p>
    <grd-button [label]="'Clicked ' + clicks() + ' times'" (pressed)="clicks.set(clicks() + 1)" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Counter {
  protected readonly clicks = signal(0);
}
