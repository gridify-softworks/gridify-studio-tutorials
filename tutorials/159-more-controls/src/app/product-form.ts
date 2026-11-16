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
