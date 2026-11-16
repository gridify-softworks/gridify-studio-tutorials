# 101 – A context menu and keyboard shortcuts

This tutorial shows how to give the things on the screen a context menu (the right mouse button) and how to make the commands work from the keyboard. You will learn how to:

- write the commands once, as menu items with their keys (`GrdMenuItem` with `shortcut`), and use them in the menu bar and in the context menus;
- give an element a context menu (`[grdContextMenu]`): the right mouse button, the Menu key and Shift+F10;
- build the items of a context menu when it opens, for the thing that was clicked;
- make the keys work (`[shortcuts]="true"` of the menu bar), and register a key that is in no menu (`GrdShortcuts`);
- know which keys do not run in a text field (Del deletes a character there, not a task).

It continues 100 (a menu bar, a toolbar and a popup menu at the pointer), in a docking application as in 015: a list of tasks as a document, and a log as a tool.

```
npm run tutorial 101
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30101 and right-click a task.

## The words first

- **A command** is something the user can do: _Done_, _Move up_, _Delete_. Here a command is a menu item (`GrdMenuItem`): a label, `run`, and `enabled` and `checked` when they matter.
- **A shortcut** (a key) runs a command without the mouse: `Ctrl+Enter`. It is written as `Mod+Enter`: `Mod` is Ctrl on Windows and Linux, and Cmd (⌘) on a Mac.
- **A context menu** is the menu of one thing on the screen, opened by the right mouse button (a long press on a touch screen), the Menu key of the keyboard, or Shift+F10.
- **`GrdShortcuts`** is the one place where the keys of the whole application are registered: the menu bar, the ribbon and the application's own keys. A key taken twice is reported, so two commands never fight over it.

## Step by step

### Step 1: the tasks

`src/app/tasks.ts` is a service with the tasks, the selected task, and a log of what happened. Its methods are the commands: `toggleDone()`, `move(-1)`, `move(1)`, `remove()`, `askForNewTask()`; each works on the selected task. (The whole file is at the end.)

### Step 2: the commands, written once

`src/app/commands.ts` makes the commands as menu items:

```ts
import type { GrdMenuItem } from '@gridify/studio';
import { Tasks } from './tasks';

/**
 * The commands of the tasks, written once as menu items. The menu bar, the context menu of a
 * task and the keys all use these items, so a command looks and works the same everywhere.
 *
 * `shortcut` is the key of the command. A menu shows it next to the label; the menu bar with
 * `[shortcuts]="true"` also makes it work (see app.ts). The items are made again whenever they
 * are needed, so `enabled` and `checked` always say how things are now.
 */
export function taskCommands(tasks: Tasks): GrdMenuItem[] {
  const task = tasks.selected();
  return [
    { label: '&New task', shortcut: 'Alt+N', run: () => tasks.askForNewTask() },
    { separator: true },
    {
      label: '&Done',
      shortcut: 'Mod+Enter',
      checked: task?.done ?? false,
      enabled: task !== null,
      run: () => tasks.toggleDone(),
    },
    {
      label: 'Move &up',
      shortcut: 'Alt+Up',
      enabled: tasks.canMove(-1),
      run: () => tasks.move(-1),
    },
    {
      label: 'Move do&wn',
      shortcut: 'Alt+Down',
      enabled: tasks.canMove(1),
      run: () => tasks.move(1),
    },
    { separator: true },
    { label: 'De&lete', shortcut: 'Del', enabled: task !== null, run: () => tasks.remove() },
  ];
}
```

- **`shortcut`** is the key. A menu shows it next to the label (as this computer writes it: `Ctrl+Enter` or `⌘↩`); the menu bar of step 4 also makes it work.
- **`enabled: false`** greys the item out, and its key does nothing then. **`checked`** draws a check mark: _Done_ has it when the selected task is done.
- **`&`** before a letter is the access key in an open menu (`&Done`: D).
- The function is called again whenever the items are needed, so they always say how things are now.

### Step 3: the context menus

`src/app/task-list.ts` is the document with the tasks. Every task, and the list around them, has a context menu:

<!-- prettier-ignore -->
```html
<!-- The list has a context menu of its own: a right-click on its empty part. -->
<ul [grdContextMenu]="listMenu">
  @for (task of tasks.list(); track task.id) {
    <!--
      Every task has its context menu: the right mouse button, the Menu key or Shift+F10. The
      function makes the items when the menu opens. The menu of a task wins over the menu of
      the list around it.
    -->
    <li
      tabindex="0"
      [class.selected]="task.id === tasks.selectedId()"
      [class.done]="task.done"
      [grdContextMenu]="() => menuOf(task)"
      (click)="tasks.select(task.id)"
      (focus)="tasks.select(task.id)"
    >
      {{ task.title }}
    </li>
  }
</ul>
```

- **`[grdContextMenu]="listMenu"`** gives the list a menu: a list of items (here only _New task_). A right-click on the empty part of the list opens it.
- **`[grdContextMenu]="() => menuOf(task)"`** gives each task its menu, as a function: the menu calls it when it opens, so the items are made for that task at that moment.
- **The inner menu wins**: a right-click on a task opens the menu of the task, not the one of the list.
- **The keyboard opens it too**: the Menu key or Shift+F10 on a task that has the focus (`tabindex="0"` lets a task take the focus). The menu then opens under the task, with the first item highlighted.
- Where no element has a menu (the hint under the list), the browser shows its own.

`menuOf` selects the task first, so the commands work on it:

```ts
/** The context menu of a task: the task is selected first, then the commands are made for it. */
protected menuOf(task: Task): GrdMenuItem[] {
  this.tasks.select(task.id);
  return taskCommands(this.tasks);
}
```

The log (`src/app/log-tool.ts`) has a menu of its own, with one item:

<!-- prettier-ignore -->
```html
<div class="log" [grdContextMenu]="menu">
  @for (line of tasks.log(); track $index) {
    <div>{{ line }}</div>
  } @empty {
    <div class="hint">Nothing yet. Right-click here to clear the log.</div>
  }
</div>
```

### Step 4: the menu bar, and the keys

`src/app/app.ts` puts the same commands into the menu bar:

```ts
/** The menu bar has the commands of the tasks. A computed: enabled and checked follow the selection. */
protected readonly menus = computed<GrdMenu[]>(() => [
  { id: 'task', label: '&Task', items: taskCommands(this.tasks) },
]);
```

<!-- prettier-ignore -->
```html
<!-- [shortcuts]="true": the menu bar makes the keys of its items work, everywhere in the page. -->
<grd-menu-bar [menus]="menus()" [shortcuts]="true" />
```

- **`[shortcuts]="true"`** makes the menu bar register the keys of its items in `GrdShortcuts`: from then on Alt+N, Ctrl+Enter, Alt+Up, Alt+Down and Del work everywhere in the page, whatever has the focus. (A context menu only shows the keys; one place that registers them is enough.)
- **`menus` is a `computed`**: when the selection changes, the items change (`enabled`, `checked`), and the menu bar registers the keys again.

### Step 5: a key that is in no menu

F1 shows a window with the keys. It is in no menu, so the application registers it itself:

```ts
// A key that is in no menu: F1 shows the keys. GrdShortcuts is the one place where all the
// keys of the application are registered (the menu bar puts the keys of its items there too),
// so two commands cannot take the same key without a warning. register() gives back a
// function that takes the key away; the root component lives as long as the page, so it
// never needs to.
inject(GrdShortcuts).register({
  shortcut: 'F1',
  owner: 'app: keys',
  run: () => this.showKeys(),
});
```

```ts
/** F1: the keys of the commands, written as this computer has them (Ctrl+Enter, or ⌘↩ on a Mac). */
private showKeys(): void {
  const lines = taskCommands(this.tasks)
    .filter((item) => item.shortcut)
    .map((item) => `${grdDisplayAccelerator(item.shortcut!)}   ${item.label!.replace('&', '')}`);
  this.messages.info([...lines, 'F1   These keys'].join('\n'), { title: 'Keyboard shortcuts' });
}
```

- **`register({ shortcut, run, owner })`** adds a key; `owner` is the name that a report of a key taken twice shows. It gives back a function that takes the key away: a component that goes away calls it (in `DestroyRef.onDestroy`).
- **`enabled: () => boolean`** (not used here) is asked on every press: `false` skips the key, as a greyed item does.
- **`grdDisplayAccelerator('Mod+Enter')`** writes a key as this computer has it: `Ctrl+Enter`, or `⌘↩` on a Mac.

### Step 6: keys in a text field

The keys work in a text field too, except the ones that the field needs itself: a key alone (Del, the arrows, a letter; the F keys are not counted) and Ctrl+A, C, V, X, Z and Y. So in the field _New task_, Del deletes a character and Ctrl+V pastes, while Alt+N, Ctrl+Enter and F1 still run their commands (on a Mac, Option with a letter types a character in a text field, so there Alt+N runs only outside the field). Nothing has to be written for that.

### Step 7: run it

```
npm run tutorial 101
```

## Try it

1. **The context menu of a task.** Right-click _Book a table at U Fleků_: it is selected, and its menu shows the commands with their keys. Choose **Done**: the task is crossed out, and the log says _Done: Book a table at U Fleků_. Right-click it again: _Done_ has a check mark now.
2. **Greyed out.** Right-click the first task: **Move up** is grey (it cannot go higher), and so is its key.
3. **The keys.** Click _Send the invoice to Northwind_ and press **Alt+Down**: it moves down. **Ctrl+Enter** (⌘↩ on a Mac): done. **Del**: deleted, and the next task is selected.
4. **The menu of the list.** Right-click the empty part of the list: only **New task**.
5. **New task.** Press **Alt+N**: the cursor goes into the field. Type a task and press Enter. Press **Del** in the field: it deletes a character, and no task.
6. **The keyboard alone.** Tab to a task and press **Shift+F10** (or the Menu key): the menu opens under it, with the first item highlighted; Up, Down, Enter and Esc work in it.
7. **F1**: a window with all the keys.
8. **The log.** Right-click the log and choose **Clear the log**.
9. **The menu bar.** Open **Task**: the same items, the same keys, the same state as the context menu.
10. **Anywhere.** Click into the log and press **Alt+Up**: the selected task moves, although the focus is in another tab. The keys belong to the page, not to one tab.

## More

- **A key only for one tab.** Register the key in the component of the tab and take it away when the component goes away, with `enabled: () => …` asking whether its tab is active (`GrdDockingEngine.activeDocumentTab()`).
- **A modal dialog** blocks the keys of the page while it is open (the dialogs of the library do it by themselves; code of your own calls `GrdShortcuts.block()`).
- **A key taken twice** is written to the console in development mode, and `GrdShortcuts.conflicts()` lists it.
- **The ribbon** (090) registers the keys of its items the same way as the menu bar.

## The code

`src/app/tasks.ts`:

```ts
import { computed, Injectable, signal } from '@angular/core';

/** One task of the list. */
export interface Task {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
}

/**
 * The tasks, which task is selected, and what happened (the log). The list, the menus and the
 * keys all work with this one service, so they always agree.
 */
@Injectable({ providedIn: 'root' })
export class Tasks {
  private nextId = 5;

  readonly list = signal<readonly Task[]>([
    { id: 1, title: 'Send the invoice to Northwind', done: false },
    { id: 2, title: 'Call Anna about the release', done: true },
    { id: 3, title: 'Book a table at U Fleků', done: false },
    { id: 4, title: 'Review the pull request of Tomáš', done: false },
  ]);
  readonly selectedId = signal<number | null>(1);
  readonly selected = computed(
    () => this.list().find((task) => task.id === this.selectedId()) ?? null,
  );
  /** What happened, the newest first: the Log shows it. */
  readonly log = signal<readonly string[]>([]);
  /** Grows by one when somebody asks for a new task: the list then puts the cursor into its field. */
  readonly newTaskAsked = signal(0);

  select(id: number): void {
    this.selectedId.set(id);
  }

  askForNewTask(): void {
    this.newTaskAsked.update((count) => count + 1);
  }

  add(title: string): void {
    const task: Task = { id: this.nextId++, title, done: false };
    this.list.update((list) => [...list, task]);
    this.selectedId.set(task.id);
    this.write(`Added: ${title}`);
  }

  toggleDone(): void {
    const task = this.selected();
    if (!task) return;
    this.list.update((list) => list.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    this.write(`${task.done ? 'Not done' : 'Done'}: ${task.title}`);
  }

  /** Can the selected task move up (-1) or down (+1)? */
  canMove(by: -1 | 1): boolean {
    const index = this.list().findIndex((task) => task.id === this.selectedId());
    return index >= 0 && index + by >= 0 && index + by < this.list().length;
  }

  move(by: -1 | 1): void {
    if (!this.canMove(by)) return;
    const list = [...this.list()];
    const index = list.findIndex((task) => task.id === this.selectedId());
    [list[index], list[index + by]] = [list[index + by], list[index]];
    this.list.set(list);
    this.write(`Moved ${by < 0 ? 'up' : 'down'}: ${list[index + by].title}`);
  }

  remove(): void {
    const task = this.selected();
    if (!task) return;
    const index = this.list().indexOf(task);
    const list = this.list().filter((t) => t.id !== task.id);
    this.list.set(list);
    // The next task (or the one before the last) is selected, so Del can go on deleting.
    this.selectedId.set(list[Math.min(index, list.length - 1)]?.id ?? null);
    this.write(`Deleted: ${task.title}`);
  }

  clearLog(): void {
    this.log.set([]);
  }

  private write(line: string): void {
    this.log.update((log) => [line, ...log]);
  }
}
```

`src/app/task-list.ts`:

```ts
import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { GrdButton, GrdContextMenu, GrdInput, type GrdMenuItem } from '@gridify/studio';
import { taskCommands } from './commands';
import { type Task, Tasks } from './tasks';

/** The document: the list of the tasks, and a field for a new one. */
@Component({
  selector: 'app-task-list',
  imports: [GrdButton, GrdContextMenu, GrdInput],
  template: `
    <form (submit)="add($event)">
      <grd-input label="New task" [(value)]="title" [reserveMessageSpace]="false" />
      <grd-button type="submit" label="Add" />
    </form>

    <!-- The list has a context menu of its own: a right-click on its empty part. -->
    <ul [grdContextMenu]="listMenu">
      @for (task of tasks.list(); track task.id) {
        <!--
          Every task has its context menu: the right mouse button, the Menu key or Shift+F10. The
          function makes the items when the menu opens. The menu of a task wins over the menu of
          the list around it.
        -->
        <li
          tabindex="0"
          [class.selected]="task.id === tasks.selectedId()"
          [class.done]="task.done"
          [grdContextMenu]="() => menuOf(task)"
          (click)="tasks.select(task.id)"
          (focus)="tasks.select(task.id)"
        >
          {{ task.title }}
        </li>
      }
    </ul>
    <p class="hint">Right-click a task, or the empty part of the list. F1 shows the keys.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 16px;
    }
    form {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 12px;
    }
    ul {
      margin: 0;
      padding: 0 0 48px;
      list-style: none;
    }
    li {
      padding: 6px 8px;
      border-bottom: 1px solid var(--grd-border-color);
      cursor: default;
    }
    li.selected {
      background: var(--grd-bg-panel);
      font-weight: bold;
    }
    li.done {
      text-decoration: line-through;
      opacity: 0.88;
    }
    .hint {
      opacity: 0.88;
    }
  `,
})
export class TaskList {
  protected readonly tasks = inject(Tasks);
  /** The text of the field "New task". */
  protected readonly title = signal('');
  private readonly field = viewChild.required(GrdInput);

  /** The context menu of the empty part of the list: only New task. */
  protected readonly listMenu: GrdMenuItem[] = [
    { label: 'New task', shortcut: 'Alt+N', run: () => this.tasks.askForNewTask() },
  ];

  constructor() {
    // "New task" (from a menu or by Alt+N): the cursor goes into the field.
    effect(() => {
      if (this.tasks.newTaskAsked() > 0) untracked(() => this.field().focus());
    });
  }

  /** The context menu of a task: the task is selected first, then the commands are made for it. */
  protected menuOf(task: Task): GrdMenuItem[] {
    this.tasks.select(task.id);
    return taskCommands(this.tasks);
  }

  /** The form: Enter in the field, or Add. */
  protected add(event: Event): void {
    event.preventDefault();
    const title = this.title().trim();
    if (!title) return;
    this.tasks.add(title);
    this.title.set('');
  }
}
```

`src/app/app.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  grdDisplayAccelerator,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdShortcuts,
} from '@gridify/studio';
import { taskCommands } from './commands';
import { LogTool } from './log-tool';
import { TaskList } from './task-list';
import { Tasks } from './tasks';

/** The list of the tasks (a document) on the left, the log (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 65,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'tasks', role: 'document', title: 'Tasks', componentKey: 'tasks' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- [shortcuts]="true": the menu bar makes the keys of its items work, everywhere in the page. -->
    <grd-menu-bar [menus]="menus()" [shortcuts]="true" />
    <grd-docking-engine layoutStorageKey="tutorial-101-layout" [defaultLayout]="layout" />
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
  private readonly tasks = inject(Tasks);
  private readonly messages = inject(GrdMessageBox);

  protected readonly layout = LAYOUT;

  /** The menu bar has the commands of the tasks. A computed: enabled and checked follow the selection. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    { id: 'task', label: '&Task', items: taskCommands(this.tasks) },
  ]);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('tasks', TaskList);
    registry.registerComponent('log', LogTool);

    // A key that is in no menu: F1 shows the keys. GrdShortcuts is the one place where all the
    // keys of the application are registered (the menu bar puts the keys of its items there too),
    // so two commands cannot take the same key without a warning. register() gives back a
    // function that takes the key away; the root component lives as long as the page, so it
    // never needs to.
    inject(GrdShortcuts).register({
      shortcut: 'F1',
      owner: 'app: keys',
      run: () => this.showKeys(),
    });
  }

  /** F1: the keys of the commands, written as this computer has them (Ctrl+Enter, or ⌘↩ on a Mac). */
  private showKeys(): void {
    const lines = taskCommands(this.tasks)
      .filter((item) => item.shortcut)
      .map((item) => `${grdDisplayAccelerator(item.shortcut!)}   ${item.label!.replace('&', '')}`);
    this.messages.info([...lines, 'F1   These keys'].join('\n'), { title: 'Keyboard shortcuts' });
  }
}
```

## Build it yourself

`npm run tutorial:eject 101 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `tasks.ts`, `commands.ts`, `task-list.ts` and `log-tool.ts` to `src/app`, and replace `app.ts` with the one above.
