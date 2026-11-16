# 120 – A component that saves its state

This tutorial shows how a component saves a state of its own with the layout, so that what the user typed and chose in it comes back after F5. You will learn how to:

- implement `GrdPersistable`: the engine asks the component for its state on every save (`persist()`) and gives the state back after a reload (`restore()`);
- tell the engine that the state has changed (`GrdTabContext.requestSave()`);
- mark the tab as changed until it is saved (`setDirty`); the engine saves the mark with the state, so it is on the tab right after F5.

In 015 a component comes back as a new one: the counter says _Clicked 0 times_ again. Here a task keeps its title, its estimate and its priority. It is the application of 015 with a few lines more, from the series about saving (110–125).

```
npm run tutorial 120
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30120, add a task (**File › Add task**), give it a title, an estimate and a priority, and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30120), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-120-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

In the template of `App`, the engine gets the key of this tutorial:

```html
<!-- a key of its own: everything that runs on one address shares one localStorage -->
<grd-docking-engine layoutStorageKey="tutorial-120-layout" />
```

### Step 2: a task

Add `src/app/task.ts` (the whole file is in [The code](#the-code)). It is a form of the library's fields: a title (`grd-input`), an estimate in hours with − and + (`grd-button`), a priority (`grd-select`), and **Save**. What the user changes is in signals:

```ts
protected readonly title = signal('');
protected readonly hours = signal(1);
protected readonly priority = signal<Priority>('Normal');
protected readonly unsaved = signal(false);
```

### Step 3: persist and restore

The class implements `GrdPersistable<TaskState>`, where `TaskState` is the shape of the state: `{ title, hours, priority }`. Two methods:

```ts
/** The engine calls it on every save of the layout: the state goes into the saved layout with the tab. */
persist(): GrdPersistedState<TaskState> {
  return {
    v: 1,
    data: {
      title: this.title(),
      hours: this.hours(),
      priority: this.priority(),
    },
  };
}

/** The engine calls it after a reload, before the first render: the saved state comes back. */
restore(state: GrdPersistedState<TaskState>): void {
  const { title, hours, priority } = state.data;
  this.title.set(title);
  this.hours.set(hours);
  this.priority.set(priority);
  // The engine saved the mark of the tab with the state and has put it back: the task reads it.
  this.unsaved.set(this.tab.dirty);
  this.restored = true;
}
```

`persist` returns `{ v, data }`: `data` is the state as JSON, and `v` the version of its shape (tutorial 121 is about what `v` is for). `restored` only chooses the line at the bottom of the task. Whether the task is saved is not in the state: the mark of the tab says it, and step 5 is about it.

### Step 4: tell the engine about a change

The engine sees when the layout changes, but not when a text in a tab changes. Every change of the task ends here:

```ts
/** After every change: mark the tab as changed, and ask the engine to save the layout (with the state of the task in it). */
private changed(): void {
  this.unsaved.set(true);
  this.tab.setDirty(true);
  this.tab.requestSave();
}
```

`this.tab` is the context of the tab the task is in: `private readonly tab = inject(GrdTabContext);`. `requestSave()` asks the engine to save the layout, with the state of the task in it. `setDirty(true)` puts the mark of unsaved changes (a dot) on the tab.

### Step 5: Save, and the mark after a reload

**Save** takes the mark away:

```ts
/** In an application this sends the task to the server; here it only marks the task as saved. */
protected save(): void {
  this.unsaved.set(false);
  this.tab.setDirty(false);
  this.tab.requestSave();
}
```

The engine saves the mark with the layout, because the task saves its state: the changes the mark is about are in that state, so after a reload they are there and the mark is right. After F5 the mark is on the tab at once, also while the task is not shown and its component is not made yet. The task reads it in `restore` (the line `this.unsaved.set(this.tab.dirty)` of step 3): `dirty` of the context is the mark of its tab. A tab whose component does not save a state gets no saved mark: its changes are gone after a reload.

### Step 6: register it and open it

In the constructor of `App`, `registry.registerComponent('task', Task);` under the counter, and a new first item of the menu **File**:

```ts
{
  label: 'Add &task',
  run: () => this.engine().openComponentTab({ title: 'Task', componentKey: 'task' }),
},
```

### Step 7: the counter says that it saves nothing

The counter of 015 still saves nothing, for comparison: it is not `GrdPersistable`. A line under its button says so (in `src/app/counter.ts`):

<!-- prettier-ignore -->
```html
<p class="note">
  This counter does not save its state: after F5 it starts from 0 again. A task (File › Add
  task) saves its state, and comes back as it was.
</p>
```

## Try it

1. **File › Add task.** The task says _A new task: change it, then press F5._ It is _Saved_, and **Save** is disabled.
2. **Change it:** a title, + twice (3 h), the priority _High_. The task says _Unsaved changes_, and the tab has a dot.
3. **File › Add component** and click the counter three times.
4. **Press F5.** The counter says _Clicked 0 times_: it has no state to save, as the line under it says. The **Task** tab has its dot at once, before you show it. Click it: the title, _3 h_, _High_, _Unsaved changes_, and _Restored from the saved layout._ The component of a tab is made when the tab is first shown, but the mark was saved by the engine, with the state.
5. **Save.** The dot goes, and the task says _Saved_. Press F5: still saved, with the same values.
6. **Add a second task** and change it. After F5 each task has its own state.
7. **See what is saved.** In the developer tools, _Application › Local storage › http://localhost:30120_, the key `tutorial-120-layout`: every task tab has `"persistedState": {"v": 1, "data": {...}}`, and a task with unsaved changes has `"dirty": true` too. The counter has neither.
8. **File › Reset layout** empties the area.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';
import { Task } from './task';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- a key of its own: everything that runs on one address shares one localStorage -->
    <grd-docking-engine layoutStorageKey="tutorial-120-layout" />
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

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    // The counter of 015: it has no state of its own to save, so it starts from 0 after a reload.
    registry.registerComponent('counter', Counter);
    // The task saves its state (GrdPersistable): it comes back as it was.
    registry.registerComponent('task', Task);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &task',
          run: () => this.engine().openComponentTab({ title: 'Task', componentKey: 'task' }),
        },
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
```

`src/app/task.ts`:

```ts
import { Component, inject, signal } from '@angular/core';
import {
  GrdButton,
  GrdInput,
  GrdLabel,
  GrdOption,
  GrdPersistable,
  GrdPersistedState,
  GrdSelect,
  GrdTabContext,
} from '@gridify/studio';

type Priority = 'Low' | 'Normal' | 'High';

/** What a task saves with the layout: everything the user can change. */
interface TaskState {
  title: string;
  hours: number;
  priority: Priority;
}

/**
 * A task with a title, an estimate and a priority. It implements `GrdPersistable`: the engine asks it for its state on every save of
 * the layout (`persist`) and gives the state back after a reload (`restore`), so what the user typed is there again after F5.
 */
@Component({
  selector: 'app-task',
  imports: [GrdButton, GrdInput, GrdLabel, GrdSelect],
  template: `
    <grd-input label="Title" [value]="title()" (valueChange)="setTitle($event)" />
    <div class="field">
      <grd-label>Estimate</grd-label>
      <div class="row">
        <grd-button label="−" [disabled]="hours() === 0" (pressed)="addHours(-1)" />
        <output>{{ hours() }} h</output>
        <grd-button label="+" (pressed)="addHours(1)" />
      </div>
    </div>
    <grd-select
      label="Priority"
      [options]="priorities"
      [value]="priority()"
      (valueChange)="setPriority($event)"
    />
    <div class="row">
      <grd-button label="Save" variant="primary" [disabled]="!unsaved()" (pressed)="save()" />
      <span class="status">{{ unsaved() ? 'Unsaved changes' : 'Saved' }}</span>
    </div>
    <p class="note">
      {{ restored ? 'Restored from the saved layout.' : 'A new task: change it, then press F5.' }}
    </p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 360px;
      padding: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    output {
      min-width: 3em;
      text-align: center;
    }
    .status,
    .note {
      opacity: 0.88;
    }
    .note {
      margin: 0;
    }
  `,
})
export class Task implements GrdPersistable<TaskState> {
  private readonly tab = inject(GrdTabContext);
  protected readonly priorities: GrdOption<Priority>[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
  ];

  protected readonly title = signal('');
  protected readonly hours = signal(1);
  protected readonly priority = signal<Priority>('Normal');
  protected readonly unsaved = signal(false);
  /** Did the state come from the saved layout? Only for the note at the bottom. */
  protected restored = false;

  /** The engine calls it on every save of the layout: the state goes into the saved layout with the tab. */
  persist(): GrdPersistedState<TaskState> {
    return {
      v: 1,
      data: {
        title: this.title(),
        hours: this.hours(),
        priority: this.priority(),
      },
    };
  }

  /** The engine calls it after a reload, before the first render: the saved state comes back. */
  restore(state: GrdPersistedState<TaskState>): void {
    const { title, hours, priority } = state.data;
    this.title.set(title);
    this.hours.set(hours);
    this.priority.set(priority);
    // The engine saved the mark of the tab with the state and has put it back: the task reads it.
    this.unsaved.set(this.tab.dirty);
    this.restored = true;
  }

  protected setTitle(title: string): void {
    this.title.set(title);
    this.changed();
  }

  protected addHours(step: number): void {
    this.hours.update((hours) => Math.max(0, hours + step));
    this.changed();
  }

  protected setPriority(priority: Priority | null): void {
    if (!priority) return;
    this.priority.set(priority);
    this.changed();
  }

  /** In an application this sends the task to the server; here it only marks the task as saved. */
  protected save(): void {
    this.unsaved.set(false);
    this.tab.setDirty(false);
    this.tab.requestSave();
  }

  /** After every change: mark the tab as changed, and ask the engine to save the layout (with the state of the task in it). */
  private changed(): void {
    this.unsaved.set(true);
    this.tab.setDirty(true);
    this.tab.requestSave();
  }
}
```

`src/app/counter.ts`:

```ts
import { Component, signal } from '@angular/core';
import { GrdButton } from '@gridify/studio';

/**
 * The counter of 015, with a line under it. It keeps its clicks while the tab is moved around, but it saves nothing
 * (it is not `GrdPersistable`), so after F5 it starts from 0 again.
 */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>An Angular component with a signal.</p>
    <grd-button [label]="'Clicked ' + clicks() + ' times'" (pressed)="clicks.set(clicks() + 1)" />
    <p class="note">
      This counter does not save its state: after F5 it starts from 0 again. A task (File › Add
      task) saves its state, and comes back as it was.
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class Counter {
  protected readonly clicks = signal(0);
}
```

`src/styles.scss` is the one of 015.

## How it fits together

- **`GrdPersistable`** is an interface of two methods, `persist()` and `restore(state)`. An interface does not exist at runtime, so the engine looks at the component itself: one that has both methods saves its state with its tab.
- **`persist()` runs on every save of the layout**: after every change of the layout, after `requestSave`, and when the page is closed. It runs for every component that is alive, so it must be quick and synchronous, and it returns JSON. The state goes into the saved layout with its tab (`persistedState`), under the key of the engine.
- **`restore(state)` runs before the first render.** After a reload the engine makes the component, hands it the saved state, and only then attaches it to change detection: `ngOnInit` sees the restored state, and the default state never flashes. `restore` may return a promise; the tab shows the loader until it settles. Keep it quick: data from a server is better loaded by the component afterwards, with a loader of its own.
- **A tab that has not been shown** after a reload has no component yet. Its saved state stays in the layout as it was, on every save, until the tab is shown and the component takes it.
- **`requestSave()`** asks for a save of the layout. The requests are merged (one save 250 ms after the last one), so typing writes once, not once a letter, and nothing is saved while automatic saving is off. Without it the state would still be written when the page is closed, but not when the browser crashes or the tab is killed.
- **`setDirty(dirty)`** draws the mark of unsaved changes on the tab, wherever the tab is (a panel, a floating window), and `tabConfirmClose`, the event before a tab is closed, says `dirty: true` for it. For a component that saves its state the engine saves the mark with the layout and puts it back after a reload, before the component is made; `dirty` of the context reads it. What the component sets after `restore` wins. For any other tab the mark lives only while the page runs.
- **`requestSave()` is a change of the layout too:** after it (merged, 250 ms) the engine tells `layoutChanged` with `persisted: true`, also with automatic saving off, so an application that saves by hand (tutorial 112) sees that there is something to save.
- **`GrdTabContext`** is given to every component that the engine makes for a tab, through `inject()`. A component that injects it can live only in a tab.
- **No required inputs.** A component with `GrdPersistable` gets what it is from `restore`, not from inputs: after a reload there is nobody to give it inputs.

## What you get without writing any of it

- **When to save**: after every change of the layout, after `requestSave` (merged), and when the page is closed, with the state of every live component in the layout.
- **One place for everything**: the layout and the states of the components under one key in `localStorage`.
- **The state handed back before the first render**, and kept for the tabs that are not shown yet.
- **The mark of unsaved changes** drawn in the tab, in a panel or in a floating window, in the colors of the theme, and saved with the state of the component, so it is on the tab right after a reload.
- **Errors reported, not fatal**: a `persist()` that throws, or does not return `{ v: number, data }`, is reported once in the console, and the tab is saved without its state; a `restore()` that throws leaves the component in its default state, and the saved state is kept as it was (tutorial 121).

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 120 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new component-state --style=scss --ssr=false --skip-tests
   cd component-state
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` and `src/app/task.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
