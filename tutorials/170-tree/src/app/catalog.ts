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
