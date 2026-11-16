import { Component } from '@angular/core';

/** The sales of one month. */
interface Month {
  name: string;
  sales: number;
}

const MONTHS: Month[] = [
  { name: 'Jan', sales: 42 },
  { name: 'Feb', sales: 55 },
  { name: 'Mar', sales: 61 },
  { name: 'Apr', sales: 48 },
  { name: 'May', sales: 73 },
  { name: 'Jun', sales: 80 },
];

/**
 * A component that only some users open: its code is not in the main bundle. `app.ts` registers it with a function that
 * imports this file, so the build makes a chunk of it, and the browser loads the chunk the first time a tab needs it.
 */
@Component({
  selector: 'app-report',
  template: `
    <h2>Sales, first half of the year</h2>
    <svg viewBox="0 0 360 160" role="img" aria-label="Sales by month">
      @for (month of months; track month.name; let i = $index) {
        <rect
          [attr.x]="20 + i * 56"
          [attr.y]="140 - month.sales"
          width="36"
          [attr.height]="month.sales"
        />
        <text [attr.x]="38 + i * 56" y="156">{{ month.name }}</text>
        <text [attr.x]="38 + i * 56" [attr.y]="134 - month.sales">{{ month.sales }}</text>
      }
    </svg>
    <p class="note">Created at {{ createdAt }}. Its code came in a chunk of its own.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    h2 {
      font-size: 1.1rem;
    }
    svg {
      width: 100%;
      max-width: 480px;
    }
    rect {
      fill: var(--grd-accent);
    }
    text {
      fill: currentColor;
      font-size: 11px;
      text-anchor: middle;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class Report {
  protected readonly months = MONTHS;
  protected readonly createdAt = new Date().toLocaleTimeString();
}
