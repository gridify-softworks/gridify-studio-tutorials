import { Component, computed, inject } from '@angular/core';
import { GrdI18n, grdFormatBytes, tx } from '@gridify/studio';

const AMOUNT = 1234567.891;
/** The currency is a fact of the data, not of the language: a price in euros stays in euros in every language. */
const PRICE = 1234.5;
const SHARE = 0.256;
/** 28 October 2026, 13:05 in UTC: shown in UTC, so the tutorial shows the same time everywhere. */
const WHEN = new Date(Date.UTC(2026, 9, 28, 13, 5));
const SIZE = 2.5 * 1024 * 1024;
const NAMES = ['Zelený', 'Šimek', 'Svoboda', 'Chalupa', 'Čapek', 'Cibulka', 'Horák', 'Hájek'];

/** Numbers, money, dates, a relative time, a size and an order of names, written the way the language on the screen writes them. */
@Component({
  selector: 'app-formats',
  template: `
    <table>
      @for (row of rows(); track $index) {
        <tr>
          <th>{{ row.label }}</th>
          <td>{{ row.value }}</td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font-size: var(--grd-font-size-base);
    }
    th {
      padding: 4px 16px 4px 0;
      font-weight: 600;
      text-align: start;
      vertical-align: top;
      white-space: nowrap;
    }
    td {
      padding: 4px 0;
    }
  `,
})
export class Formats {
  private readonly i18n = inject(GrdI18n);

  /** The formatters are made again only when the language changes: making one is slow, using it is fast. */
  private readonly format = computed(() => {
    const language = this.i18n.language();
    return {
      number: new Intl.NumberFormat(language),
      money: new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }),
      share: new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }),
      date: new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: 'UTC' }),
      time: new Intl.DateTimeFormat(language, { timeStyle: 'short', timeZone: 'UTC' }),
      relative: new Intl.RelativeTimeFormat(language, { numeric: 'auto' }),
      names: new Intl.Collator(language),
      language,
    };
  });

  protected readonly rows = computed(() => {
    const format = this.format();
    return [
      { label: tx('A large number'), value: format.number.format(AMOUNT) },
      { label: tx('Money (euros)'), value: format.money.format(PRICE) },
      { label: tx('A share'), value: format.share.format(SHARE) },
      { label: tx('Date'), value: format.date.format(WHEN) },
      { label: tx('Time'), value: format.time.format(WHEN) },
      { label: tx('A day ago'), value: format.relative.format(-1, 'day') },
      { label: tx('In three hours'), value: format.relative.format(3, 'hour') },
      { label: tx('File size'), value: grdFormatBytes(SIZE, format.language) },
      {
        label: tx('Names by the language'),
        value: [...NAMES].sort(format.names.compare).join(', '),
      },
      // `sort()` without a comparison puts the codes of the letters in order: Č and Š after Z.
      { label: tx('Names by the codes of the letters'), value: [...NAMES].sort().join(', ') },
    ];
  });
}
