import { Component, computed, inject } from '@angular/core';
import { euro } from './catalog';
import { CatalogState } from './catalog-state';

/** The tool on the right: the checked products and their total. */
@Component({
  selector: 'app-order-tool',
  template: `
    @for (product of state.order(); track product.id) {
      <div class="row">
        <span>{{ product.label }}</span>
        <span>{{ euro(product.price ?? 0) }}</span>
      </div>
    } @empty {
      <p class="hint">Check products in the catalog, and they come here.</p>
    }
    @if (state.order().length > 0) {
      <div class="row total">
        <span>Total</span>
        <span>{{ euro(total()) }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
    .total {
      font-weight: bold;
      border-bottom: none;
    }
    .hint {
      opacity: 0.88;
    }
  `,
})
export class OrderTool {
  protected readonly state = inject(CatalogState);
  protected readonly euro = euro;
  protected readonly total = computed(() =>
    this.state.order().reduce((sum, product) => sum + (product.price ?? 0), 0),
  );
}
