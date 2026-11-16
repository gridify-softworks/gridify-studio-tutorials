import { JsonPipe } from '@angular/common';
import { Component, computed, signal, viewChild, viewChildren } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGroupBox,
  GrdInput,
  GrdInputButton,
  GrdPassword,
  type GrdPasswordPolicy,
  GrdTextarea,
  GrdValidators,
} from '@gridify/studio';

/** A rule of the application, written as a function: four capitals, a hyphen and four digits. */
const COUPON = GrdValidators.pattern(/^[A-Z]{4}-\d{4}$/, {
  message: 'Four capitals, a hyphen and four digits, such as SAVE-2026',
});

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdGroupBox,
    GrdInput,
    GrdInputButton,
    GrdPassword,
    GrdTextarea,
    JsonPipe,
  ],
  template: `
    <grd-app-header
      productName="Text fields"
      subtitle="input, password and text area"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          Type into the fields and leave them with Tab: a field checks its value when it is left,
          and then on every change. <b>Check</b> checks them all at once, <b>Clear</b> empties them.
        </p>

        <div class="boxes">
          <grd-group-box heading="Account" icon="grd:user">
            <grd-input label="Name" hint="As it stands on your ID" [(value)]="name" required />
            <grd-input
              label="E-mail"
              type="email"
              [(value)]="email"
              [validators]="['email']"
              required
              clearable
            />
            <grd-password
              label="Password"
              autocomplete="new-password"
              [(value)]="password"
              [policy]="policy"
              strength
              showRules
              required
            />
          </grd-group-box>

          <grd-group-box heading="Web and coupon" icon="grd:document">
            <grd-input
              label="Website"
              startText="https://"
              [(value)]="website"
              [validators]="['hostname']"
              clearable
            />
            <grd-input label="Coupon" [(value)]="coupon" [validators]="couponRules" joined>
              <grd-input-button place="after" (pressed)="generate()">Generate</grd-input-button>
            </grd-input>
            <grd-textarea
              label="Message"
              [hint]="message().length + ' of 200 characters'"
              [rows]="4"
              [maxlength]="200"
              [(value)]="message"
            />
          </grd-group-box>
        </div>

        <div class="actions">
          <grd-button label="Check" icon="grd:check" variant="primary" (pressed)="check()" />
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
  // Every field is a signal of the page, bound two-way with [(value)].
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly website = signal('');
  protected readonly coupon = signal('');
  protected readonly message = signal('');

  /** What the password has to contain: each requirement is a rule of the field and a line of its list. */
  protected readonly policy: GrdPasswordPolicy = { minLength: 8, upper: true, digit: true };
  protected readonly couponRules = [COUPON];
  protected readonly verdict = signal('');

  /** The values as the page would send them (the password only as dots). */
  protected readonly values = computed(() => ({
    name: this.name(),
    email: this.email(),
    password: '•'.repeat(this.password().length),
    website: this.website() ? `https://${this.website()}` : '',
    coupon: this.coupon(),
    message: this.message(),
  }));

  // The fields themselves, for validate() and reset().
  private readonly inputs = viewChildren(GrdInput);
  private readonly passwordField = viewChild.required(GrdPassword);
  private readonly messageField = viewChild.required(GrdTextarea);

  /** Checks every field as if it had been left, and counts those that report a problem. */
  protected check(): void {
    const fields = [...this.inputs(), this.passwordField(), this.messageField()];
    for (const field of fields) field.validate();
    const wrong = fields.filter((field) => field.invalid()).length;
    this.verdict.set(
      wrong === 0 ? 'Everything is filled in correctly.' : `Fields to correct: ${wrong}`,
    );
  }

  /** Empties the values, and makes the fields forget that they were checked. */
  protected clear(): void {
    const values = [this.name, this.email, this.password, this.website, this.coupon, this.message];
    for (const value of values) value.set('');
    for (const field of [...this.inputs(), this.passwordField(), this.messageField()]) {
      field.reset();
    }
    this.verdict.set('');
  }

  /** The button in the coupon field writes a new code. */
  protected generate(): void {
    const letters = Array.from({ length: 4 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join('');
    const digits = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.coupon.set(`${letters}-${digits}`);
  }
}
