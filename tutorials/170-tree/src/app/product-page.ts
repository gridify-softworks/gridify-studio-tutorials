import { Component, computed, inject, input } from '@angular/core';
import { euro, findProduct } from './catalog';
import { CatalogState } from './catalog-state';

/** A document: one product. The tree opens it with the id of the product (see product-tabs.ts). */
@Component({
  selector: 'app-product-page',
  template: `
    @if (product(); as found) {
      <p class="path">{{ found.path.join(' › ') }}</p>
      <h2>{{ found.node.label }}</h2>
      <p class="price">{{ euro(found.node.price ?? 0) }}</p>
      <p>{{ inOrder() ? 'It is checked in the catalog.' : 'It is not checked in the catalog.' }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    .path {
      margin: 0;
      opacity: 0.88;
    }
    h2 {
      margin: 4px 0;
    }
    .price {
      font-size: 1.3em;
      font-weight: bold;
    }
  `,
})
export class ProductPage {
  /** The id of the product: the input that product-tabs.ts gives the tab. */
  readonly id = input.required<string>();

  private readonly state = inject(CatalogState);
  protected readonly euro = euro;
  protected readonly product = computed(() => findProduct(this.id()));
  /** The page reads the same state as the tree: check the product there, and this line changes. */
  protected readonly inOrder = computed(() => this.state.checked().has(this.id()));
}
