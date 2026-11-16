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
