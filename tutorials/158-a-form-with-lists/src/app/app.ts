import { JsonPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  GrdAppHeader,
  GrdButton,
  GrdForm,
  GrdFormAreaTemplate,
  GrdGroupBox,
  GrdInput,
  GrdItemField,
  grdLoadFormLayout,
  GrdRepeater,
  GrdRepeaterItemTemplate,
  GrdSpinner,
  GrdTextarea,
} from '@gridify/studio';

/** A line of the order: the item of the repeated subform "line" of the file. */
interface Line {
  product: string;
  quantity: number | null;
}

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdForm,
    GrdFormAreaTemplate,
    GrdGroupBox,
    GrdInput,
    GrdItemField,
    GrdRepeater,
    GrdRepeaterItemTemplate,
    GrdSpinner,
    GrdTextarea,
    JsonPipe,
    ReactiveFormsModule,
  ],
  template: `
    <grd-app-header
      productName="A form with lists"
      subtitle="grd-repeater: the parts of a form that repeat, laid out by the Form editor"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <form class="page" [formGroup]="form" (ngSubmit)="save()">
        <p>
          An order with a list of phone numbers and a list of order lines, laid out by the file
          forms/order.form.json: every item is one instance of a repeated part of the file, on the
          cells of the part. Add and remove items, leave a field empty and press <b>Save</b>.
        </p>

        @if (failed()) {
          <p>The layout could not be loaded.</p>
        }

        <grd-form [layout]="layout()" name="order">
          <grd-input *grdFormArea="'customer'" formControlName="customer" required />

          <!-- The phones: a list of texts. The template of an item puts its controls into the places of one instance of the group "phones". -->
          <grd-repeater
            *grdFormArea="'phones'"
            #phones
            formControlName="phones"
            [newItem]="newPhone"
          >
            <ng-template grdRepeaterItem let-index="index" let-remove="remove">
              <grd-input
                *grdFormArea="'phone'"
                grdItemField
                type="tel"
                required
                [ariaLabel]="'Phone ' + (index + 1)"
              />
              <grd-button
                *grdFormArea="'removePhone'"
                icon="grd:close"
                iconOnly
                [label]="'Remove phone ' + (index + 1)"
                (pressed)="remove()"
              />
            </ng-template>
          </grd-repeater>
          <grd-button
            *grdFormArea="'addPhone'"
            icon="grd:plus"
            label="Add a phone"
            (pressed)="phoneList().add()"
          />

          <!-- The lines: a list of objects, an instance of the subform "line" each, at least one. -->
          <grd-repeater
            *grdFormArea="'lines'"
            #lines
            formControlName="lines"
            [newItem]="newLine"
            [min]="1"
          >
            <ng-template
              grdRepeaterItem
              let-index="index"
              let-remove="remove"
              let-canRemove="canRemove"
            >
              <grd-input
                *grdFormArea="'product'"
                grdItemField="product"
                required
                [ariaLabel]="'Product ' + (index + 1)"
              />
              <grd-spinner
                *grdFormArea="'quantity'"
                grdItemField="quantity"
                [min]="1"
                [ariaLabel]="'Quantity ' + (index + 1)"
              />
              <grd-button
                *grdFormArea="'removeLine'"
                icon="grd:close"
                iconOnly
                [label]="'Remove line ' + (index + 1)"
                [disabled]="!canRemove"
                (pressed)="remove()"
              />
            </ng-template>
          </grd-repeater>
          <grd-button
            *grdFormArea="'addLine'"
            icon="grd:plus"
            label="Add a line"
            (pressed)="lineList().add()"
          />

          <grd-textarea *grdFormArea="'note'" fill formControlName="note" />
        </grd-form>

        <div class="actions">
          <grd-button type="submit" label="Save" icon="grd:check" variant="primary" />
          <span aria-live="polite">{{ verdict() }}</span>
        </div>

        <grd-group-box heading="What the code gets">
          <pre class="values">{{ saved() ? (saved() | json) : 'Nothing is saved yet.' }}</pre>
        </grd-group-box>
      </form>
    </main>
  `,
})
export class App {
  private readonly fb = inject(NonNullableFormBuilder);

  /** The form of the application: each list is one control, whose value is the list. */
  protected readonly form = this.fb.group({
    customer: '',
    phones: this.fb.control<readonly string[]>(['']),
    lines: this.fb.control<readonly Line[]>([{ product: '', quantity: 1 }]),
    note: '',
  });

  /** The repeaters, for the buttons that add an item: they stand outside the lists. */
  protected readonly phoneList = viewChild.required<GrdRepeater<string>>('phones');
  protected readonly lineList = viewChild.required<GrdRepeater<Line>>('lines');
  /** What add() adds: an empty phone, a line of one piece. */
  protected readonly newPhone = (): string => '';
  protected readonly newLine = (): Line => ({ product: '', quantity: 1 });

  protected readonly verdict = signal('');
  protected readonly saved = signal<unknown>(null);
  protected readonly failed = signal(false);

  /** The file as it came from the assets; `null` until it is here. */
  private readonly file = signal<unknown>(null);
  protected readonly layout = computed(() => {
    const file = this.file();
    return file === null ? null : grdLoadFormLayout(file).layout;
  });

  constructor() {
    fetch('forms/order.form.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((file: unknown) => this.file.set(file))
      .catch(() => this.failed.set(true));
  }

  /** Save: every field says what is wrong (the fields of the items too), or the value is taken. */
  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.verdict.set('Correct the marked fields.');
      return;
    }
    this.saved.set(this.form.getRawValue());
    this.verdict.set('Saved.');
  }
}
