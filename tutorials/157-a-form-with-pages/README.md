# 157 – A form with pages

This tutorial shows how to lay a form out on the pages of a property sheet by a file of the Form editor: a customer card on three pages (a person, an address and notes), with its tabs on top in a narrow form and at the side in a wide one. The fields are the application's own and are bound to Angular forms as always; the file says where they stand and on which page. You will learn how to:

- make a property sheet in a file: a group with `"look": "property-sheet"` whose groups are its pages, one for each tab;
- say where the tabs stand in each variant (`"tabs": "start"` in the place of the sheet; `top` when the place says nothing, `bottom` and `end` are the other two);
- know and choose the page that is shown (`[(pages)]` of `<grd-form>`): the tab of the user, or a page that the application asks for;
- show the page with the first mistake on Save, while the fields of the other pages keep what is in them;
- set the space between the fields for the whole file (`"spacing": {"y": "100%"}`) as a share of the height of a control, which follows the density, so the message under a field has room in every density.

It goes deeper into 156 (a form from a file): it is the application of 156 with another page.

```
npm run tutorial 157
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30157, choose the tab Notes, press **Save** and make the window narrower than about 650 px.

## Step by step

The application of 156 (or one made by `npm run tutorial:eject 156 path/to/new-folder` in the root of the repository) without its texts: the same `src/styles.scss`, a new `src/app/app.ts`, `src/app/app.config.ts` without the dictionaries and the language (`provideGrdLanguage`), as in 150, and the file in `public/forms/customer.form.json`.

### Step 1: the sheet and its pages

The form `customer` has one element: the group `card` with `"look": "property-sheet"`, drawn as the tabs and the frame of a `grd-property-sheet`. Its elements are its pages, a group for each tab in the order of the tabs, and the title of a page is the text of its tab. The fields are in the pages:

<!-- prettier-ignore -->
```json
{
  "kind": "group",
  "name": "card",
  "title": "Customer card",
  "look": "property-sheet",
  "elements": [
    {
      "kind": "group",
      "name": "person",
      "title": "Person",
      "elements": [
        { "kind": "static", "name": "firstNameLabel", "text": "First name", "for": "firstName" },
        { "kind": "input", "name": "firstName" }
      ]
    },
    { "kind": "group", "name": "address", "title": "Address", "elements": [] },
    { "kind": "group", "name": "notes", "title": "Notes", "elements": [] }
  ]
}
```

The title of the sheet is not drawn: it is the name of its row of tabs for a screen reader. A sheet holds pages only (a field directly in a sheet is reported and left out); in a page stand labels, fields, group boxes and subforms, as in any group. The whole file is in `public/forms`, and the format is described in the README of the form layout in the library (`src/app/components/ui/form/README.md`).

### Step 2: the places of the pages

A page has a place in the cells of the sheet, as any element of a group, and the three pages share one: only one of them is shown at a time, so they may lie on the same cells. The tabs lie in the edge cells of the sheet, which the pages leave free: in the narrow variant (24 columns) the first two rows for the tabs on top, in the wide one (48 columns) the first four columns for the tabs at the start. The last row and the last column stay free for the frame:

<!-- prettier-ignore -->
```json
"places": {
  "card": { "col": 1, "row": 1, "colSpan": 48, "rowSpan": 11, "tabs": "start" },
  "person": { "col": 5, "row": 2, "colSpan": 43, "rowSpan": 9 },
  "address": { "col": 5, "row": 2, "colSpan": 43, "rowSpan": 9 },
  "notes": { "col": 5, "row": 2, "colSpan": 43, "rowSpan": 9 },
  "firstNameLabel": { "col": 1, "row": 1, "colSpan": 10, "rowSpan": 2, "justify": "end" },
  "firstName": { "col": 11, "row": 1, "colSpan": 32, "rowSpan": 2 }
}
```

The places of the fields are counted in the cells of their page: `firstName` stands in the first row of the page `person`, wherever the page lies.

### Step 3: the tabs

`tabs` in the place of the sheet says where its tabs stand in that variant: `top` (also when the place says nothing), `bottom`, `start` or `end`. The narrow variant (from 0 px) has them on top; the wide one (from 600 px) at the start, where a column of tabs leaves the fields the whole width beside it. The tabs are those of `grd-property-sheet`: the text of a tab at the side runs along the column, the tab that is shown is one stop of the Tab key, and the arrow keys (Down and Up in a column, Right and Left in a row), Home and End move between the pages.

### Step 4: the controls

The places are filled as in 156: `*grdFormArea` by the name of a field. A page is a group of the layout, not a subform, so the path of a field in it is its name (`'firstName'`, not `'person.firstName'`). The groups of the reactive form are the application's: a `formGroupName` for every page, so the value of the form is divided as the pages are:

<!-- prettier-ignore -->
```html
<grd-form [layout]="layout()" name="customer" [(pages)]="pages">
  <ng-container formGroupName="person">
    <grd-input *grdFormArea="'firstName'" formControlName="firstName" required />
    <grd-input *grdFormArea="'lastName'" formControlName="lastName" required />
  </ng-container>
  <ng-container formGroupName="notes">
    <grd-textarea *grdFormArea="'note'" fill formControlName="note" />
  </ng-container>
</grd-form>
```

The labels of the file name their fields, as in 156. The text area is as high as its place (`fill`, and `"align": "stretch"` in the file).

### Step 5: the page that is shown

`[(pages)]` is the page that each property sheet of the form shows, by the name of the sheet: `{ card: 'address' }`. A click on a tab writes it, and the application sets it to choose a page itself. A sheet that it does not name shows its first page that has a place in the variant:

```ts
protected readonly pages = signal<Record<string, string>>({});
protected readonly page = computed(() => this.pages()['card'] ?? PAGES[0]);
```

```html
<grd-button label="Show the address" (pressed)="pages.set({ card: 'address' })" />
```

The pages that are not shown stay, out of sight, with what was typed into them, and their controls are still a part of the form: unlike the layers of 156, nothing is disabled, so Save checks all the pages.

### Step 6: Save

Save marks every field, finds the first page whose group has a mistake, and shows it; the fields of that page say what is wrong:

```ts
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
```

### Step 7: the spacing

The file sets the vertical space between the fields of all its forms: `"spacing": { "y": "100%" }` is as high as a control. The message of a field stands under it (a line of text, the default of the library), over the page, so the next row has to stand a line of a message lower: in the densest density that is about three quarters of a control, in the others less. A share of the height grows and shrinks with the density, as the controls and their messages do; a number (`"y": 20`) is that many px in every density. The space across (`x`) is not given, so it is that of the density, and a form can have a `spacing` of its own, which wins key by key. Tutorial 156 puts its messages as badges on the corners of the fields, which need less room (`"75%"`).

## Try it

1. **Choose the tab Notes and press Save.** _Correct the marked fields._ The sheet shows the page Person (_Page: person_), and its first name, last name and e-mail are marked as required.
2. **Fill in the person and press Save again.** The page Address is shown now: its street and city are required.
3. **Type a street, choose the tab Person and press Show the address.** The application chooses the page, and the street is still there.
4. **Make the window narrower than about 650 px.** Under 600 px of the form the tabs stand on top and the labels above the fields; wider, the tabs are at the side and the labels beside the fields. The page that is shown stays, and so does what you typed.
5. **Click a tab and press the arrow keys.** The pages follow the keys (Down and Up at the side, Right and Left on top), and so does _Page:_.
6. **Fill in the address and press Save.** _Saved._ The box at the bottom has the value of the form: a group for every page.
7. **Choose a denser density in the header.** The fields are lower, the space between them shrinks with them (it is as high as a field), and the messages under the fields still have their room.

## The code

`src/app/app.ts`:

```ts
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
```

The rest of the component is in `src/app/app.ts`: the template with the places, the form, the layout and Save.
