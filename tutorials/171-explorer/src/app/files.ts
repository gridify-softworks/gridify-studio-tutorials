import { computed, Injectable, signal } from '@angular/core';
import type { GrdDockingEngine, GrdExplorerNode } from '@gridify/studio';
import { deleteFile, type Entry, listFolder, renameFile } from './files-server';

/** A node of the explorer: a GrdExplorerNode, and whether it is a folder. */
export interface FileNode extends GrdExplorerNode {
  readonly folder: boolean;
  readonly children?: FileNode[];
}

/** A node from an entry of the server. A folder is `lazy`: its children are loaded when it is opened. */
function nodeOf(entry: Entry): FileNode {
  return entry.folder
    ? { id: entry.id, name: entry.name, folder: true, icon: '📁', lazy: true }
    : { id: entry.id, name: entry.name, folder: false, icon: '📄', renamable: true };
}

/**
 * Changes one node of the tree: `change` gives the new node, or `null` to take the node away.
 * The tree is never changed in place: the nodes on the way to the changed one are new objects.
 */
function changeNode(
  nodes: FileNode[],
  id: string,
  change: (node: FileNode) => FileNode | null,
): FileNode[] {
  return nodes.flatMap((node) => {
    if (node.id === id) {
      const changed = change(node);
      return changed ? [changed] : [];
    }
    return node.children ? [{ ...node, children: changeNode(node.children, id, change) }] : [node];
  });
}

/** Finds a node anywhere in the tree. */
function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const below = findNode(node.children ?? [], id);
    if (below) return below;
  }
  return null;
}

/**
 * The files: the nodes of the explorer, the open and the selected ones, and the tabs of the files
 * in the engine (the caller gives the engine). The explorer and the documents use this service.
 */
@Injectable({ providedIn: 'root' })
export class Files {
  readonly nodes = signal<FileNode[]>([]);
  readonly open = signal<ReadonlySet<string>>(new Set());
  readonly selected = signal<string | null>(null);

  /** The top of the tree, at the start. */
  async loadTop(): Promise<void> {
    this.nodes.set((await listFolder(null)).map(nodeOf));
  }

  /** A folder was opened for the first time: a ring turns while its children are loaded. */
  async loadChildren(folder: FileNode): Promise<void> {
    this.nodes.update((nodes) =>
      changeNode(nodes, folder.id, (node) => ({ ...node, loading: true })),
    );
    const children = (await listFolder(folder.id)).map(nodeOf);
    this.nodes.update((nodes) =>
      changeNode(nodes, folder.id, (node) => ({ ...node, loading: false, lazy: false, children })),
    );
  }

  /** The current name of a file (the title of its tab follows it). */
  nameOf(id: string): string {
    return findNode(this.nodes(), id)?.name ?? id;
  }

  /** Shows a file in the engine: its tab when it is open, a new tab otherwise. */
  openFile(engine: GrdDockingEngine, file: FileNode): void {
    if (file.folder) return;
    const tag = `file:${file.id}`;
    const [tab] = engine.api.getByTag(tag);
    if (tab) {
      engine.api.activateTab(tab.id);
      return;
    }
    engine.openComponentTab({
      tag,
      // A signal as the title: when the file is renamed, the tab says the new name.
      title: computed(() => this.nameOf(file.id)),
      componentKey: 'file',
      inputs: { id: file.id },
    });
  }

  /** The user typed another name (F2): the server first, then the tree. */
  async rename(file: FileNode, name: string): Promise<void> {
    await renameFile(file.id, name);
    this.nodes.update((nodes) => changeNode(nodes, file.id, (node) => ({ ...node, name })));
  }

  /** Deletes a file: its tab is closed, the server deletes it, the tree loses it. */
  async remove(engine: GrdDockingEngine, file: FileNode): Promise<void> {
    const [tab] = engine.api.getByTag(`file:${file.id}`);
    if (tab) engine.api.closeTab(tab.id);
    await deleteFile(file.id);
    this.nodes.update((nodes) => changeNode(nodes, file.id, () => null));
  }
}
