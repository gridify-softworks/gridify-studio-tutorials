# 153 – Choices

This tutorial shows how to let the user choose instead of type: one value or many, from a list, from a few buttons, or yes or no. You will learn how to:

- choose one value from a list (`grd-select`), with groups, a placeholder and a clear cross, and suggest texts while the user types (`grd-combobox`);
- choose many values (`grd-multi-select` with chips, a filter and Select all, and a list on its own, `grd-listbox`);
- choose one of a few (`grd-radio-group`, `grd-toggle-group`);
- say yes or no (`grd-checkbox`, `grd-switch`), and require a choice (`required`);
- give the options as data (`GrdOption`: a `value` for the code, a `label` for the user).

The select, the combo box and the multi-select are text fields of 150 with a list: the label, the hint, `required`, the message and Angular forms work as they do there. The tutorial is from the series about form controls (150–159); it is the application of 150 with another page.

```
npm run tutorial 153
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30153, choose a country, and type into **City**.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): the same `src/styles.scss`, a new `src/app/app.ts`.

### Step 1: options are data

An option has a `value`, which is what the code gets, and a `label`, which is what the user sees. `group` puts it under a heading, `description` adds a second line, `icon` an icon, and `disabled` takes it out of reach:

```ts
const COUNTRIES: GrdOption<string>[] = [
  { value: 'cz', label: 'Czechia', group: 'Europe' },
  { value: 'fr', label: 'France', group: 'Europe' },
```

### Step 2: one of a list

A select shows the label of the chosen option and holds its value, `null` while nothing is chosen. A letter typed on the closed field chooses the option that begins with it:

```html
<grd-select
  label="Country"
  placeholder="Choose a country"
  [options]="countries"
  [(value)]="country"
  required
  clearable
/>
```

```ts
protected readonly country = signal<string | null>(null);
```

A combo box is a text field with suggestions: the value is the text, a suggestion only writes it. The suggestions are narrowed by what is typed (anywhere in the text), and here they follow the country:

```html
<grd-combobox
  label="City"
  hint="Choose a suggestion or type your own"
  [options]="cities()"
  [(value)]="city"
  clearable
/>
```

```ts
protected readonly cities = computed(() => CITIES[this.country() ?? ''] ?? []);
```

### Step 3: many of a list

A multi-select holds an array of values, in the order they were chosen. `summary="chips"` shows them as chips with a cross, `filterable` lets the user type to narrow the list, `selectAll` adds a first row that chooses them all:

```html
<grd-multi-select
  label="Languages"
  placeholder="Choose"
  summary="chips"
  filterable
  selectAll
  [options]="languages"
  [(value)]="spoken"
/>
```

A list on its own (`grd-listbox`) only draws the options and says which one the user chose (`picked`); the page keeps what is chosen and gives it back with `selectedValues`. `multiple` draws a check box at every option:

```html
<grd-listbox
  ariaLabel="Activities"
  multiple
  [options]="activityOptions"
  [selectedValues]="activities()"
  (picked)="toggleActivity($event)"
/>
```

```ts
protected toggleActivity(option: GrdOption<string>): void {
  const value = option.value;
  this.activities.update((list) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
  );
}
```

### Step 4: one of a few

Radio buttons show all the options at once; the group holds the value of the chosen one, the label and one message for the whole group. A toggle group is a row of buttons of which one is pressed, here with emoji as icons:

```html
<grd-radio-group label="Room" [options]="rooms" [(value)]="room" required />
```

```html
<grd-toggle-group label="Transport" [options]="transports" [(value)]="transport" />
```

```ts
{ value: 'train', label: 'Train', icon: '🚆' },
```

### Step 5: yes or no

A check box and a switch hold `true` or `false` in `[(checked)]`. `required` on a check box means "has to be checked", the way terms are accepted:

```html
<grd-checkbox label="Breakfast" [(checked)]="breakfast" />
<grd-switch label="Send me offers" [(checked)]="offers" />
<grd-checkbox label="I accept the terms" [(checked)]="terms" required />
```

### Step 6: Book

**Book** checks the required choices the way 150 checks the fields: `validate()` on every control that has rules, then `invalid()`:

```ts
const controls = [...this.selects(), ...this.radios(), ...this.checkboxes()];
for (const control of controls) control.validate();
```

## Try it

1. **Press Book.** _Choices to make: 3_: the country, the room and the terms are required, and each says so.
2. **Open Country** with a click (or focus it and press a letter: `J` chooses Japan). The countries stand under Europe and Asia.
3. **Type `ky` into City.** _Tokyo_ and _Kyoto_ are suggested: the text is looked for anywhere in the names. Choose one with the arrows and Enter, or type a city that is not there (`Nara`): it is a value as well.
4. **Choose two languages.** They stand as chips in the field; the cross of a chip takes one away. Type into the field to narrow the list.
5. **Click Hiking and Food in Activities, then Hiking again.** The box at the bottom has `["food"]`.
6. **Choose a room, accept the terms and press Book.** _Booked. Have a nice trip!_
7. **Press Clear.** Everything is back at the start, and nothing reports a problem.

## The code

`src/app/app.ts`:

```ts
import { JsonPipe } from '@angular/common';
import { Component, computed, signal, viewChildren } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdCheckbox,
  GrdCombobox,
  GrdGroupBox,
  GrdLabel,
  GrdListbox,
  GrdMultiSelect,
  type GrdOption,
  GrdRadioGroup,
  type GrdRadioOption,
  GrdSelect,
  GrdSwitch,
  GrdToggleGroup,
  type GrdToggleOption,
} from '@gridify/studio';

/** The options of a select: a value for the code, a label for the user, and a group to stand under. */
const COUNTRIES: GrdOption<string>[] = [
  { value: 'cz', label: 'Czechia', group: 'Europe' },
  { value: 'fr', label: 'France', group: 'Europe' },
  { value: 'it', label: 'Italy', group: 'Europe' },
  { value: 'jp', label: 'Japan', group: 'Asia' },
  { value: 'kr', label: 'South Korea', group: 'Asia' },
];

/** The suggestions of the combo box, by the country. */
const CITIES: Record<string, string[]> = {
  cz: ['Prague', 'Brno', 'Český Krumlov', 'Olomouc'],
  fr: ['Paris', 'Lyon', 'Marseille', 'Nice'],
  it: ['Rome', 'Florence', 'Venice', 'Milan'],
  jp: ['Tokyo', 'Kyoto', 'Osaka', 'Sapporo'],
  kr: ['Seoul', 'Busan', 'Gyeongju'],
};

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdCheckbox,
    GrdCombobox,
    GrdGroupBox,
    GrdLabel,
    GrdListbox,
    GrdMultiSelect,
    GrdRadioGroup,
    GrdSelect,
    GrdSwitch,
    GrdToggleGroup,
    JsonPipe,
  ],
  template: `
    <grd-app-header
      productName="Choices"
      subtitle="select, combo box, multi-select, list, radio buttons, check boxes, switch"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          A trip in four boxes. Every control chooses from options that the code gives it, and the
          box at the bottom shows the values the code gets: the value of an option, not its label.
        </p>

        <div class="boxes">
          <grd-group-box heading="Where">
            <grd-select
              label="Country"
              placeholder="Choose a country"
              [options]="countries"
              [(value)]="country"
              required
              clearable
            />
            <grd-combobox
              label="City"
              hint="Choose a suggestion or type your own"
              [options]="cities()"
              [(value)]="city"
              clearable
            />
          </grd-group-box>

          <grd-group-box heading="How" gap="12px">
            <grd-toggle-group label="Transport" [options]="transports" [(value)]="transport" />
            <grd-multi-select
              label="Languages"
              placeholder="Choose"
              summary="chips"
              filterable
              selectAll
              [options]="languages"
              [(value)]="spoken"
            />
          </grd-group-box>

          <grd-group-box heading="Stay">
            <grd-radio-group label="Room" [options]="rooms" [(value)]="room" required />
            <grd-label>Activities</grd-label>
            <grd-listbox
              ariaLabel="Activities"
              multiple
              [options]="activityOptions"
              [selectedValues]="activities()"
              (picked)="toggleActivity($event)"
            />
          </grd-group-box>

          <grd-group-box heading="Last steps">
            <grd-checkbox label="Breakfast" [(checked)]="breakfast" />
            <grd-switch label="Send me offers" [(checked)]="offers" />
            <grd-checkbox label="I accept the terms" [(checked)]="terms" required />
          </grd-group-box>
        </div>

        <div class="actions">
          <grd-button label="Book" icon="grd:check" variant="primary" (pressed)="book()" />
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
  protected readonly countries = COUNTRIES;
  protected readonly transports: GrdToggleOption<string>[] = [
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'train', label: 'Train', icon: '🚆' },
    { value: 'plane', label: 'Plane', icon: '✈️' },
  ];
  protected readonly languages: GrdOption<string>[] = [
    { value: 'en', label: 'English' },
    { value: 'cs', label: 'Czech' },
    { value: 'fr', label: 'French' },
    { value: 'it', label: 'Italian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
  ];
  protected readonly rooms: GrdRadioOption[] = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'suite', label: 'Suite' },
  ];
  protected readonly activityOptions: GrdOption<string>[] = [
    { value: 'museums', label: 'Museums', description: 'Galleries and exhibitions' },
    { value: 'hiking', label: 'Hiking', description: 'A day in the hills' },
    { value: 'food', label: 'Food', description: 'Markets and a cooking class' },
  ];

  // The values: a select holds the value of an option (or null), a combo box a text,
  // a multi-select and a list an array, a check box and a switch true or false.
  protected readonly country = signal<string | null>(null);
  protected readonly city = signal('');
  protected readonly transport = signal<string | null>('train');
  protected readonly spoken = signal<readonly string[]>([]);
  protected readonly room = signal<string | null>(null);
  protected readonly activities = signal<string[]>([]);
  protected readonly breakfast = signal(false);
  protected readonly offers = signal(false);
  protected readonly terms = signal(false);
  protected readonly verdict = signal('');

  /** The suggestions follow the country. */
  protected readonly cities = computed(() => CITIES[this.country() ?? ''] ?? []);

  protected readonly values = computed(() => ({
    country: this.country(),
    city: this.city(),
    transport: this.transport(),
    languages: this.spoken(),
    room: this.room(),
    activities: this.activities(),
    breakfast: this.breakfast(),
    offers: this.offers(),
    terms: this.terms(),
  }));

  /** A list on its own does not keep the choice: the page adds or removes the value. */
  protected toggleActivity(option: GrdOption<string>): void {
    const value = option.value;
    this.activities.update((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    );
  }

  // The controls that have a rule here (required): select, radio group, check box.
  // The combo box and the multi-select have none, so there is nothing to check in them.
  private readonly selects = viewChildren(GrdSelect);
  private readonly radios = viewChildren(GrdRadioGroup);
  private readonly checkboxes = viewChildren(GrdCheckbox);

  /** Checks the required choices, as if each control had been left. */
  protected book(): void {
    const controls = [...this.selects(), ...this.radios(), ...this.checkboxes()];
    for (const control of controls) control.validate();
    const wrong = controls.filter((control) => control.invalid()).length;
    this.verdict.set(wrong === 0 ? 'Booked. Have a nice trip!' : `Choices to make: ${wrong}`);
  }

  /** Back to the start. */
  protected clear(): void {
    this.country.set(null);
    this.city.set('');
    this.transport.set('train');
    this.spoken.set([]);
    this.room.set(null);
    this.activities.set([]);
    for (const flag of [this.breakfast, this.offers, this.terms]) flag.set(false);
    for (const control of [...this.selects(), ...this.radios(), ...this.checkboxes()]) {
      control.reset();
    }
    this.verdict.set('');
  }
}
```

`src/styles.scss`, `src/app/app.config.ts` and `src/main.ts` are the ones of 150.

## How it fits together

- **The value of an option is yours.** The select, the multi-select, the radio group, the toggle group and the list hold the `value` of an option (here a code such as `jp`), never its label, so the labels can be translated and the code does not change. A value that is an object is compared by `compareWith`.
- **Select or combo box.** A select chooses only from the options, and nothing is typed. A combo box takes any text and only suggests; use it where the list cannot be complete (a city, a search). Both can take their options later from the server (`source`), with a loading line in the list.
- **The rules see a text.** `required` and `validators` of a select see the label of the chosen option, of a multi-select the labels joined by a comma (so `required` means "at least one"), of a radio group the chosen value, and of a check box `'true'` or `''`.
- **A list on its own keeps nothing.** `grd-listbox` is the list that the select opens, and on its own it only says what the user picked. That is why the page adds and removes the values itself.
- **Toggle group and radio buttons** choose one of a few in the same way. The toggle group is a row of buttons for a toolbar or a short choice; the radio group has a label, a message and `required`. A toggle group keeps no room for a message under it, so the box **How** sets a gap of its own (`gap="12px"`): the other boxes need none, because their fields keep that room and it parts them (150). A toggle group with `mode="multiple"` presses several buttons (`[(values)]`), like Bold and Italic.

## What you get without writing any of it

- **The keys**: a letter chooses in a closed select; the arrows, Home, End, Page Up and Page Down move in an open list; Enter and Space choose; Esc closes. The arrows move between the radio buttons and between the buttons of a toggle group.
- **One shape**: the open list of a select looks like one box with the field, in the color of the focus or of the validation.
- **The chips**: as many as fit the field, and one chip `+N` for the rest.
- **Accessibility**: the select and the combo box are `combobox`es, the lists `listbox`es with their options, the radio group a `radiogroup`, a pressed toggle button `aria-pressed`; one message for a whole group.
- **The theme and the density**, as in 150.

## Build it from 150

The quick way: `npm run tutorial:eject 153 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand:

1. Make the application of 150 (see [Build it yourself from scratch](../150-text-fields/README.md#build-it-yourself-from-scratch)), or eject 150.
2. Replace `src/app/app.ts` with the code above.
3. Run it:

   ```
   ng serve
   ```
