import { Component, signal } from '@angular/core';
import { GrdButton } from '@gridify/studio';

/**
 * The counter of 015, with a line under it. It keeps its clicks while the tab is moved around, but it saves nothing
 * (it is not `GrdPersistable`), so after F5 it starts from 0 again.
 */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>An Angular component with a signal.</p>
    <grd-button [label]="'Clicked ' + clicks() + ' times'" (pressed)="clicks.set(clicks() + 1)" />
    <p class="note">
      This counter does not save its state: after F5 it starts from 0 again. A note (File › Add
      note) saves its state, and comes back as it was.
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class Counter {
  protected readonly clicks = signal(0);
}
