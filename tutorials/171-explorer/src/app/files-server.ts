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
