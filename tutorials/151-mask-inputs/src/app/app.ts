import { JsonPipe } from '@angular/common';
import { Component, computed, signal, viewChild, viewChildren } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdGroupBox,
  GrdInputAddon,
  type GrdMaskDefinitions,
  GrdMaskInput,
} from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdGroupBox, GrdInputAddon, GrdMaskInput, JsonPipe],
  template: `
    <grd-app-header
      productName="Mask inputs"
      subtitle="phone, post code, IBAN, card, date, your own slots"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          A mask shapes what is typed: <b>9</b> takes a digit, <b>A</b> a letter made a capital, and
          every other character of the mask is written by the field itself. Type only the digits and
          letters, the spaces and hyphens come by themselves.
        </p>

        <div class="boxes">
          <grd-group-box heading="Contact" icon="grd:user">
            <grd-mask-input
              #phoneField
              label="Phone"
              startText="+420"
              mask="999 999 999"
              ghost
              [(value)]="phone"
              required
            />
            <grd-mask-input label="Post code" mask="999 99" ghost [(value)]="postCode" />
          </grd-group-box>

          <grd-group-box heading="Payment" icon="grd:lock">
            <grd-mask-input
              label="IBAN"
              mask="CZ99 9999 9999 9999 9999 9999"
              valueMode="masked"
              ghost
              [(value)]="iban"
              [validators]="['iban']"
            />
            <grd-mask-input
              label="Card number"
              mask="9999 9999 9999 9999"
              ghost
              [(value)]="card"
              [validators]="['cardNumber']"
            />
          </grd-group-box>

          <grd-group-box heading="Masks of your own" icon="grd:tool">
            <grd-mask-input label="Licence plate" mask="9AA 9999" slotChar="_" [(value)]="plate" />
            <grd-mask-input
              label="Date"
              mask="9999-99-99"
              ghost="YYYY-MM-DD"
              valueMode="masked"
              [(value)]="date"
              [validators]="['date']"
            />
            <grd-mask-input
              label="Color"
              mask="#hhhhhh"
              [definitions]="hexDigits"
              valueMode="masked"
              ghost
              [(value)]="color"
            >
              <grd-input-addon place="after">
                <span class="swatch" [style.background]="swatch()"></span>
              </grd-input-addon>
            </grd-mask-input>
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
  styles: `
    .swatch {
      display: block;
      width: 1.2em;
      height: 1.2em;
      border: 1px solid var(--grd-border-color);
      border-radius: 3px;
    }
  `,
})
export class App {
  protected readonly phone = signal('');
  protected readonly postCode = signal('');
  protected readonly iban = signal('');
  protected readonly card = signal('');
  protected readonly plate = signal('');
  protected readonly date = signal('');
  protected readonly color = signal('');
  protected readonly verdict = signal('');

  /** A slot of your own: h takes a hexadecimal digit and writes it as a capital. */
  protected readonly hexDigits: GrdMaskDefinitions = { h: { pattern: '[0-9a-f]', upper: true } };

  /** The color of the swatch: only a whole color is drawn. */
  protected readonly swatch = computed(() => (this.color().length === 7 ? this.color() : ''));

  private readonly phoneField = viewChild.required<GrdMaskInput>('phoneField');
  private readonly fields = viewChildren(GrdMaskInput);

  /** The values as the code gets them: the typed characters (raw, the default) or the text as shown (masked). */
  protected readonly values = computed(() => ({
    phone: this.phone(),
    phoneAsShown: this.phoneField().maskedValue(),
    phoneComplete: this.phoneField().complete(),
    postCode: this.postCode(),
    iban: this.iban(),
    card: this.card(),
    plate: this.plate(),
    date: this.date(),
    color: this.color(),
  }));

  /** Values set from the code, in the form of the mode of each field: the characters (raw) or the text as shown (masked). */
  protected example(): void {
    this.phone.set('777123456');
    this.postCode.set('11000');
    this.iban.set('CZ65 0800 0000 1920 0014 5399');
    this.card.set('4111111111111111');
    this.plate.set('1AB2345');
    this.date.set('2026-10-28');
    this.color.set('#1E90FF');
  }

  /** Checks every field as if it had been left. */
  protected check(): void {
    for (const field of this.fields()) field.validate();
    const wrong = this.fields().filter((field) => field.invalid()).length;
    this.verdict.set(wrong === 0 ? 'Every value is right.' : `Fields to correct: ${wrong}`);
  }

  /** Empties every field. */
  protected clear(): void {
    const values = [this.phone, this.postCode, this.iban, this.card, this.plate, this.date];
    for (const value of [...values, this.color]) value.set('');
    for (const field of this.fields()) field.reset();
    this.verdict.set('');
  }
}
