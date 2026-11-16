# 152 – Numbers and dates

This tutorial shows how to let the user enter a number, a date and a time, and what the code gets from each field. You will learn how to:

- take a number with limits, a step and decimals, changed by the arrows, the keys and typing (`grd-spinner`);
- choose a number by dragging (`grd-slider`, `showValue`, `valueText`);
- take a date, typed or chosen in a calendar, with the earliest day and days that cannot be chosen (`grd-date-picker`, `min`, `max`, `disabledDates`);
- take a time and a date with a time (`grd-time-picker`, `minuteStep`, `grd-date-time-picker`);
- write the pattern of a date yourself (`format`), while the code always gets an ISO text (`2026-10-28`).

The pickers are the mask inputs of 151 with a panel, and the spinner is a text field of 150 that holds a number. The tutorial is from the series about form controls (150–159); it is the application of 150 with another page.

```
npm run tutorial 152
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30152, press the arrow up in **Quantity** a few times, and open the calendar of **Arrival** with the button at the end of the field.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): the same `src/styles.scss`, a new `src/app/app.ts`.

### Step 1: numbers

A spinner holds a `number`, or `null` while it is empty. `min` and `max` are the limits, `step` the size of a step, `decimals` the digits after the point; `buttons="sides"` puts a minus before the number and a plus after it instead of the arrows at the end:

```html
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
```

```ts
protected readonly quantity = signal<number | null>(1);
protected readonly price = signal<number | null>(9.5);
```

### Step 2: a slider

A slider always holds a number inside its limits, on the grid of its steps. `showValue` writes the number after the track, and `valueText` turns it into a text of your own (which a screen reader reads too):

```html
<grd-slider
  label="Discount"
  [min]="0"
  [max]="50"
  [step]="5"
  showValue
  [valueText]="percent"
  [(value)]="discount"
/>
```

```ts
protected readonly percent = (value: number) => `${value} %`;
```

The total is a `computed` of the three, shown in a field that cannot be typed into (`readonly`):

```html
<grd-input label="Total" endText="EUR" readonly [value]="total()" />
```

### Step 3: dates

A date picker holds an ISO date, `1990-05-17`, whatever the user sees. Without `format` the field writes the date the way the language of the application does (`05/17/1990` in English, `17.05.1990` in German); `format` sets a pattern of your own, and `ghost` shows it in the empty field. `min` and `max` are ISO dates, and `disabledDates` is a function that says which days cannot be chosen:

```html
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
```

```ts
const TODAY = grdFormatIsoDate(grdTodayDate());
```

```ts
protected readonly isWeekend = (date: string) =>
  [0, 6].includes(new Date(`${date}T00:00`).getDay());
```

The days outside the limits and the weekends are struck through in the calendar, and a date that is typed and cannot be chosen is reported when the field is left.

### Step 4: times

A time picker holds `HH:mm` (`HH:mm:ss` with `seconds`), a date-time picker `2026-10-28T14:30`. `minuteStep` is the step of the minutes in the panel:

```html
<grd-time-picker label="Alarm" [minuteStep]="15" ghost [(value)]="alarm" />
<grd-date-time-picker label="Meeting" [(value)]="meeting" />
```

### Step 5: values from the code

The code sets ISO texts and numbers, and every field shows them in its own pattern. `grdAddDays`, `grdWeekday` and `grdFormatIsoDate` of the library count with days without the time zones of `Date`:

```ts
function nextWorkday(): string {
  let day = grdAddDays(grdTodayDate(), 1);
  while ([0, 6].includes(grdWeekday(day))) day = grdAddDays(day, 1);
  return grdFormatIsoDate(day);
}
```

```ts
this.arrival.set(nextWorkday());
this.alarm.set('06:45');
this.meeting.set(`${TODAY}T14:30`);
```

## Try it

1. **Click into Quantity and press Up twice.** `3`. Press Down a few times: it stops at `1`, and the arrow down is greyed out.
2. **Type `12,345` into Price** and press Tab. A comma is a decimal point too, and the field takes two decimals: `12.34`. The total follows.
3. **Move the slider with the arrow keys.** The total follows it, `5 %` by `5 %`.
4. **Type `05171990` into Birthday.** The slashes come by themselves, `05/17/1990`, and the box at the bottom has `"birthday": "1990-05-17"`.
5. **Open the calendar of Arrival.** The days before today and the weekends are struck through. Type a Saturday instead: _This date is not available_.
6. **Press Fill in an example, then Check.** _Every value is right._
7. **Press Clear, then Check.** Quantity is required: _Fields to correct: 1_.

## The code

`src/app/app.ts`:

```ts
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
```

`src/styles.scss`, `src/app/app.config.ts` and `src/main.ts` are the ones of 150.

## How it fits together

- **The value has a type.** A spinner gives a `number` (or `null`), a slider a `number`, a picker an ISO text. An Angular form control holds the same, so `Validators.min` and `Validators.max` work on the number as they are.
- **Typing is brought to a good number.** The spinner accepts only what can be in a number, takes a point or a comma as the decimal separator, writes the number with the separator of the language, and brings a typed number inside the limits when the field is left. The wheel changes it only with `wheel`.
- **A picker is a mask input.** The pattern makes the mask: the separators are written by the field, `1.1.2000` can be typed as it is written (a part is padded with a zero), and a half-written date is not a value: the model keeps the digits and the field is invalid until the date is whole and real.
- **`min`, `max` and `disabledDates`** apply to the panel and to typing: what cannot be chosen in the calendar is reported when it is typed.
- **The language decides the look, not the value.** The names of the months and the days, the first day of the week and the pattern without `format` come from the language of the application; the value stays ISO.

## What you get without writing any of it

- **The keys**: Up and Down, Page Up and Page Down, Home and End in the spinner and the slider; the arrows, Page Up and Page Down and Enter in the calendar, the columns of the time panel.
- **The panels**: the calendar with its months and years, the time columns, the buttons Today and Now.
- **The rules**: the limits of a spinner, a whole date, a date that exists (no 31 February), a day that can be chosen.
- **Accessibility**: the spinner is a `spinbutton`, the slider a native range, the calendar a grid with the names of the days.
- **The theme and the density**, as in 150.

## Build it from 150

The quick way: `npm run tutorial:eject 152 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand:

1. Make the application of 150 (see [Build it yourself from scratch](../150-text-fields/README.md#build-it-yourself-from-scratch)), or eject 150.
2. Replace `src/app/app.ts` with the code above.
3. Run it:

   ```
   ng serve
   ```
