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
