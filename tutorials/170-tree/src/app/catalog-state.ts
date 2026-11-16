import { computed, Injectable, signal } from '@angular/core';
import { grdTreeCheckedLeaves, grdTreeEntries } from '@gridify/studio';
import { CATALOG, findProduct } from './catalog';

/**
 * What the user did with the tree: the open nodes, the selected one and the checked ones. The
 * tree only shows these sets; the application keeps them (here in a service, so that the tool
 * Order can read them too).
 */
@Injectable({ providedIn: 'root' })
export class CatalogState {
  /** The ids of the open nodes. At the start Coffee is open. */
  readonly open = signal<ReadonlySet<string>>(new Set(['coffee']));
  /** The id of the selected node. */
  readonly selected = signal<string | null>(null);
  /** The ids of the checked nodes: the products, and the categories whose products are all checked. */
  readonly checked = signal<ReadonlySet<string>>(new Set());

  /** The checked products: the leaves among the checked nodes (a checked category is not a product). */
  readonly order = computed(() =>
    grdTreeCheckedLeaves(grdTreeEntries(CATALOG), this.checked())
      .map((id) => findProduct(id)?.node)
      .filter((node) => node !== undefined),
  );
}
