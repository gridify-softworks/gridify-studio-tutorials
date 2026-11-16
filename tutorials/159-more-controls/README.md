# 159 – More controls

This tutorial shows the controls that the series 150–158 has not shown yet, in a docking application: the card of a product of a coffee shop, with a form on the left and a preview on the right that follows it at once. You will learn how to:

- type several short texts into one field (`grd-tags`);
- use chips as toggles, and as tags that can be removed (`grd-chip`, `[checked]`, `(checkedChange)`, `removable`, `(removed)`);
- choose a color (`grd-color-picker`), and write on it in black or white, whichever reads better (`grdReadableOn`);
- move items between two lists (`grd-transfer-list`);
- show pictures with a strip of small ones and a lightbox (`grd-picture-gallery`);
- frame the preview as a card, with a status as a badge (`grd-card`, `grd-badge`).

It ends the series about form controls (150–159). The controls of 150–158 stand on a page in group boxes; here the form is a document of a docking application, as in 102.

```
npm run tutorial 159
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30159 and change the form: the preview on the right follows.

## The words first

- **A tag** is a short text of a list (a keyword); `grd-tags` is a field whose value is the list of them.
- **A chip** is a small rounded label. A chip with `checked` is a toggle (a button that stays pressed); a chip that is `removable` has a cross.
- **A transfer list** is two lists side by side: the items that are available, and the items that are chosen. Its value is the list of the chosen values.
- **One store, two views**: the form and the preview are two tabs, and both have the same `ProductStore`, a signal for every field. The form writes into the signals, and the preview reads them.

## Step by step

### Step 1: the product

`src/app/product.ts`:

```ts
import { Injectable, signal } from '@angular/core';
import type { GrdOption, GrdPictureGalleryItem } from '@gridify/studio';

/** The sizes of a bag, in the order the form shows them. */
export const SIZES = ['250 g', '500 g', '1 kg'];

/** The shops: the options of the transfer list (the value is kept, the label is shown). */
export const SHOPS: GrdOption<string>[] = [
  { value: 'old-town', label: 'Old Town' },
  { value: 'riverside', label: 'Riverside' },
  { value: 'station', label: 'Main Station' },
  { value: 'airport', label: 'Airport' },
  { value: 'vinohrady', label: 'Vinohrady' },
  { value: 'online', label: 'Online shop' },
];

/** The pictures of the product, from the folder public/pictures. */
export const PICTURES: GrdPictureGalleryItem[] = [
  { src: 'pictures/bag.svg', title: 'The bag', caption: 'Ethiopia Yirgacheffe, light roast' },
  { src: 'pictures/beans.svg', title: 'The beans', caption: 'Roasted every Monday' },
  { src: 'pictures/cup.svg', title: 'In the cup', caption: 'Notes of jasmine and lemon' },
];

/** The product that the form changes and the preview shows: a signal for each field. */
@Injectable({ providedIn: 'root' })
export class ProductStore {
  readonly name = signal('Ethiopia Yirgacheffe');
  readonly tags = signal<readonly string[]>(['single origin', 'light roast']);
  readonly sizes = signal<readonly string[]>(['250 g']);
  readonly color = signal('#c2410c');
  readonly shops = signal<readonly string[]>(['old-town', 'online']);
}
```

- **`ProductStore`** has a signal for each field; `[(value)]="product.name"` binds a control to one.
- **`SHOPS`** are the options of the transfer list (`GrdOption`: the `value` is kept, the `label` is shown).
- **`PICTURES`** are the pictures of the gallery: `src`, a `title` above the picture and a `caption` under it. They are SVG files in `public/pictures`.

### Step 2: the form

`src/app/product-form.ts` is the document:

```ts
import { Component, inject } from '@angular/core';
import {
  GrdChip,
  GrdColorPicker,
  GrdGroupBox,
  GrdInput,
  GrdLabel,
  GrdTags,
  GrdTransferList,
} from '@gridify/studio';
import { ProductStore, SHOPS, SIZES } from './product';

/** A document: the form of the product. Every control writes into a signal of the ProductStore. */
@Component({
  selector: 'app-product-form',
  imports: [GrdChip, GrdColorPicker, GrdGroupBox, GrdInput, GrdLabel, GrdTags, GrdTransferList],
  template: `
    <grd-group-box heading="The product">
      <grd-input label="Name" [(value)]="product.name" required />

      <!-- Tags: Enter or a comma makes a tag of what was typed; the value is a list of texts. -->
      <grd-tags
        label="Tags"
        hint="Enter or a comma adds a tag"
        [maxTags]="5"
        [(value)]="product.tags"
      />

      <!-- Chips as toggles: [checked] shows the state, (checkedChange) says that one was pressed. -->
      <grd-label>Sizes</grd-label>
      <div class="sizes" role="group" aria-label="Sizes">
        @for (size of sizes; track size) {
          <grd-chip
            shape="pill"
            [checked]="product.sizes().includes(size)"
            (checkedChange)="toggleSize(size, $event)"
            >{{ size }}</grd-chip
          >
        }
      </div>

      <!-- A color: the value is a hex text (#c2410c). Without opacity, as a label is printed. -->
      <grd-color-picker label="Color of the label" [alpha]="false" [(value)]="product.color" />
    </grd-group-box>

    <grd-group-box heading="Where it is sold">
      <!-- Two lists: the value is the list of the chosen values. -->
      <grd-transfer-list
        [options]="shops"
        availableTitle="Other shops"
        chosenTitle="Sells it"
        [(value)]="product.shops"
      />
    </grd-group-box>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
      overflow: auto;
      padding: 16px;
      box-sizing: border-box;
    }
    .sizes {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
  `,
})
export class ProductForm {
  protected readonly product = inject(ProductStore);
  protected readonly sizes = SIZES;
  protected readonly shops = SHOPS;

  /** A size chip was pressed: the size is added or taken away (in the order of SIZES). */
  protected toggleSize(size: string, on: boolean): void {
    this.product.sizes.update((chosen) =>
      SIZES.filter((other) => (other === size ? on : chosen.includes(other))),
    );
  }
}
```

- **`grd-tags`**: Enter, a comma, or leaving the field makes a tag of what was typed; the cross of a tag, or Backspace in the empty field, removes one. `maxTags` is the limit: a tag over it is refused, and the reason stands where the hint was.
- **The size chips** are toggles: `[checked]` says whether the size is chosen, and `(checkedChange)` gives the new state when the user presses one. The chip does not change by itself: `toggleSize` changes the signal, and the chip shows it.
- **`grd-color-picker`** opens a panel with a palette and a field for a color of your own (`#7c3aed`, `rgb(...)`); the value is a hex text. `[alpha]="false"` leaves out the opacity.
- **`grd-transfer-list`**: a double click, the buttons between the lists, the keys or dragging move the items. `availableTitle` and `chosenTitle` are the titles of the lists, and are in the names of the buttons too.

### Step 3: the preview

`src/app/preview-tool.ts` is the tool:

```ts
import { Component, computed, inject } from '@angular/core';
import { GrdBadge, GrdCard, GrdChip, GrdPictureGallery, grdReadableOn } from '@gridify/studio';
import { PICTURES, ProductStore } from './product';

/** A tool: the card of the product as the shop shows it. It follows the form at once. */
@Component({
  selector: 'app-preview-tool',
  imports: [GrdBadge, GrdCard, GrdChip, GrdPictureGallery],
  template: `
    <grd-card [heading]="product.name() || 'A product without a name'" [description]="sizesText()">
      <!-- The pictures: arrows, a strip of small pictures, and a click shows them large.
           loading="eager": the gallery is seen at once, so its pictures are fetched at once. -->
      <grd-picture-gallery [items]="pictures" [height]="180" fit="cover" loading="eager" />

      <!-- The label in the chosen color, with a text that reads well on it. -->
      <div class="label" [style.background]="product.color()" [style.color]="textColor()">
        {{ product.name() }}
      </div>

      <!-- Removable chips: the cross says (removed), and the application takes the tag away. -->
      <div class="tags">
        @for (tag of product.tags(); track tag) {
          <grd-chip [text]="tag" removable (removed)="removeTag(tag)" />
        } @empty {
          <span>No tags</span>
        }
      </div>

      <!-- A badge: a short status in the color of the theme. -->
      @if (product.shops().length > 0) {
        <grd-badge variant="success" dot>{{ shopsText() }}</grd-badge>
      } @else {
        <grd-badge variant="warning" dot>Not sold anywhere yet</grd-badge>
      }
    </grd-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: auto;
      padding: 12px;
      box-sizing: border-box;
    }
    .label {
      margin: 12px 0;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 600;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
  `,
})
export class PreviewTool {
  protected readonly product = inject(ProductStore);
  protected readonly pictures = PICTURES;

  /** Black or white, whichever reads better on the color of the label. */
  protected readonly textColor = computed(() => grdReadableOn(this.product.color() || '#ffffff'));

  protected readonly sizesText = computed(() => {
    const sizes = this.product.sizes();
    return sizes.length > 0 ? `Sizes: ${sizes.join(', ')}` : 'No size chosen yet';
  });

  protected readonly shopsText = computed(() => {
    const count = this.product.shops().length;
    return count === 1 ? 'Sold in 1 shop' : `Sold in ${count} shops`;
  });

  /** The cross of a tag in the preview: the tag goes, in the form too (they share the signal). */
  protected removeTag(tag: string): void {
    this.product.tags.update((tags) => tags.filter((other) => other !== tag));
  }
}
```

- **`grd-card`** frames the preview: `heading` and `description` in its header, the rest in its body.
- **`grd-picture-gallery`**: one picture large, arrows, and a strip of small pictures; a click on the picture shows them all in the lightbox. `fit="cover"` fills the frame, and `loading="eager"` fetches the pictures at once, for a gallery that is seen when the page opens.
- **`grdReadableOn(color)`** gives `#000000` or `#ffffff`, whichever reads better on the color: the color of the text of the label.
- **The chips of the tags** are `removable`: the cross says `(removed)`, and `removeTag` takes the tag out of the signal, so it goes from the form too.
- **`grd-badge`** is a short status: `variant="success"` is green, `warning` orange; `dot` puts a dot before the text.

### Step 4: the layout

`src/app/app.ts` puts the form among the documents and the preview into a tool on the right, and registers them by their keys, as 015 does.

### Step 5: run it

```
npm run tutorial 159
```

## Try it

1. **Tags.** Type `fair trade` into _Tags_ and press Enter, then `organic` and a comma: two new tags, in the preview too. There may be five at most (`maxTags`): a sixth one is refused, and the field says why.
2. **Remove a tag in the preview.** Press the cross of _light roast_ in the preview: it goes from the form too.
3. **Sizes.** Press _500 g_ and _1 kg_: they are pressed, and the card says _Sizes: 250 g, 500 g, 1 kg_. Press _250 g_ again: it goes.
4. **A color.** Open _Color of the label_ and choose _Yellow_: the label in the preview is yellow, and its text is black. Choose _Navy_: the text is white.
5. **Shops.** Double-click _Airport_: it moves to _Sells it_, and the badge says _Sold in 3 shops_. Press **«** (_Move all to Other shops_): the badge says _Not sold anywhere yet_, in orange.
6. **Pictures.** Point at the picture and press its arrow, or press a small picture. Click the picture: the lightbox shows it large, and Esc closes it.
7. **The engine.** Choose _Detach to a floating window_ in the menu of the tab _Preview_ (the ⋯), and change the name in the form: the floating preview follows.

## More

- **A color button** for a toolbar: `grd-color-button` (the bar of the current color, and a popup of colors); `grd-color-panel` is the panel on its own.
- **Chips with a name and a count**: `<grd-chip name="Status:" text="Open" [count]="3" variant="accent" />`.
- **Tags with a rule**: `[tagValidators]="['email']"` takes only e-mail addresses (a tag that fails is not added).
- **A transfer list with a search and a limit**: `searchable`, `max`, and `orderButtons` to change the order of the chosen items.
- **One picture**: `grd-picture` with `src`, `alt` and `caption`; `grd-lightbox` shows pictures large on its own.
- **A badge on a corner**: `grdBadgeAnchor` on the element, and `position="top-end"` on the badge.

## Build it yourself

`npm run tutorial:eject 159 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `product.ts`, `product-form.ts` and `preview-tool.ts` to `src/app` and the folder `pictures` to `public`, and replace `app.ts` with the one of this tutorial.
