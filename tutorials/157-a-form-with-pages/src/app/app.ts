import { JsonPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  GrdAppHeader,
  GrdButton,
  GrdCheckbox,
  GrdForm,
  GrdFormAreaTemplate,
  GrdGroupBox,
  GrdInput,
  grdLoadFormLayout,
  GrdTextarea,
} from '@gridify/studio';

/** The pages of the property sheet `card` of the file, in the order of its tabs; each is a group of the form with the same name. */
const PAGES = ['person', 'address', 'notes'] as const;

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
    GrdTextarea,
    JsonPipe,
    ReactiveFormsModule,
  ],
  template: `
    <grd-app-header
      productName="A form with pages"
      subtitle="grd-form: a property sheet of the Form editor, its tabs on top or at the side"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <form class="page" [formGroup]="form" (ngSubmit)="save()">
        <p>
          A customer card on three pages of a property sheet, laid out by the file
          forms/customer.form.json. Below 600 px the tabs stand on top, wider at the side. Press
          <b>Save</b> before you type: the page with the first mistake is shown.
        </p>

        @if (failed()) {
          <p>The layout could not be loaded.</p>
        }

        <!-- [(pages)] is the page that the sheet "card" shows: the user's tab, or the page that the application asks for. -->
        <grd-form [layout]="layout()" name="customer" [(pages)]="pages">
          <ng-container formGroupName="person">
            <grd-input *grdFormArea="'firstName'" formControlName="firstName" required />
            <grd-input *grdFormArea="'lastName'" formControlName="lastName" required />
            <grd-input
              *grdFormArea="'email'"
              type="email"
              formControlName="email"
              [validators]="['email']"
              required
            />
          </ng-container>
          <ng-container formGroupName="address">
            <grd-input *grdFormArea="'street'" formControlName="street" required />
            <grd-input *grdFormArea="'city'" formControlName="city" required />
            <grd-input *grdFormArea="'postcode'" formControlName="postcode" />
          </ng-container>
          <ng-container formGroupName="notes">
            <grd-textarea *grdFormArea="'note'" fill formControlName="note" />
            <grd-checkbox
              *grdFormArea="'newsletter'"
              label="Send me the newsletter"
              formControlName="newsletter"
            />
          </ng-container>
        </grd-form>

        <div class="actions">
          <grd-button type="submit" label="Save" icon="grd:check" variant="primary" />
          <grd-button label="Show the address" (pressed)="pages.set({ card: 'address' })" />
          <span aria-live="polite">{{ verdict() }}</span>
          <span>Page: {{ page() }}</span>
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

  /** The form of the application: a group for every page of the sheet, by the name of the page. */
  protected readonly form = this.fb.group({
    person: this.fb.group({ firstName: '', lastName: '', email: '' }),
    address: this.fb.group({ street: '', city: '', postcode: '' }),
    notes: this.fb.group({ note: '', newsletter: false }),
  });

  /** The page that each property sheet of the form shows, by the name of the sheet; a sheet it does not name shows its first page. */
  protected readonly pages = signal<Record<string, string>>({});
  protected readonly page = computed(() => this.pages()['card'] ?? PAGES[0]);
  protected readonly verdict = signal('');
  protected readonly saved = signal<unknown>(null);
  protected readonly failed = signal(false);

  /** The file as it came from the assets; `null` until it is here. */
  private readonly file = signal<unknown>(null);
  /** Its texts are plain texts, so the layout needs no functions (tutorial 156 translates them). */
  protected readonly layout = computed(() => {
    const file = this.file();
    return file === null ? null : grdLoadFormLayout(file).layout;
  });

  constructor() {
    fetch('forms/customer.form.json')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((file: unknown) => this.file.set(file))
      .catch(() => this.failed.set(true));
  }

  /** Save: every field says what is wrong, and the first page with a mistake is shown. */
  protected save(): void {
    this.form.markAllAsTouched();
    const wrong = PAGES.find((name) => this.form.controls[name].invalid);
    if (wrong) {
      this.pages.set({ card: wrong });
      this.verdict.set('Correct the marked fields.');
      return;
    }
    this.saved.set(this.form.getRawValue());
    this.verdict.set('Saved.');
  }
}
