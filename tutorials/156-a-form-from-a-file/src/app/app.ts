import { JsonPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  GrdAppHeader,
  GrdButton,
  GrdCheckbox,
  GrdForm,
  GrdFormAreaTemplate,
  GrdGroupBox,
  GrdI18n,
  GrdInput,
  grdLoadFormLayout,
  GrdRadioGroup,
  type GrdRadioOption,
  GrdSwitch,
  GrdTextarea,
} from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdCheckbox,
    GrdForm,
    GrdFormAreaTemplate,
    GrdGroupBox,
    GrdInput,
    GrdRadioGroup,
    GrdSwitch,
    GrdTextarea,
    JsonPipe,
    ReactiveFormsModule,
  ],
  template: `
    <grd-app-header
      productName="A form from a file"
      subtitle="grd-form: a layout of the Form editor and Angular forms"
      icon="grd:logo"
      preferences="theme density language"
    />
    <main>
      <form class="page" [formGroup]="form" (ngSubmit)="save()">
        <p>
          {{
            i18n.text(
              'An order laid out by a file of the Form editor (forms/order.form.json). Make the window narrower or wider: from 560 px the labels stand beside the fields. What you type stays, also when the layout or the language changes.'
            )
          }}
        </p>

        <grd-switch
          [label]="i18n.text('A company')"
          [(checked)]="isCompany"
          [reserveMessageSpace]="false"
        />

        @if (failed()) {
          <p>{{ i18n.text('The layout could not be loaded.') }}</p>
        }

        <!-- The layout puts the controls into their places by the paths of the places; the controls are bound to the form as always. -->
        <grd-form
          [layout]="layout()"
          name="order"
          [layers]="{ subject: isCompany() ? 'company' : 'person' }"
          (variantChanged)="variant.set($event.minWidth)"
        >
          <ng-container formGroupName="person">
            <grd-input *grdFormArea="'name'" formControlName="name" required />
            <grd-input
              *grdFormArea="'email'"
              type="email"
              formControlName="email"
              [validators]="['email']"
            />
          </ng-container>
          <ng-container formGroupName="company">
            <grd-input *grdFormArea="'company'" formControlName="name" required />
            <grd-input *grdFormArea="'vatId'" formControlName="vatId" />
          </ng-container>
          <ng-container formGroupName="billing">
            <grd-input *grdFormArea="'billing.street'" formControlName="street" />
            <grd-input *grdFormArea="'billing.city'" formControlName="city" />
            <grd-input *grdFormArea="'billing.zip'" formControlName="zip" />
          </ng-container>
          <grd-radio-group
            *grdFormArea="'deliveryBy'"
            [options]="deliveries()"
            formControlName="deliveryBy"
          />
          <grd-checkbox
            *grdFormArea="'gift'"
            [label]="i18n.text('Wrap it as a gift')"
            formControlName="gift"
          />
          <grd-textarea *grdFormArea="'note'" fill formControlName="note" />
        </grd-form>

        <div class="actions">
          <grd-button
            type="submit"
            [label]="i18n.text('Save')"
            icon="grd:check"
            variant="primary"
          />
          <span aria-live="polite">{{ verdict() }}</span>
          <span>{{ i18n.text('Laid out by the variant from {px} px', { px: variant() }) }}</span>
        </div>

        <grd-group-box [heading]="i18n.text('What the code gets')">
          <pre class="values">{{
            saved() ? (saved() | json) : i18n.text('Nothing is saved yet.')
          }}</pre>
        </grd-group-box>
      </form>
    </main>
  `,
})
export class App {
  protected readonly i18n = inject(GrdI18n);
  private readonly fb = inject(NonNullableFormBuilder);

  /**
   * The form of the application: its groups are the application's own, not the layout's. The person and the company are two
   * groups (the layout shows one of them at a time), the billing address is the group of the subform billing.
   */
  protected readonly form = this.fb.group({
    person: this.fb.group({ name: '', email: '' }),
    company: this.fb.group({ name: '', vatId: '' }),
    billing: this.fb.group({ street: '', city: '', zip: '' }),
    deliveryBy: this.fb.control<string | null>('courier'),
    gift: false,
    note: '',
  });

  protected readonly isCompany = signal(false);
  protected readonly variant = signal(0);
  protected readonly verdict = signal('');
  protected readonly saved = signal<unknown>(null);
  protected readonly failed = signal(false);
  protected readonly deliveries = computed<GrdRadioOption[]>(() => [
    { value: 'courier', label: this.i18n.text('Courier') },
    { value: 'post', label: this.i18n.text('Post office') },
  ]);

  /** The file as it came from the assets; `null` until it is here. */
  private readonly file = signal<unknown>(null);

  /**
   * The layout. The texts of the file call t() (`{"$expr": "t('Full name')"}`), the translation of the library, which the loader makes while
   * it loads: in a computed the file is loaded again when the language changes, and the form keeps its fields and what is in them.
   */
  protected readonly layout = computed(() => {
    const file = this.file();
    return file === null ? null : grdLoadFormLayout(file).layout;
  });

  constructor() {
    fetch('forms/order.form.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((file: unknown) => this.file.set(file))
      .catch(() => this.failed.set(true));

    // The layer that is not shown keeps its fields, out of sight. Its group is disabled, so it is not checked and it is not in form.value.
    effect(() => {
      const { person, company } = this.form.controls;
      if (this.isCompany()) {
        company.enable();
        person.disable();
      } else {
        person.enable();
        company.disable();
      }
    });
  }

  /** Save: every field says what is wrong, and nothing is saved while the form is invalid. */
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.verdict.set(this.i18n.text('Correct the marked fields.'));
      return;
    }
    this.saved.set(this.form.value);
    this.verdict.set(this.i18n.text('Saved.'));
  }
}
