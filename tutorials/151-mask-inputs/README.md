# 151 – Mask inputs

This tutorial shows how to let the user type a value of a fixed shape, a phone number, a post code, an IBAN, a date, and have the field write the spaces and hyphens itself. You will learn how to:

- write a mask of digits, letters and literals (`grd-mask-input`, `mask="999 999 999"`);
- choose what the code gets: the typed characters or the text as it is shown (`valueMode`, `rawValue`, `maskedValue`, `complete`);
- show the shape before anything is typed (`ghost`, `slotChar`);
- check a whole value with a rule of the library (`iban`, `cardNumber`, `date`);
- make a slot of your own (`definitions`), and put a part of your own after the field (`grd-input-addon`).

A mask input is a text field of 150 with a mask: the label, the hint, the rules, the clear cross and Angular forms work as they do there. The tutorial is from the series about form controls (150–159); it is the application of 150 with another page.

```
npm run tutorial 151
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30151 and type `777123456` into **Phone**: the spaces come by themselves.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): the same `src/styles.scss`, a new `src/app/app.ts`.

### Step 1: a mask

A mask is a text of **slots** and **literals**. `9` is a slot for a digit, `a` for a letter, `A` for a letter made a capital, `*` for a letter or a digit; every other character is a literal that the field writes itself, just in front of the next character typed. The user may type the literals or leave them out:

```html
<grd-mask-input label="Post code" mask="999 99" ghost [(value)]="postCode" />
```

A character that no slot takes is dropped, and the model does not change because of it.

### Step 2: what the code gets

By default the model holds only the typed characters (`valueMode="raw"`): the phone `777 123 456` is `777123456`. The field also has signals for the other forms: `maskedValue()` is the text as it is shown, `complete()` says whether every slot is filled:

```html
<grd-mask-input
  #phoneField
  label="Phone"
  startText="+420"
  mask="999 999 999"
  ghost
  [(value)]="phone"
  required
/>
```

```ts
private readonly phoneField = viewChild.required<GrdMaskInput>('phoneField');
```

```ts
phoneAsShown: this.phoneField().maskedValue(),
phoneComplete: this.phoneField().complete(),
```

`valueMode="masked"` makes the model the text as it is shown. That is what the IBAN needs: the letters `CZ` are a literal of the mask, and the rule `iban` checks the whole text, the country with it:

```html
<grd-mask-input
  label="IBAN"
  mask="CZ99 9999 9999 9999 9999 9999"
  valueMode="masked"
  ghost
  [(value)]="iban"
  [validators]="['iban']"
/>
```

### Step 3: the shape before it is typed

`ghost` draws the rest of the mask behind the text, dimmed: `_` for every empty slot, another character (`ghost="#"`), or a text of your own as long as the mask (`ghost="YYYY-MM-DD"`). It stays in an empty field and goes away slot by slot. `slotChar` draws the whole mask in the value itself, only while the field has the focus or a value:

```html
<grd-mask-input label="Licence plate" mask="9AA 9999" slotChar="_" [(value)]="plate" />
```

### Step 4: rules of a whole value

A value with empty slots is not a whole value, and the field reports _Fill in the whole value_ when it is left (`allowIncomplete` turns that off, for a search by the start of a number). An empty field is the business of `required`. The rules of the library check the rest: the check digit of a card number, whether a date exists:

```html
<grd-mask-input
  label="Date"
  mask="9999-99-99"
  ghost="YYYY-MM-DD"
  valueMode="masked"
  [(value)]="date"
  [validators]="['date']"
/>
```

### Step 5: a slot of your own

`definitions` adds slots to `9`, `a`, `A` and `*`: a regular expression for one character, and `upper` or `lower` for its case. Here `h` takes a hexadecimal digit and writes it as a capital:

```ts
protected readonly hexDigits: GrdMaskDefinitions = { h: { pattern: '[0-9a-f]', upper: true } };
```

A `grd-input-addon` with `place="after"` is a small box of its own next to the field; here it shows the color:

```html
<grd-input-addon place="after">
  <span class="swatch" [style.background]="swatch()"></span>
</grd-input-addon>
```

### Step 6: values from the code

**Fill in an example** sets the signals. A value from the code may carry the literals or not (`11000` and `110 00` give the same post code on the screen), but the model keeps what the code set until the user types, so the example writes each value in the form of the mode of its field:

```ts
this.postCode.set('11000');
this.iban.set('CZ65 0800 0000 1920 0014 5399');
```

## Try it

1. **Type `777123456` into Phone.** The field shows `777 123 456`, and the box at the bottom has `"phone": "777123456"`, `"phoneAsShown": "777 123 456"` and `"phoneComplete": true`. Delete a digit: `phoneComplete` is `false`, and leaving the field reports _Fill in the whole value_.
2. **Type `1ab2345` into Licence plate.** The letters become capitals: `1AB 2345`. Letters where a digit belongs are dropped.
3. **Type `1e90ff` into Color.** The field shows `#1E90FF`, and the box next to it takes the color.
4. **Type a card number with a wrong last digit** (`4111111111111112`) and press Tab: _Invalid card number_. **Type `20260231` into Date**: there is no 31 February.
5. **Press Fill in an example, then Check.** _Every value is right._
6. **Press Clear, then Check.** Only Phone is required: _Fields to correct: 1_.

## The code

`src/app/app.ts`:

```ts
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
```

`src/styles.scss`, `src/app/app.config.ts` and `src/main.ts` are the ones of 150.

## How it fits together

- **The field compares, it does not guess.** After every change the field compares the text with the one before and works out what was typed and what was removed, so the keyboard, a paste, a selection typed over and the input of an IME work the same. The caret stays where the user types, also in the middle of the text.
- **Separators are optional.** A typed separator is a character that no slot takes, so it is dropped: `110 00` and `11000` give the same post code. A paste may carry the literals (`CZ65 0800 …`).
- **Raw or masked.** `raw` (the default) is the value for a database or an API that stores the digits; `masked` is the value for one that stores the text (the IBAN), or for a rule that checks the text as it is shown (the date). Both forms are always there as signals (`rawValue()`, `maskedValue()`).
- **It is a text field.** Everything of `grd-input` works: `startText`, `required`, `validators`, `clearable`, the message, `validate()` and `reset()`, and `ngModel` and `formControl` with the same rules on the control. The date pickers of 152 are mask inputs too.
- **`inputmode`**: a mask of digits only opens the numeric keyboard on a phone.

## What you get without writing any of it

- **The literals** written in front of the next character, and Backspace that removes the typed character next to a literal.
- **The ghost and the slots** drawn behind and in the text, in the font of the field, also when the font is not monospaced.
- **The rule of a whole value**, also an error of an Angular control (`errors.grd`).
- **The case** of a slot (`A`, `upper`), and the text normalized, so an emoji or a composed letter is one character.
- **The theme and the density**, as in 150.

## Build it from 150

The quick way: `npm run tutorial:eject 151 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand:

1. Make the application of 150 (see [Build it yourself from scratch](../150-text-fields/README.md#build-it-yourself-from-scratch)), or eject 150.
2. Replace `src/app/app.ts` with the code above.
3. Run it:

   ```
   ng serve
   ```
