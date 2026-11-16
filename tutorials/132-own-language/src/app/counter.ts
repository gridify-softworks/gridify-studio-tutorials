import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n } from '@gridify/studio';

/** A real Angular component in a tab, with its texts under keys: they follow the language. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>{{ i18n.keyed('app.counter.intro') }}</p>
    <grd-button
      [label]="i18n.keyed('app.counter.clicked', { count: clicks() })"
      (pressed)="clicks.set(clicks() + 1)"
    />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Counter {
  protected readonly i18n = inject(GrdI18n);
  protected readonly clicks = signal(0);
}
