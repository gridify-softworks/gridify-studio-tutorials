import type { GrdDockingEngine } from '@gridify/studio';
import type { CatalogNode } from './catalog';

/** Shows a product in the engine: its tab when it is open already, a new tab otherwise. */
export function openProduct(engine: GrdDockingEngine, product: CatalogNode): void {
  // The tag says which product a tab shows, so the tab can be found again.
  const tag = `product:${product.id}`;
  const [tab] = engine.api.getByTag(tag);
  if (tab) {
    engine.api.activateTab(tab.id);
    return;
  }
  engine.openComponentTab({
    tag,
    title: product.label,
    componentKey: 'product',
    inputs: { id: product.id },
  });
}
