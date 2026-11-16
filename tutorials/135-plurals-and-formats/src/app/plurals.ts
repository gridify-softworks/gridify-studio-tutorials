import { Component, computed, signal } from '@angular/core';
import { GrdSpinner, t, tx } from '@gridify/studio';

/** The numbers of the table: each one picks its form by the rules of the language on the screen. */
const NUMBERS = [0, 1, 2, 5, 21, 22, 25, 1.5, 1000000];

/** Plural forms: the text follows the number and the language. */
@Component({
  selector: 'app-plurals',
  imports: [GrdSpinner],
  template: `
    <div class="fields">
      <grd-spinner [label]="filesLabel()" [(value)]="files" [min]="0" [max]="30" />
      <grd-spinner [label]="hoursLabel()" [(value)]="hours" [min]="0" [max]="12" [step]="0.5" />
    </div>
    <p class="line files">{{ filesText() }}</p>
    <p class="line question">{{ question() }}</p>
    <p class="line hours">{{ hoursText() }}</p>
    <h3>{{ tableTitle() }}</h3>
    <table>
      @for (row of table(); track row.number) {
        <tr>
          <td>{{ row.files }}</td>
          <td>{{ row.hours }}</td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 16px 16px;
      font-size: var(--grd-font-size-base);
    }
    .fields {
      display: flex;
      gap: 16px;
      max-width: 420px;
    }
    .line {
      margin: 8px 0;
      font-size: 1.15em;
    }
    h3 {
      margin: 20px 0 6px;
      font-size: 1em;
    }
    td {
      padding: 2px 24px 2px 0;
    }
  `,
})
export class Plurals {
  protected readonly files = signal<number | null>(5);
  protected readonly hours = signal<number | null>(1.5);

  /** Labels: `t()` gives a signal that follows the language. */
  protected readonly filesLabel = t('Number of files');
  protected readonly hoursLabel = t('Hours worked');
  protected readonly tableTitle = t('The same texts for other numbers');

  /** `count` picks the form; no files at all get a text of their own. */
  protected readonly filesText = computed(() => {
    const count = this.files() ?? 0;
    return count === 0 ? tx('No files') : tx('{count} files', { count });
  });

  /** Two parameters: the number picks the form, the name of the folder is put in as it is. */
  protected readonly question = computed(() =>
    tx('Delete {count} files from {folder}?', { count: this.files() ?? 0, folder: 'Invoices' }),
  );

  /** A number with decimals: `1.5` in English, `1,5` in German and French, and the form for it. */
  protected readonly hoursText = computed(() => tx('{count} hours', { count: this.hours() ?? 0 }));

  /** `tx()` reads the language, so every `computed` that calls it is made again when the language changes. */
  protected readonly table = computed(() =>
    NUMBERS.map((count) => ({
      number: count,
      files: tx('{count} files', { count }),
      hours: tx('{count} hours', { count }),
    })),
  );
}
