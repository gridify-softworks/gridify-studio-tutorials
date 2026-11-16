# 171 – An explorer of files

This tutorial shows the explorer of the library (`grd-explorer`) in a docking application: the files of a project from a (pretend) server, opened as documents, renamed and deleted the way an IDE does it. You will learn how to:

- load the children of a folder when it is opened, with a ring while they come (`lazy`, `loading`, `nodeToggled`);
- open a file in a tab by a double click or Enter (`nodeActivated`), and write the name of the active document in bold (`active`);
- rename a file with F2 (`renamable`, `nodeRenamed`), and let the title of its tab follow;
- give a file a context menu (`nodeMenu`) and the key Del (`nodeKeydown`);
- change the nodes of a tree without changing them in place.

It continues 170 (a tree): the explorer is the tree of an IDE, with fewer things (no boxes, no filter) and the ones a file needs.

```
npm run tutorial 171
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30171 and open the folder `src`.

## The words first

- **A lazy node** is a folder whose children are not there yet: it has a twisty, and the application loads its children when the user opens it.
- **The active node** is the file of the document that is shown: its name is bold, as in the explorer of an IDE.
- **An id that never changes.** A file has an id (`orders-ts`) and a name (`orders.ts`). The name changes when the file is renamed; the id does not, so the tab and the tree still know which file it is.

## Step by step

### Step 1: the pretend server

`src/app/files-server.ts` keeps the files and answers after half a second, as a server would. Each function says the request it stands for:

```ts
/** A file or a folder as the server has it. The id never changes, also when the name does. */
export interface Entry {
  readonly id: string;
  /** The id of the folder it is in; `null` at the top. */
  readonly parent: string | null;
  readonly name: string;
  readonly folder: boolean;
  readonly content?: string;
}

/** The files of the pretend server (in memory: F5 starts again). */
let entries: Entry[] = [
  { id: 'docs', parent: null, name: 'docs', folder: true },
  { id: 'src', parent: null, name: 'src', folder: true },
  {
    id: 'readme',
    parent: null,
    name: 'README.md',
    folder: false,
    content: '# Orders\n\nA small application for the orders of a shop.',
  },
  {
    id: 'guide',
    parent: 'docs',
    name: 'guide.md',
    folder: false,
    content: '# Guide\n\nOpen a file with a double click or Enter.',
  },
  {
    id: 'notes',
    parent: 'docs',
    name: 'release-notes.md',
    folder: false,
    content: '# Release notes\n\n1.0: the first release.',
  },
  { id: 'app', parent: 'src', name: 'app', folder: true },
  {
    id: 'main',
    parent: 'src',
    name: 'main.ts',
    folder: false,
    content: "import { App } from './app/app';",
  },
  { id: 'app-ts', parent: 'app', name: 'app.ts', folder: false, content: 'export class App {}' },
  {
    id: 'orders-ts',
    parent: 'app',
    name: 'orders.ts',
    folder: false,
    content: "export const ORDERS = ['1001', '1002'];",
  },
  {
    id: 'zdenek',
    parent: 'app',
    name: 'poznámky-zdeňka.txt',
    folder: false,
    content: 'Zdeněk: check the totals before the release.',
  },
];

/** A pause as long as a request to a server takes. */
const pause = () => new Promise((resolve) => setTimeout(resolve, 500));

/** GET /api/folders/{id}: what a folder holds (`null`: the top), the folders first. */
export async function listFolder(parent: string | null): Promise<Entry[]> {
  await pause();
  return entries
    .filter((entry) => entry.parent === parent)
    .sort((a, b) => Number(b.folder) - Number(a.folder) || a.name.localeCompare(b.name));
}

/** GET /api/files/{id}: the content of a file. */
export async function readFile(id: string): Promise<string> {
  await pause();
  return entries.find((entry) => entry.id === id)?.content ?? '';
}

/** PATCH /api/files/{id}: a new name. */
export async function renameFile(id: string, name: string): Promise<void> {
  await pause();
  entries = entries.map((entry) => (entry.id === id ? { ...entry, name } : entry));
}

/** DELETE /api/files/{id}. */
export async function deleteFile(id: string): Promise<void> {
  await pause();
  entries = entries.filter((entry) => entry.id !== id);
}
```

### Step 2: the files

`src/app/files.ts` is the service that the explorer, the tabs and the documents share:

```ts
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
```

- **`nodeOf`** makes a node of an entry: a folder is `lazy` (a twisty before it has children), a file is `renamable` (F2).
- **`loadChildren`** sets `loading` on the folder (a ring turns in the place of the twisty), asks the server, and gives the folder its `children` (and `lazy: false`, so it is loaded once).
- **`changeNode`** changes one node and makes new objects on the way to it. The explorer is given a new array; it keeps its rows by the `id`, so the focus and the scroll stay.
- **`openFile`** finds the tab of a file by its tag (`file:orders-ts`) or opens one, in the engine that the caller gives. **The title is a signal** (`computed`): the tab says the new name of a renamed file by itself.
- **`remove`** closes the tab of the file first, then deletes it.

### Step 3: the explorer

`src/app/explorer-tool.ts`:

```ts
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
```

- **`[(expanded)]` and `[(selected)]`** work as in 170.
- **`tab`** is the `GrdTabContext` that the engine gives every component in a tab: `tab.engine` is the engine, so the tool opens and closes tabs without anybody passing the engine around.
- **`[active]`** is the file of the active document, written in bold: `activeId` reads the active document of the engine (`activeDocumentTab()`, a signal) and takes the id of the file out of its tag.
- **`(nodeToggled)`** comes when the user opens or closes a node; a lazy folder that is opened loads its children.
- **`(nodeActivated)`** (a double click or Enter) opens a file; on a folder it only opens or closes it.
- **`(nodeRenamed)`** comes after F2, when the user confirms a new name (trimmed, not empty, different). The explorer does not rename the node: the application does it, after the server.
- **`(nodeKeydown)`** gives the keys that the explorer does not use itself, with the selected node: here Del deletes a file. `preventDefault()` tells that the key was used.
- **`[nodeMenu]`** makes the context menu of a node when it opens; an empty list (a folder) leaves the browser's menu. _Rename_ calls `startRename(id)`, as F2 does.

### Step 4: a file in a tab

`src/app/file-view.ts` is the document: it loads the content when it is made.

```ts
export class FileView implements OnInit {
  /** The id of the file: the input that Files.openFile gives the tab. */
  readonly id = input.required<string>();

  protected readonly files = inject(Files);
  /** The content, `null` while it is loaded. */
  protected readonly text = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.text.set(await readFile(this.id()));
  }
}
```

### Step 5: the layout

`src/app/app.ts` registers the components and loads the top of the tree:

```ts
constructor() {
  const registry = inject(GrdContentRegistry);
  registry.registerComponent('explorer', ExplorerTool);
  registry.registerComponent('file', FileView);
  // The top of the tree comes from the server.
  void this.files.loadTop();
}
```

The engine does not save the layout here (`[layoutStorageKey]="null"`): the files live in the memory of the pretend server, so F5 starts everything again.

### Step 6: run it

```
npm run tutorial 171
```

## Try it

1. **Loading.** At the start the explorer says _Loading…_ for half a second, then the top of the tree comes.
2. **A lazy folder.** Open `src`: a ring turns in the place of the twisty, then its children come. Close it and open it again: no ring, it was loaded once.
3. **A file in a tab.** Open `src › app` and double-click `orders.ts` (or select it and press Enter): a tab opens, and `orders.ts` is bold in the explorer. Open `main.ts` too and switch between the tabs: the bold name follows.
4. **Rename.** Select `orders.ts`, press F2, type `purchases` and press Enter: the explorer and the tab say `purchases.ts`. (F2 selects the name without the extension.) Esc gives the rename up.
5. **The context menu.** Right-click `main.ts`: _Open_, _Rename_ and _Delete_, with their keys. Right-click a folder: the browser's menu, the folders have none here.
6. **Delete.** Select `purchases.ts` and press Del: its tab closes, and it is gone.
7. **The keys of an IDE.** Up and Down move, Right opens a folder (and loads it), Left closes it or goes to the parent, Home and End go to the ends.
8. **The bar.** _Collapse all_ closes the folders; _Expand all_ opens all of them, and the ones that were never loaded are loaded now.

## More

- **Moving files**: `moveRules` lets the user drag files into folders (or move them with Alt and the arrows); `nodeMoved` says where to, and the application moves them.
- **A mark**: `mark: 'Unsaved changes'` puts a dot after the name of a file that has changes.
- **A file name with letters of any language** (`poznámky-zdeňka.txt`) is a name like any other.
- **Save the layout** as in 015 when the documents can be made again after F5 (the server keeps the files).

## Build it yourself

`npm run tutorial:eject 171 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `files-server.ts`, `files.ts`, `explorer-tool.ts` and `file-view.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
