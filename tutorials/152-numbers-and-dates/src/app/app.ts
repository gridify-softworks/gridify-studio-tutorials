import { JsonPipe } from '@angular/common';
import { Component, computed, signal, viewChildren } from '@angular/core';
import {
  grdAddDays,
  GrdAppHeader,
  GrdButton,
  GrdDatePicker,
  GrdDateTimePicker,
  grdFormatIsoDate,
  GrdGroupBox,
  GrdInput,
  GrdSlider,
  GrdSpinner,
  GrdTimePicker,
  grdTodayDate,
  grdWeekday,
} from '@gridify/studio';

/** Today as an ISO date (2026-10-28): the pickers take and give ISO texts. */
const TODAY = grdFormatIsoDate(grdTodayDate());

/** The first day after today that is not on a weekend (0 is Sunday, 6 Saturday). */
function nextWorkday(): string {
  let day = grdAddDays(grdTodayDate(), 1);
  while ([0, 6].includes(grdWeekday(day))) day = grdAddDays(day, 1);
  return grdFormatIsoDate(day);
}

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdDatePicker,
    GrdDateTimePicker,
    GrdGroupBox,
    GrdInput,
    GrdSlider,
    GrdSpinner,
    GrdTimePicker,
    JsonPipe,
  ],
  template: `
    <grd-app-header
      productName="Numbers and dates"
      subtitle="spinner, slider, date, time and date-time pickers"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          A number is changed by the arrows, the keys Up and Down, or typed. A date or a time is
          typed through a mask or chosen in a panel: press the button at the end of the field.
        </p>

        <div class="boxes">
          <grd-group-box heading="An order" icon="grd:document">
            <grd-spinner label="Quantity" [min]="1" [max]="99" [(value)]="quantity" required />
            <grd-spinner
              label="Price"
              [step]="0.5"
              [decimals]="2"
              [min]="0"
              endText="EUR"
              buttons="sides"
              [(value)]="price"
            />
            <grd-slider
              label="Discount"
              [min]="0"
              [max]="50"
              [step]="5"
              showValue
              [valueText]="percent"
              [(value)]="discount"
            />
            <grd-input label="Total" endText="EUR" readonly [value]="total()" />
          </grd-group-box>

          <grd-group-box heading="Dates and times" icon="grd:calendar">
            <grd-date-picker label="Birthday" [max]="today" [(value)]="birthday" />
            <grd-date-picker
              label="Arrival"
              format="dd.MM.yyyy"
              ghost="dd.MM.yyyy"
              hint="From today, not on a weekend"
              [min]="today"
              [disabledDates]="isWeekend"
              [(value)]="arrival"
            />
            <grd-time-picker label="Alarm" [minuteStep]="15" ghost [(value)]="alarm" />
            <grd-date-time-picker label="Meeting" [(value)]="meeting" />
          </grd-group-box>
        </div>

        <div class="actions">
          <grd-button label="Fill in an example" variant="primary" (pressed)="example()" />
          <grd-button label="Check" icon="grd:check" (pressed)="check()" />
          <grd-button label="Clear" icon="grd:close" (pressed)="clear()" />
          <span aria-live="polite">{{ verdict() }}</span>
        </div>

        <grd-group-box heading="What the code gets">
          <pre class="values">{{ values() | json }}</pre>
        </grd-group-box>
      </div>
    </main>
  `,
})
export class App {
  // A spinner holds a number, or null while it is empty; a slider always holds a number.
  protected readonly quantity = signal<number | null>(1);
  protected readonly price = signal<number | null>(9.5);
  protected readonly discount = signal(0);
  // A picker holds an ISO text: 2026-10-28, 14:30, 2026-10-28T14:30; empty while nothing is chosen.
  protected readonly birthday = signal('');
  protected readonly arrival = signal('');
  protected readonly alarm = signal('');
  protected readonly meeting = signal('');
  protected readonly verdict = signal('');

  protected readonly today = TODAY;

  /** The text after the slider (and for a screen reader). */
  protected readonly percent = (value: number) => `${value} %`;

  /** Saturday and Sunday cannot be chosen. */
  protected readonly isWeekend = (date: string) =>
    [0, 6].includes(new Date(`${date}T00:00`).getDay());

  /** The total of the order, written with two decimals. */
  protected readonly total = computed(() => {
    const sum = (this.quantity() ?? 0) * (this.price() ?? 0) * (1 - this.discount() / 100);
    return sum.toFixed(2);
  });

  protected readonly values = computed(() => ({
    quantity: this.quantity(),
    price: this.price(),
    discount: this.discount(),
    birthday: this.birthday(),
    arrival: this.arrival(),
    alarm: this.alarm(),
    meeting: this.meeting(),
  }));

  private readonly spinners = viewChildren(GrdSpinner);
  private readonly datePickers = viewChildren(GrdDatePicker);
  private readonly timePickers = viewChildren(GrdTimePicker);
  private readonly dateTimePickers = viewChildren(GrdDateTimePicker);

  private fields() {
    return [
      ...this.spinners(),
      ...this.datePickers(),
      ...this.timePickers(),
      ...this.dateTimePickers(),
    ];
  }

  /** Values from the code are ISO texts and numbers, whatever the pattern of a field is. */
  protected example(): void {
    this.quantity.set(3);
    this.price.set(12.5);
    this.discount.set(10);
    this.birthday.set('1990-05-17');
    this.arrival.set(nextWorkday());
    this.alarm.set('06:45');
    this.meeting.set(`${TODAY}T14:30`);
  }

  /** Checks every field as if it had been left. */
  protected check(): void {
    for (const field of this.fields()) field.validate();
    const wrong = this.fields().filter((field) => field.invalid()).length;
    this.verdict.set(wrong === 0 ? 'Every value is right.' : `Fields to correct: ${wrong}`);
  }

  /** Empties every field; the slider goes back to 0. */
  protected clear(): void {
    this.quantity.set(null);
    this.price.set(null);
    this.discount.set(0);
    for (const value of [this.birthday, this.arrival, this.alarm, this.meeting]) value.set('');
    for (const field of this.fields()) field.reset();
    this.verdict.set('');
  }
}
