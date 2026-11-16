import { Component, inject } from '@angular/core';
import { GrdTabContext, GrdTree } from '@gridify/studio';
import { CATALOG, type CatalogNode } from './catalog';
import { CatalogState } from './catalog-state';
import { openProduct } from './product-tabs';

/** The tool on the left: the catalog as a tree. */
@Component({
  selector: 'app-catalog-tool',
  imports: [GrdTree],
  template: `
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
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class CatalogTool {
  protected readonly catalog = CATALOG;
  protected readonly state = inject(CatalogState);
  /** The tab this tool is in: through it the tool reaches the engine. */
  private readonly tab = inject(GrdTabContext);

  /**
   * A double click or Enter on a node: a product opens in a tab. A category only opens or
   * closes (the tree does that by itself).
   */
  protected activate(node: CatalogNode): void {
    if (node.price !== undefined) openProduct(this.tab.engine, node);
  }
}
