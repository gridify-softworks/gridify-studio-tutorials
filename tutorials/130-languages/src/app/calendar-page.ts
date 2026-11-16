import { Component, signal } from '@angular/core';
import { GrdCalendar } from '@gridify/studio';

/** The calendar of the library in a tab: the names of the months and the days come from the language. */
@Component({
  selector: 'app-calendar-page',
  imports: [GrdCalendar],
  template: `<grd-calendar [(value)]="day" />`,
  styles: `
    :host {
      display: block;
      padding: 12px 16px;
    }
  `,
})
export class CalendarPage {
  protected readonly day = signal('');
}
