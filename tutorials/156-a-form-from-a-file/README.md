# 156 – A form from a file

This tutorial shows how to lay a form out by a file of the Form editor: an order whose labels, fields and group stand where the file says, in two variants for two ranges of widths. The fields are the application's own and are bound to Angular forms as always; the file only says where they stand. You will learn how to:

- fetch the file from the assets and load it with `grdLoadFormLayout`, which translates its texts (`{"$expr": "t('Full name')"}`) with the translation of the library;
- lay a form of the file out with `<grd-form>` and put the controls into its places by their paths (`*grdFormArea="'billing.street'"`);
- bind the controls to a reactive form whose groups are the application's own (`formGroupName` around the places of a subform);
- show one layer of a group at a time (a person or a company, in the same cells) and keep the hidden layer out of the form (`disable()`);
- give the fields of the file their defaults (the message of a field as a badge on its top right corner) and the room for it (`spacing`);
- see the form change its variant with its width, and its texts with the language, while the fields keep what is in them.

It goes deeper into 155 (a whole form): it is the application of 150 with another page.

```
npm run tutorial 156
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30156, type your name and make the window narrower than about 600 px.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): `src/styles.scss` with a narrower page (`max-width: 56em`), without `.boxes` and with a wider gap in `.actions` (`8px 16px`), a new `src/app/app.ts`, the texts in `src/app/texts.ts`, `src/app/app.config.ts` that registers them (step 6) and the file in `public/forms/order.form.json`.

### Step 1: the file

The file is what the Form editor writes (`"format": "grd-form-layout"`). A form has its elements once (the labels, the places of the fields, a group, a subform) and the variants of the widths, each with the places of the elements on a grid of cells. The form `order` has a variant from 0 px with the labels above the fields and one from 560 px with the labels beside them; the billing address is the form `address` of the same file, placed as a subform that adds the rows it needs (`"flow": true`):

<!-- prettier-ignore -->
```json
{
  "format": "grd-form-layout",
  "version": 1,
  "spacing": { "y": "75%" },
  "defaults": { "message": "top right badge -9 -6" },
  "forms": [
    {
      "name": "order",
      "layers": [{ "name": "subject", "layers": ["person", "company"] }],
      "elements": [
        { "kind": "static", "name": "nameLabel", "text": { "$expr": "t('Full name')" }, "for": "name", "layer": "person" },
        { "kind": "input", "name": "name", "layer": "person" },
        { "kind": "subform", "name": "billing", "form": "address" }
      ],
      "variants": [
        {
          "minWidth": 0,
          "cols": 24,
          "rows": 24,
          "places": {
            "nameLabel": { "col": 1, "row": 1, "colSpan": 24 },
            "name": { "col": 1, "row": 2, "colSpan": 24, "rowSpan": 2 },
            "billing": { "col": 1, "row": 7, "colSpan": 24, "flow": true }
          }
        }
      ]
    }
  ]
}
```

Two keys of the file are for all its forms. `defaults` are the defaults of the fields in the places: `"message": "top right badge -9 -6"` shows the message of a field as a badge on its top right corner, 9 px down into the field and 6 px in from the corner (the words and the numbers are those of `message` of every field of the library). `spacing` is the space between the elements, and the badge needs room above its field: `"y": "75%"` is three quarters of the height of a control, so the room grows and shrinks with the density, as the controls do.

The whole file is in `public/forms`, so the application gets it from its own address. The format is described in the README of the form layout in the library (`src/app/components/ui/form/README.md`).

### Step 2: loading it

The file is fetched once. `grdLoadFormLayout` checks it and gives the layout that `<grd-form>` takes. The texts of the file call `t()`, the translation of the library (as `tr`, `tx` and `tk` do; an application with a translation of its own gives it in `functions`), which the loader makes for every text while it loads, so in a `computed` the file is loaded again when the language changes:

```ts
private readonly file = signal<unknown>(null);

protected readonly layout = computed(() => {
  const file = this.file();
  return file === null ? null : grdLoadFormLayout(file).layout;
});
```

```ts
fetch('forms/order.form.json')
  .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
  .then((file: unknown) => this.file.set(file))
  .catch(() => this.failed.set(true));
```

What breaks a rule of the format is written to the console (and is in `problems` of the result), and the rest of the file is still laid out.

### Step 3: the places

`<grd-form>` lays out the form `name` in the variant of its width. Every control is the application's: `*grdFormArea` puts it into the place with that path, and the form keeps it there in every variant, so it is never made again:

<!-- prettier-ignore -->
```html
<grd-form [layout]="layout()" name="order" [layers]="{ subject: isCompany() ? 'company' : 'person' }" (variantChanged)="variant.set($event.minWidth)">
  <ng-container formGroupName="person">
    <grd-input *grdFormArea="'name'" formControlName="name" required />
  </ng-container>
  <grd-textarea *grdFormArea="'note'" fill formControlName="note" />
</grd-form>
```

The labels of the file name their fields (a click on the label focuses the field), and a field takes the id of its place by itself. `fill` makes the text area as high as its place, which is several rows high in the file.

### Step 4: the groups of the form

The form is the application's, with groups of its own. A `formGroupName` around a `*grdFormArea` is the group of its control, so the fields of the subform `billing` (the places `billing.street`, `billing.city`, `billing.zip`) go into the group `billing`:

<!-- prettier-ignore -->
```html
<ng-container formGroupName="billing">
  <grd-input *grdFormArea="'billing.street'" formControlName="street" />
  <grd-input *grdFormArea="'billing.city'" formControlName="city" />
  <grd-input *grdFormArea="'billing.zip'" formControlName="zip" />
</ng-container>
```

### Step 5: layers

The person and the company are two layers of the group `subject`: they lie in the same cells, and `[layers]` says which one is shown. The fields of the other layer stay, out of sight, with what was typed into them. Their group is disabled, so it is not checked and it is not in `form.value`:

```ts
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
```

### Step 6: the variant and the language

`(variantChanged)` tells the `minWidth` of the variant that is laid out, at the start and every time the width takes the form into another one. The texts of the file are translated by `t()` with the dictionaries of the application (`src/app/texts.ts`), registered at the start; the language select of the header changes the language, the file is loaded again, and the fields keep their values.

`src/app/app.config.ts` registers the dictionaries once and keeps the language that the user chooses:

```ts
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { DE, JA } from './texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses in the header is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-156-language' }),
    // The texts of the application and those of the file (t('Full name')), once at the start. English is the key.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('de', DE);
      i18n.register('ja', JA);
    }),
  ],
};
```

## Try it

1. **Type `Jane Doe` into Full name and make the window narrow.** Under 560 px of the form the labels stand above the fields; wider, beside them. The name stays, and so does the focus when the field has it.
2. **Switch A company on.** Company name and VAT number stand where the name and the e-mail were. Switch it off: the name is still there.
3. **Press Save with the company switched on and no company name.** _Correct the marked fields._ The message is a badge on the top right corner of Company name, and only the shown layer is checked.
4. **Fill in the company and press Save.** The box at the bottom has the value of the form: the company and no person (its group is disabled).
5. **Choose Deutsch in the header.** The labels are German, the title of the group is _Lieferung_, and everything you typed is still there.
6. **Click the label Delivery by.** The radio button of the courier gets the focus.
7. **Type `abc` into E-mail address, leave the field and choose a denser density in the header.** The badge of the e-mail stands on the corner of the field, and the rows come closer together with the controls while the badge keeps its room.

## The code

`src/app/app.ts`:

```ts
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
```

The rest of the component is in `src/app/app.ts`: the template with the places, the form, the layout and Save.
