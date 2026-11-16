# 170 – A tree

This tutorial shows the tree of the library (`grd-tree`) in a docking application: the catalog of a small shop, with check boxes and a filter, and the products opened as documents. You will learn how to:

- give the tree its nodes (`GrdTreeNode`), with a field of your own;
- keep the open, the selected and the checked nodes in signals of your own (`[(expanded)]`, `[(selected)]`, `[(checked)]`);
- open a document when the user double-clicks a node or presses Enter on it (`nodeActivated`);
- use check boxes that follow the nodes below them, and get the checked products (`grdTreeCheckedLeaves`);
- let the user filter the tree (`filterable`), also without accents.

It is the first of two tutorials about trees: 171 shows the explorer of files, with folders that are loaded when they are opened.

```
npm run tutorial 170
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30170: the catalog on the left, the documents in the middle, the order on the right.

## The words first

- **A node** is a row of the tree: here a category (Coffee, Beans) or a product (Colombia Supremo). A node with `children` has a **twisty** (the small arrow) and can be opened.
- **Open, selected and checked** are three different things. _Open_ nodes show their children; the _selected_ node is the one row with the highlight (where the keys are); _checked_ nodes have a tick in their box, and there can be many.
- **The application owns everything.** The tree draws the nodes and the sets of open, selected and checked ones, and tells what the user did; it never changes a node itself.
- **To activate** a node is to double-click it or press Enter on it: here a product opens in a tab.

## Step by step

### Step 1: the nodes

`src/app/catalog.ts` has the catalog as nodes:

```ts
import type { GrdTreeNode } from '@gridify/studio';

/**
 * A node of the catalog: a category, or a product (a product has a price). It is a GrdTreeNode
 * (`id`, `label`, `icon`, `description`, `children`) with one field of our own: the tree hands
 * our nodes back as they are, the price included.
 */
export interface CatalogNode extends GrdTreeNode {
  readonly price?: number;
  readonly children?: CatalogNode[];
}

const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

/** A price as text: €6.50. */
export function euro(price: number): string {
  return money.format(price);
}

/** A product: a leaf of the tree, with its price as the small text after the name. */
function product(id: string, label: string, price: number): CatalogNode {
  return { id, label, price, description: euro(price) };
}

/** The catalog of a small shop. A real application loads it from its server. */
export const CATALOG: CatalogNode[] = [
  {
    id: 'coffee',
    label: 'Coffee',
    icon: '☕',
    children: [
      {
        id: 'coffee-beans',
        label: 'Beans',
        children: [
          product('ethiopia', 'Ethiopia Yirgacheffe', 14.9),
          product('colombia', 'Colombia Supremo', 12.5),
          product('brazil', 'Brazil Santos', 11),
        ],
      },
      {
        id: 'coffee-ground',
        label: 'Ground',
        children: [product('house-blend', 'House blend', 9.9), product('decaf', 'Decaf', 10.5)],
      },
    ],
  },
  {
    id: 'tea',
    label: 'Tea',
    icon: '🍵',
    children: [
      {
        id: 'tea-green',
        label: 'Green',
        children: [product('sencha', 'Sencha', 6.5), product('matcha', 'Matcha', 18)],
      },
      {
        id: 'tea-black',
        label: 'Black',
        children: [product('assam', 'Assam', 5.9), product('earl-grey', 'Earl Grey', 6.2)],
      },
      {
        id: 'tea-herbal',
        label: 'Herbal',
        children: [
          product('chamomile', 'Chamomile', 4.8),
          // Linden tea from a Czech farm: try the filter with "lipovy", without the accents.
          product('linden', 'Lipový čaj', 4.5),
          product('peppermint', 'Peppermint', 4.6),
        ],
      },
    ],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    icon: '🥄',
    children: [
      product('hand-grinder', 'Hand grinder', 39),
      product('moka-pot', 'Moka pot', 29),
      product('mug', 'Mug', 8),
    ],
  },
];

/** Every node of the catalog in one list, with the path of names above it. */
function flatten(
  nodes: CatalogNode[],
  path: string[] = [],
): { node: CatalogNode; path: string[] }[] {
  return nodes.flatMap((node) => [
    { node, path },
    ...flatten(node.children ?? [], [...path, node.label]),
  ]);
}

const ALL = flatten(CATALOG);

/** The product with this id (a category is no product): the node and the categories above it. */
export function findProduct(id: string): { node: CatalogNode; path: string[] } | undefined {
  return ALL.find((entry) => entry.node.id === id && entry.node.price !== undefined);
}
```

- A node needs an **`id`** (unique in the tree) and a **`label`**. `icon` (a key of the icon registry, a text or an emoji) and `description` (the small grey text after the label) are optional.
- **`CatalogNode`** adds a field of our own, `price`. The tree does not know it, and hands the nodes back as they are, the price included.

### Step 2: what the user did

`src/app/catalog-state.ts` keeps the three sets in signals:

```ts
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
```

- A set holds the **ids** of the nodes. The tree never changes a set it was given: it gives a new one, so a signal sees every change.
- In the default **cascade** mode, a category whose products are all checked is in `checked` too. **`grdTreeCheckedLeaves`** takes only the leaves (the products): the order wants products, not categories. `grdTreeEntries` makes the flat list of the nodes that it needs.

### Step 3: the tree

`src/app/catalog-tool.ts` is the tool on the left:

<!-- prettier-ignore -->
```html
<!--
  The tree shows the open, the selected and the checked nodes, and gives new sets when the
  user changes them: [(…)] binds both ways to the signals of CatalogState.
-->
<grd-tree
  [nodes]="catalog"
  [(expanded)]="state.open"
  [(selected)]="state.selected"
  checkboxes
  [(checked)]="state.checked"
  filterable
  [tools]="['collapseAll', 'expandAll']"
  ariaLabel="Catalog"
  (nodeActivated)="activate($event)"
/>
```

- **`[nodes]`** are the nodes from step 1.
- **`[(expanded)]`, `[(selected)]` and `[(checked)]`** bind both ways to the signals of step 2: the tree shows them, and sets them when the user opens, selects or checks a node.
- **`checkboxes`** draws a box before every node. Checking a category checks everything below it; a category with only some of its products checked shows a dash. A click on a box does not select the row.
- **`filterable`** draws a field above the tree. A node is shown when its label contains the text (without regard to case and accents: `lipovy` finds _Lipový čaj_), or when a node below it does; the way to a hit is opened, and the hit is marked.
- **`[tools]`** adds the buttons _Collapse all_ and _Expand all_ to the bar.
- **`(nodeActivated)`** comes for a double click or Enter:

```ts
/**
 * A double click or Enter on a node: a product opens in a tab. A category only opens or
 * closes (the tree does that by itself).
 */
protected activate(node: CatalogNode): void {
  if (node.price !== undefined) openProduct(this.tab.engine, node);
}
```

### Step 4: a product in a tab

`src/app/product-tabs.ts` has one function: it opens a product as a document of the engine.

```ts
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
```

- **The tag** `product:colombia` marks the tab of a product, so it can be found: `api.getByTag(tag)` gives the tab when it is open, and `api.activateTab(id)` shows it. A product is never open twice.
- **`openComponentTab`** opens a new tab with the component of the key `product` and its input `id`. The key is registered in `app.ts`, so the tab is made again after F5.

The tool reaches the engine through its tab. The engine gives every component in a tab a `GrdTabContext`, and its `engine` is the engine that the tab is in:

```ts
/** The tab this tool is in: through it the tool reaches the engine. */
private readonly tab = inject(GrdTabContext);
```

The product page (`src/app/product-page.ts`) shows the product, and reads the same state as the tree:

```ts
/** The page reads the same state as the tree: check the product there, and this line changes. */
protected readonly inOrder = computed(() => this.state.checked().has(this.id()));
```

### Step 5: the order

`src/app/order-tool.ts` is the tool on the right: the checked products and their total. Its template goes through `state.order()`:

```ts
export class OrderTool {
  protected readonly state = inject(CatalogState);
  protected readonly euro = euro;
  protected readonly total = computed(() =>
    this.state.order().reduce((sum, product) => sum + (product.price ?? 0), 0),
  );
}
```

The tree, the order and the product pages never talk to each other: they all read and write `CatalogState`, so they always agree.

### Step 6: the layout

`src/app/app.ts` has the three panels and registers the components by their keys:

```ts
/** The catalog on the left, the products (documents) in the middle, the order on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 28,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'catalog', role: 'tool', title: 'Catalog', componentKey: 'catalog' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 47,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'order', role: 'tool', title: 'Order', componentKey: 'order' }],
    },
  ],
};
```

```ts
constructor() {
  inject(GrdEngineSettings).setAutoSaveLayout(true);
  // The components of the tabs, by their keys (the layout names them so, also after F5).
  const registry = inject(GrdContentRegistry);
  registry.registerComponent('catalog', CatalogTool);
  registry.registerComponent('order', OrderTool);
  registry.registerComponent('product', ProductPage);
}
```

### Step 7: run it

```
npm run tutorial 170
```

## Try it

1. **Open and close.** Coffee is open at the start (`open` begins with it). Click the twisty of Tea; or select Tea and press Right, and Left to close it again.
2. **The keys.** Up and Down move the selection, Home and End go to the ends, a letter jumps to the next node that starts with it.
3. **A product in a tab.** Open Beans and double-click **Colombia Supremo**: a tab opens. Double-click it again: the same tab is shown, there is no second one. Select **Ethiopia Yirgacheffe** and press Enter: another tab.
4. **Check boxes.** Check **Beans**: its three products are checked, Coffee shows a dash (some of its products), and the order lists the three with the total. Uncheck **Brazil Santos**: Beans shows a dash too. The tab of Colombia Supremo says _It is checked in the catalog._
5. **The filter.** Type `matcha`: only the way to it is left, and the hit is marked. Type `lipovy`: _Lipový čaj_ is found without the accents. Esc clears the filter.
6. **The bar.** _Expand all_ opens everything, _Collapse all_ closes everything.
7. **F5.** The tabs come back (the engine saves the layout), the checks do not: they live in the memory of the page. A real application keeps them where it wants (`localStorage`, its server).

## More

- **Lazy children**: `lazy: true` on a node gives it a twisty before it has children; `nodeToggled` says it was opened, and `loading: true` turns a ring while they are loaded. 171 does it with folders.
- **Many selected nodes**: `selectionMode="multiple"` and `[(selection)]` (Ctrl and Shift with the mouse and the keys).
- **A context menu of a node**: `[nodeMenu]="(node) => items"` (101 shows context menus).
- **Moving nodes**: `moveRules` lets the user drag nodes or move them with Alt and the arrows (`nodeMoved` says where to).
- **Every box on its own**: `checkMode="independent"`.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { CatalogTool } from './catalog-tool';
import { OrderTool } from './order-tool';
import { ProductPage } from './product-page';

/** The catalog on the left, the products (documents) in the middle, the order on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 28,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'catalog', role: 'tool', title: 'Catalog', componentKey: 'catalog' }],
    },
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 47,
      activeTab: 0,
      collapsed: false,
      tabs: [],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'order', role: 'tool', title: 'Order', componentKey: 'order' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-170-layout" [defaultLayout]="layout" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  private readonly engine = viewChild.required(GrdDockingEngine);

  protected readonly layout = LAYOUT;

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by their keys (the layout names them so, also after F5).
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('catalog', CatalogTool);
    registry.registerComponent('order', OrderTool);
    registry.registerComponent('product', ProductPage);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [{ label: '&Reset layout', run: () => this.engine().resetLayout() }],
    },
  ];
}
```

## Build it yourself

`npm run tutorial:eject 170 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `catalog.ts`, `catalog-state.ts`, `catalog-tool.ts`, `product-tabs.ts`, `product-page.ts` and `order-tool.ts` to `src/app`, and replace `app.ts` with the one above.
