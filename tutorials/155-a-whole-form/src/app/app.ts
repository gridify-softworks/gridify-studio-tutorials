import { JsonPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GrdAppHeader,
  GrdButton,
  GrdGroupBox,
  GrdInput,
  GrdMaskInput,
  type GrdOption,
  GrdPropertyPage,
  GrdPropertySheet,
  GrdRadioGroup,
  type GrdRadioOption,
  GrdSelect,
  GrdSwitch,
  GrdTextarea,
} from '@gridify/studio';

/** The pages of the sheet; each is a group of the form with the same name. */
type PageName = 'person' | 'address' | 'preferences';
const PAGES: PageName[] = ['person', 'address', 'preferences'];

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdGroupBox,
    GrdInput,
    GrdMaskInput,
    GrdPropertyPage,
    GrdPropertySheet,
    GrdRadioGroup,
    GrdSelect,
    GrdSwitch,
    GrdTextarea,
    JsonPipe,
    ReactiveFormsModule,
  ],
  template: `
    <grd-app-header
      productName="A whole form"
      subtitle="Angular forms, a property sheet, group boxes, Save and Reset"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <form class="page" [formGroup]="form" (ngSubmit)="save()">
        <p>
          A customer card on three pages. <b>Save</b> checks the whole form: the fields that are
          wrong say why, and the tab of every page with a mistake counts them.
        </p>

        <grd-property-sheet [(selected)]="page" ariaLabel="Customer card" equalHeight>
          <grd-property-page
            name="person"
            label="Person"
            icon="grd:user"
            [badge]="mistakesIn('person')"
          >
            <div class="boxes" formGroupName="person">
              <grd-group-box heading="Name">
                <grd-input label="First name" formControlName="firstName" required />
                <grd-input label="Last name" formControlName="lastName" required />
              </grd-group-box>
              <grd-group-box heading="Contact">
                <grd-input
                  label="E-mail"
                  type="email"
                  formControlName="email"
                  [validators]="['email']"
                  required
                />
                <grd-mask-input
                  label="Phone"
                  startText="+420"
                  mask="999 999 999"
                  ghost
                  formControlName="phone"
                />
              </grd-group-box>
            </div>
          </grd-property-page>

          <grd-property-page
            name="address"
            label="Address"
            icon="grd:document"
            [badge]="mistakesIn('address')"
          >
            <div class="boxes" formGroupName="address">
              <grd-group-box heading="Street and city">
                <grd-input label="Street" formControlName="street" required />
                <grd-input label="City" formControlName="city" required />
              </grd-group-box>
              <grd-group-box heading="Post code and country">
                <grd-mask-input label="Post code" mask="999 99" ghost formControlName="postCode" />
                <grd-select
                  label="Country"
                  placeholder="Choose"
                  [options]="countries"
                  formControlName="country"
                  required
                />
              </grd-group-box>
            </div>
          </grd-property-page>

          <grd-property-page
            name="preferences"
            label="Preferences"
            icon="grd:tool"
            [badge]="mistakesIn('preferences')"
          >
            <div class="boxes" formGroupName="preferences">
              <grd-group-box heading="How to reach the customer">
                <grd-radio-group
                  label="Preferred channel"
                  [options]="channels"
                  formControlName="channel"
                  required
                />
                <grd-switch label="Newsletter" formControlName="newsletter" />
              </grd-group-box>
              <grd-group-box heading="Notes">
                <grd-textarea label="Note" [rows]="5" formControlName="note" />
              </grd-group-box>
            </div>
          </grd-property-page>
        </grd-property-sheet>

        <div class="actions">
          <grd-button type="submit" label="Save" icon="grd:check" variant="primary" />
          <grd-button label="Fill in an example" (pressed)="example()" />
          <grd-button label="Reset" icon="grd:close" (pressed)="reset()" />
          <span aria-live="polite">{{ verdict() }}</span>
        </div>

        <grd-group-box heading="What the code gets">
          <pre class="values">{{ saved() ? (saved() | json) : 'Nothing saved yet.' }}</pre>
        </grd-group-box>
      </form>
    </main>
  `,
})
export class App {
  private readonly fb = inject(NonNullableFormBuilder);

  /**
   * The form. The rules are where they read best: most of them on the fields (required, the e-mail),
   * two as validators of Angular (the lengths of the last name and of the note). The field shows
   * both in the same way.
   */
  protected readonly form = this.fb.group({
    person: this.fb.group({
      firstName: '',
      lastName: ['', Validators.minLength(2)],
      email: '',
      phone: '',
    }),
    address: this.fb.group({
      street: '',
      city: '',
      postCode: '',
      country: this.fb.control<string | null>(null),
    }),
    preferences: this.fb.group({
      channel: this.fb.control<string | null>('email'),
      newsletter: false,
      note: ['', Validators.maxLength(200)],
    }),
  });

  protected readonly countries: GrdOption<string>[] = [
    { value: 'cz', label: 'Czechia' },
    { value: 'sk', label: 'Slovakia' },
    { value: 'at', label: 'Austria' },
    { value: 'de', label: 'Germany' },
  ];
  protected readonly channels: GrdRadioOption[] = [
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Phone' },
    { value: 'post', label: 'Post' },
  ];

  protected readonly page = signal<string | null>('person');
  protected readonly verdict = signal('');
  protected readonly saved = signal<unknown>(null);
  private readonly tried = signal(false);

  /** The status of the form as a signal, so the badges follow every change. */
  private readonly status = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  /** The number of fields of a page that are wrong, shown on its tab after the first Save. */
  protected mistakesIn(name: PageName): number | null {
    this.status();
    if (!this.tried()) return null;
    const controls = Object.values(this.form.controls[name].controls);
    return controls.filter((control) => control.invalid).length || null;
  }

  /** Save: every field reports (markAllAsTouched), and the first page with a mistake is shown. */
  protected save(): void {
    this.tried.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.page.set(PAGES.find((name) => this.form.controls[name].invalid) ?? 'person');
      this.verdict.set('Correct the marked fields.');
      return;
    }
    this.saved.set(this.form.getRawValue());
    this.verdict.set('Saved.');
  }

  /** The values of the start (those the form was made with), and no messages. */
  protected reset(): void {
    this.form.reset();
    this.tried.set(false);
    this.saved.set(null);
    this.verdict.set('');
    this.page.set('person');
  }

  protected example(): void {
    this.form.setValue({
      person: { firstName: 'Jana', lastName: 'Nováková', email: 'jana@example.com', phone: '' },
      address: { street: 'Vinohradská 12', city: 'Prague', postCode: '12000', country: 'cz' },
      preferences: { channel: 'email', newsletter: true, note: '' },
    });
  }
}
