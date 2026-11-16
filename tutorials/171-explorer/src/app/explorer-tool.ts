import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdExplorer,
  type GrdExplorerKeyEvent,
  GrdTabContext,
  type GrdExplorerToggleEvent,
  type GrdMenuItem,
} from '@gridify/studio';
import { type FileNode, Files } from './files';

/** The tool on the left: the files of the project. */
@Component({
  selector: 'app-explorer-tool',
  imports: [GrdExplorer],
  template: `
    <grd-explorer
      [nodes]="files.nodes()"
      [(expanded)]="files.open"
      [(selected)]="files.selected"
      [active]="activeId()"
      [tools]="['collapseAll', 'expandAll']"
      [nodeMenu]="menuOf"
      ariaLabel="Files"
      emptyText="Loading…"
      (nodeToggled)="toggled($event)"
      (nodeActivated)="files.openFile(tab.engine, $event)"
      (nodeRenamed)="files.rename($event.node, $event.name)"
      (nodeKeydown)="key($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class ExplorerTool {
  protected readonly files = inject(Files);
  /** The tab this tool is in: through it the tool reaches the engine. */
  protected readonly tab = inject(GrdTabContext);
  private readonly explorer = viewChild.required<GrdExplorer<FileNode>>(GrdExplorer);

  /** The file of the active document (its tag is `file:<id>`): the explorer writes its name in bold. */
  protected readonly activeId = computed(() => {
    const tag = this.tab.engine.activeDocumentTab()?.tag ?? '';
    return tag.startsWith('file:') ? tag.slice('file:'.length) : null;
  });

  /** A folder was opened: the first time, its children are loaded from the server. */
  protected toggled(event: GrdExplorerToggleEvent<FileNode>): void {
    const folder = event.node;
    if (event.open && folder.lazy && !folder.loading) void this.files.loadChildren(folder);
  }

  /** A key that the explorer does not use itself: Del deletes a file. */
  protected key(event: GrdExplorerKeyEvent<FileNode>): void {
    if (event.event.key === 'Delete' && !event.node.folder) {
      event.event.preventDefault();
      void this.files.remove(this.tab.engine, event.node);
    }
  }

  /** The context menu of a node, made when it opens. A folder has none (the browser's shows). */
  protected readonly menuOf = (node: FileNode): GrdMenuItem[] =>
    node.folder
      ? []
      : [
          { label: '&Open', run: () => this.files.openFile(this.tab.engine, node) },
          { label: '&Rename', shortcut: 'F2', run: () => this.explorer().startRename(node.id) },
          { separator: true },
          {
            label: '&Delete',
            shortcut: 'Del',
            run: () => void this.files.remove(this.tab.engine, node),
          },
        ];
}
