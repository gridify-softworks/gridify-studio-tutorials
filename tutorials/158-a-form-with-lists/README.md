# 158 – A form with lists

This tutorial shows how to lay out the parts of a form that repeat, by a file of the Form editor and with `grd-repeater`: an order with a list of phone numbers and a list of order lines, as many as the user adds. Every item is one instance of a repeated part of the file, on the cells of the part, and its controls are bound to the item. You will learn how to:

- make a part of a file repeat: a group or a subform with `"repeat": true`, whose cells are the cells of one instance;
- put a repeater (`grd-repeater`) into the place of the part and the controls of one item into the places of an instance (`<ng-template grdRepeaterItem>`, `*grdFormArea`);
- bind a control to the item (`grdItemField`: a list of texts) or to a property of it (`grdItemField="product"`: a list of objects);
- add and remove items with buttons of your own (`add()`, `remove()`, `canRemove`), keep at least one item (`min`), and see the focus move with the items;
- use a list as one control of a reactive form, whose Save shows the mistakes of every item.

It goes deeper into 157 (a form with pages): it is the application of 157 with another page.

```
npm run tutorial 158
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30158, press **Add a phone** and **Add a line**, leave a product empty and press **Save**.

## Step by step

The application of 157 (or one made by `npm run tutorial:eject 157 path/to/new-folder` in the root of the repository): the same `src/styles.scss` and `src/app/app.config.ts`, a new `src/app/app.ts` and the file in `public/forms/order.form.json`.

### Step 1: the parts that repeat

The phones are a group without a frame that repeats: its cells hold one phone, a field and a button that removes it. The lines are another form of the file, `line`, placed as a subform that repeats in a group box, under two captions:

<!-- prettier-ignore -->
```json
{ "kind": "group", "name": "phones", "title": "Phones", "look": "none", "repeat": true,
  "elements": [{ "kind": "input", "name": "phone" }, { "kind": "input", "name": "removePhone" }] },
{ "kind": "input", "name": "addPhone" },
{ "kind": "group", "name": "linesBox", "title": "Order lines",
  "elements": [
    { "kind": "static", "name": "productCaption", "text": "Product", "appearance": "caption" },
    { "kind": "static", "name": "quantityCaption", "text": "Quantity", "appearance": "caption" },
    { "kind": "subform", "name": "lines", "form": "line", "repeat": true },
    { "kind": "input", "name": "addLine" }
  ] }
```

The place of a repeated part holds one instance: the phones take two rows, a line takes the two rows of the form `line`. Every other instance takes as many rows again, under the one before it: the rows are added under the place across the whole form, so the button under the phones moves down, and the group box of the lines grows with them. Nothing stands beside a part that grows lower than its last row (the label Phones stands beside the first phone).

The buttons that add are inputs of the layout under the lists, and the buttons that remove are inputs of the parts, so every instance has its own. The file also shows the messages as badges on the corners of the fields, with room above them (`defaults` and `spacing`, as in 156).

### Step 2: the repeater

`grd-repeater` is the control of the place of the part. The template of an item (`<ng-template grdRepeaterItem>`) is drawn once for every item, and its controls go into the places of that instance by `*grdFormArea`, by their paths counted from the instance (`phone`, not `phones.phone`):

<!-- prettier-ignore -->
```html
<grd-repeater *grdFormArea="'phones'" #phones formControlName="phones" [newItem]="newPhone">
  <ng-template grdRepeaterItem let-index="index" let-remove="remove">
    <grd-input *grdFormArea="'phone'" grdItemField type="tel" required [ariaLabel]="'Phone ' + (index + 1)" />
    <grd-button *grdFormArea="'removePhone'" icon="grd:close" iconOnly [label]="'Remove phone ' + (index + 1)" (pressed)="remove()" />
  </ng-template>
</grd-repeater>
```

Every instance has places of its own, with ids of their own, so the controls of two phones never share an id. The repeater draws no buttons: `remove()` of the context removes the item of the instance it is called in.

### Step 3: the controls of an item

`grdItemField` binds a control to its item. A phone is a text, so the field is bound to the item itself; a line is an object, so its fields are bound to its properties:

<!-- prettier-ignore -->
```html
<grd-input *grdFormArea="'product'" grdItemField="product" required [ariaLabel]="'Product ' + (index + 1)" />
<grd-spinner *grdFormArea="'quantity'" grdItemField="quantity" [min]="1" [ariaLabel]="'Quantity ' + (index + 1)" />
```

A change is a new item in a new list (`[{ product: 'Tea', quantity: 2 }]`): the list and its items are never changed in place. The rules of the fields (`required`) work as always.

### Step 4: adding and removing

`newItem` makes an item that is added, and `min` keeps at least one line: `canRemove` of the context is `false` while there is only one, and the button that removes it is disabled. The buttons that add stand outside the lists, so they reach the repeaters by queries of the page (the form draws them, and the queries still find them):

```ts
protected readonly phoneList = viewChild.required<GrdRepeater<string>>('phones');
protected readonly newPhone = (): string => '';
protected readonly newLine = (): Line => ({ product: '', quantity: 1 });
```

```html
<grd-button
  *grdFormArea="'addPhone'"
  icon="grd:plus"
  label="Add a phone"
  (pressed)="phoneList().add()"
/>
```

`add()` puts the focus into the new item. `remove()` puts it to the same control of the item that takes the place of the removed one, so a user of the keyboard who removes with Enter stays on the buttons that remove.

### Step 5: the lists in the form

Each list is one control of the reactive form, whose value is the list:

```ts
protected readonly form = this.fb.group({
  customer: '',
  phones: this.fb.control<readonly string[]>(['']),
  lines: this.fb.control<readonly Line[]>([{ product: '', quantity: 1 }]),
  note: '',
});
```

The control of a list is valid while the fields of all its items are (otherwise its error is `grdItems`). Save touches the form (`markAllAsTouched()`), which makes the fields of every item show what is wrong, and every submit does it again, also for the items added since.

## Try it

1. **Press Save at once.** _Correct the marked fields._ The customer, the empty phone and the empty product are marked.
2. **Press Add a phone.** A second phone appears under the first, with its own button that removes it, and the focus is in it: type a number. The button Add a phone moves down with the list.
3. **Press Add a line twice.** The group box Order lines grows with the lines.
4. **Tab to the button that removes the first phone and press Enter.** The first phone goes, and the focus is on the same button of the phone that took its place.
5. **Remove lines until one is left.** Its button that removes it is disabled: the list keeps at least one line.
6. **Fill in everything and press Save.** _Saved._ The box at the bottom has the value of the form: the lists as lists, the lines as objects.
7. **Make the window narrower than about 650 px.** The labels stand above the fields, and every phone and every line takes the narrow variant of its part, with the values in it.

## The code

`src/app/app.ts`:

```ts
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
```

The rest of the component is in `src/app/app.ts`: the template with the places and the repeaters, the form, the layout and Save.
