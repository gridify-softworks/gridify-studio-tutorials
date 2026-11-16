import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n, t } from '@gridify/studio';

/** The counter of 015 with its texts translated. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>{{ description() }}</p>
    <p>{{ i18n.text('Clicks: {clicks}', { clicks: clicks() }) }}</p>
    <grd-button [label]="i18n.text('Add one')" (pressed)="clicks.set(clicks() + 1)" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
      font-size: var(--grd-font-size-base);
    }
  `,
})
export class Counter {
  protected readonly i18n = inject(GrdI18n);
  protected readonly clicks = signal(0);
  /** A text as a signal, made once: read with () it follows the language. */
  protected readonly description = t('An Angular component with a signal.');
}
