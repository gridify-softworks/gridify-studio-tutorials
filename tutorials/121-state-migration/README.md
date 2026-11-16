# 121 – Migrating a saved state

This tutorial shows how to change the shape of a saved state in a new release without losing what the users saved with the old one. You will learn how to:

- give a saved state a version (`{ v, data }`);
- turn an old version into the new one in `restore`, in one function, and write the new version back;
- keep a state of a newer version, which this code does not know, as it was (`restore` returns `false`).

The state that a component saves (120) stays in the browser of the user longer than the code that wrote it. Here a sticky note: in version 1 of its state a note was only a text, version 2 adds a color. Two commands write an old (version 1) and a newer (version 3) save, so that F5 shows both. It is the application of 015 with a few lines more, from the series about saving (110–125).

```
npm run tutorial 121
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30121, add a note (**File › Add note**), write something and pick a color. Then **File › Write an old (version 1) save** and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30121), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-121-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

The command of step 6 reads and writes the saved layout, so the key is a constant:

```ts
/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-121-layout';
```

`App` gets the field `protected readonly layoutKey = LAYOUT_KEY;`, and the template binds it:

```html
<grd-docking-engine [layoutStorageKey]="layoutKey" />
```

### Step 2: the versions of the state

Add `src/app/note.ts` (the whole file is in [The code](#the-code)). Above the component, one interface for each shape the state ever had, and the version that this code writes:

```ts
/** Version 1 of the state, as the first release saved it: a note was only a text. */
interface NoteV1 {
  text: string;
}

/** Version 2 of the state: a note has a color as well. */
interface NoteV2 {
  text: string;
  color: NoteColor;
}

/** The version of the state that this code writes. */
const VERSION = 2;
```

### Step 3: one function for the migration

```ts
function migrate(state: GrdPersistedState): NoteV2 | null {
  switch (state.v) {
    case 1: {
      const { text } = state.data as NoteV1;
      return { text, color: 'yellow' };
    }
    case 2:
      return state.data as NoteV2;
    default:
      return null;
  }
}
```

A note of version 1 gets the color that every note had then: yellow. A version this code does not know, written by a newer release, gives `null`.

### Step 4: persist the new version, restore any

```ts
/** Always the current version. */
persist(): GrdPersistedState<NoteV2> {
  return { v: VERSION, data: { text: this.text(), color: this.color() } };
}

/**
 * Any version: the old ones are migrated first. A version that is not known gives `false`: the engine keeps the saved state as it
 * is, so this older code does not write over what a newer release saved, until the note is changed.
 */
restore(state: GrdPersistedState): boolean {
  const data = migrate(state);
  if (!data) {
    this.unknownVersion = state.v;
    return false;
  }
  this.text.set(data.text);
  this.color.set(data.color);
  this.savedVersion = state.v;
  return true;
}
```

The class implements `GrdPersistable` without a type argument: `restore` gets `GrdPersistedState` with `data` of an unknown type, because it may be any version. `savedVersion` is for the line under the note: _A new note_, _Restored from a state of version 2_, or _Migrated from a state of version 1 to version 2_.

`restore` returns `true` when it has read the state and `false` when it cannot: a version that is not known was written by a newer release (the user went back to an older one). The note starts empty, and the engine keeps the saved state of its tab as it was: on every save it writes that state again instead of asking the note (`persist`), so the newer state is not lost. The first `requestSave()` of the note, after a change by the user, ends it: from then on the note saves its own state. `unknownVersion` says it under the note:

```ts
/** The version of a saved state that this code cannot read (a newer release wrote it), or `null`. */
protected unknownVersion: number | null = null;
```

### Step 5: write the migrated state back

```ts
ngOnInit(): void {
  // A migrated state is written back at once, in the current version.
  if (this.savedVersion !== null && this.savedVersion !== VERSION) this.tab.requestSave();
}
```

`this.tab` is `inject(GrdTabContext)`, as in 120. Every change of the text or the color calls `this.tab.requestSave()` too.

### Step 6: an old and a newer save, for the tutorial

In an application the old states come from the users' browsers, saved by the release before, and a newer state from a user who went back to an older release. Here two commands make them. Both rewrite the notes of the saved layout:

```ts
/**
 * Only for the tutorial: makes the saved layout look as if another release had saved it, with every note in the state that
 * `stateOf` makes of its text and color. An application never writes the saved layout itself.
 */
private rewriteNotes(
  stateOf: (data: { text: string; color: string }) => GrdPersistedState,
): void {
  // Save now, so that the last change is in, then stop saving: the engine would write the notes in version 2 again
  // (after the next change, and when the page is closed). After F5 the constructor turns the saving on again.
  this.engine().saveLayout();
  this.settings.setAutoSaveLayout(false);

  const saved = localStorage.getItem(LAYOUT_KEY);
  if (!saved) return;
  // Every tab of a note, wherever it is in the layout (a panel, a floating window), gets the new state.
  const rewritten = JSON.parse(saved, (_key, value) =>
    value?.componentKey === 'note' && value.persistedState
      ? { ...value, persistedState: stateOf(value.persistedState.data) }
      : value,
  );
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(rewritten));
}
```

The old save keeps only the text, as the first release did; the newer one adds a field that this code does not know, as a release after it might:

```ts
/** Only for the tutorial: the notes as the first release saved them, in version 1 (only the text). */
private writeOldSave(): void {
  this.rewriteNotes((data) => ({ v: 1, data: { text: data.text } }));
```

```ts
/** Only for the tutorial: the notes as a newer release would save them, in version 3 (one field more), which this code does not know. */
private writeNewerSave(): void {
  this.rewriteNotes((data) => ({ v: 3, data: { ...data, pinned: true } }));
```

Each then says what to do in a dialog (`tell`, a `GrdDialog` with OK). `App` injects the settings and the dialogs for it: `private readonly settings = inject(GrdEngineSettings);` and `private readonly dialogs = inject(GrdDialog);`, and imports the type `GrdPersistedState`. The second argument of `JSON.parse` is called for every object of the JSON, so the tabs of the notes are found wherever they are.

### Step 7: register the note and open it

In the constructor of `App`, `registry.registerComponent('note', Note);` under the counter, and the menu **File**:

```ts
{
  label: 'Add &note',
  run: () => this.engine().openComponentTab({ title: 'Note', componentKey: 'note' }),
},
```

with **Write an &old (version 1) save** and **Write a &newer (version 3) save** between two separators, above **Reset layout**.

### Step 8: the counter says that it saves nothing

The counter of 015 still saves nothing, for comparison: it is not `GrdPersistable`. A line under its button says so (in `src/app/counter.ts`):

<!-- prettier-ignore -->
```html
<p class="note">
  This counter does not save its state: after F5 it starts from 0 again. A note (File › Add
  note) saves its state, and comes back as it was.
</p>
```

## Try it

1. **File › Add note.** The note is yellow and says _A new note. It saves its state as version 2._ Write _Buy milk_ and pick green.
2. **Add a second note**, write _Call Ada_ and pick blue.
3. **Press F5.** Both notes are back with their colors, and the active one says _Restored from a state of version 2._
4. **File › Write an old (version 1) save.** A dialog says to press F5. In the developer tools, _Application › Local storage › http://localhost:30121_, the key `tutorial-121-layout`: both notes are `"persistedState": {"v": 1, "data": {"text": "…"}}`, without a color. Change a note now and look again: nothing is saved until the reload.
5. **Press F5.** The active note has its text, it is yellow, and it says _Migrated from a state of version 1 to version 2._ In `localStorage` it is version 2 already; the other note is still version 1, because its component is made only when its tab is shown. Click it: migrated too, and saved as version 2.
6. **Press F5 again.** _Restored from a state of version 2._: the migration happened once.
7. **A state from the future.** **File › Write a newer (version 3) save**, then F5. The active note starts empty and says _Not known: a state of version 3._ In `localStorage` both notes are still version 3, with their texts. **Press F5 again**: still version 3, although the engine saved the layout in between. **Write something into the note:** from that change on the note saves its own state, in version 2 (and the other note keeps its version 3 until it is changed).
8. **File › Reset layout** empties the area.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  type GrdPersistedState,
} from '@gridify/studio';
import { Counter } from './counter';
import { Note } from './note';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-121-layout';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
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
  private readonly settings = inject(GrdEngineSettings);
  private readonly dialogs = inject(GrdDialog);
  protected readonly layoutKey = LAYOUT_KEY;

  constructor() {
    this.settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('note', Note);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &note',
          run: () => this.engine().openComponentTab({ title: 'Note', componentKey: 'note' }),
        },
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { separator: true },
        { label: 'Write an &old (version 1) save', run: () => this.writeOldSave() },
        { label: 'Write a &newer (version 3) save', run: () => this.writeNewerSave() },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];

  /** Only for the tutorial: the notes as the first release saved them, in version 1 (only the text). */
  private writeOldSave(): void {
    this.rewriteNotes((data) => ({ v: 1, data: { text: data.text } }));
    this.tell(
      'An old save is written',
      'The notes are saved in version 1 now, as the first release saved them. Press F5: they come back migrated to version 2. Until then nothing is saved.',
    );
  }

  /** Only for the tutorial: the notes as a newer release would save them, in version 3 (one field more), which this code does not know. */
  private writeNewerSave(): void {
    this.rewriteNotes((data) => ({ v: 3, data: { ...data, pinned: true } }));
    this.tell(
      'A newer save is written',
      'The notes are saved in version 3 now, as a newer release would save them. Press F5: this code cannot read them, so the notes start empty, and their saved state stays as it is until a note is changed.',
    );
  }

  /**
   * Only for the tutorial: makes the saved layout look as if another release had saved it, with every note in the state that
   * `stateOf` makes of its text and color. An application never writes the saved layout itself.
   */
  private rewriteNotes(
    stateOf: (data: { text: string; color: string }) => GrdPersistedState,
  ): void {
    // Save now, so that the last change is in, then stop saving: the engine would write the notes in version 2 again
    // (after the next change, and when the page is closed). After F5 the constructor turns the saving on again.
    this.engine().saveLayout();
    this.settings.setAutoSaveLayout(false);

    const saved = localStorage.getItem(LAYOUT_KEY);
    if (!saved) return;
    // Every tab of a note, wherever it is in the layout (a panel, a floating window), gets the new state.
    const rewritten = JSON.parse(saved, (_key, value) =>
      value?.componentKey === 'note' && value.persistedState
        ? { ...value, persistedState: stateOf(value.persistedState.data) }
        : value,
    );
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(rewritten));
  }

  /** A dialog with a title, a text and OK. */
  private tell(title: string, text: string): void {
    this.dialogs.open({
      title,
      text,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
```

`src/app/note.ts`:

```ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { GrdPersistable, GrdPersistedState, GrdTabContext } from '@gridify/studio';

type NoteColor = 'yellow' | 'green' | 'blue' | 'pink';

/** Version 1 of the state, as the first release saved it: a note was only a text. */
interface NoteV1 {
  text: string;
}

/** Version 2 of the state: a note has a color as well. */
interface NoteV2 {
  text: string;
  color: NoteColor;
}

/** The version of the state that this code writes. */
const VERSION = 2;

/**
 * Turns a saved state of any version this code knows into the current one. A note of version 1 gets the color that every note had
 * then, yellow. A version this code does not know (written by a newer release) gives `null`.
 */
function migrate(state: GrdPersistedState): NoteV2 | null {
  switch (state.v) {
    case 1: {
      const { text } = state.data as NoteV1;
      return { text, color: 'yellow' };
    }
    case 2:
      return state.data as NoteV2;
    default:
      return null;
  }
}

/** A sticky note: a text and a color. Its state carries a version, and `restore` reads the old versions too. */
@Component({
  selector: 'app-note',
  template: `
    <div class="colors" role="group" aria-label="Color">
      @for (option of colors; track option) {
        <button
          type="button"
          [class]="option"
          [attr.aria-label]="option"
          [attr.aria-pressed]="option === color()"
          (click)="setColor(option)"
        ></button>
      }
    </div>
    <textarea
      #textArea
      [class]="color()"
      aria-label="Note"
      placeholder="Write something…"
      [value]="text()"
      (input)="setText(textArea.value)"
    ></textarea>
    <p class="version">
      @if (unknownVersion !== null) {
        <strong>Not known:</strong> a state of version {{ unknownVersion }}. The note starts empty,
        and the state stays saved as it was until the note is changed.
      } @else {
        @switch (savedVersion) {
          @case (null) {
            A new note. It saves its state as version {{ version }}.
          }
          @case (version) {
            Restored from a state of version {{ version }}.
          }
          @default {
            <strong>Migrated</strong> from a state of version {{ savedVersion }} to version
            {{ version }}.
          }
        }
      }
    </p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 440px;
      padding: 16px;
    }
    .yellow {
      --note: #fff1a8;
    }
    .green {
      --note: #cdf2c9;
    }
    .blue {
      --note: #cfe4ff;
    }
    .pink {
      --note: #ffd3e4;
    }
    .colors {
      display: flex;
      gap: 8px;
    }
    .colors button {
      width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid rgb(0 0 0 / 0.25);
      border-radius: 50%;
      background: var(--note);
      cursor: pointer;
    }
    .colors button[aria-pressed='true'] {
      outline: 2px solid var(--grd-accent);
      outline-offset: 2px;
    }
    textarea {
      min-height: 180px;
      padding: 12px;
      border: none;
      border-radius: 4px;
      background: var(--note);
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
      color: #1f2328;
      font: inherit;
      resize: vertical;
    }
    .version {
      margin: 0;
      opacity: 0.88;
    }
  `,
})
export class Note implements GrdPersistable, OnInit {
  private readonly tab = inject(GrdTabContext);
  protected readonly colors: NoteColor[] = ['yellow', 'green', 'blue', 'pink'];
  protected readonly version = VERSION;

  protected readonly text = signal('');
  protected readonly color = signal<NoteColor>('yellow');
  /** The version of the state the note came back from, or `null` for a new note. */
  protected savedVersion: number | null = null;
  /** The version of a saved state that this code cannot read (a newer release wrote it), or `null`. */
  protected unknownVersion: number | null = null;

  /** Always the current version. */
  persist(): GrdPersistedState<NoteV2> {
    return { v: VERSION, data: { text: this.text(), color: this.color() } };
  }

  /**
   * Any version: the old ones are migrated first. A version that is not known gives `false`: the engine keeps the saved state as it
   * is, so this older code does not write over what a newer release saved, until the note is changed.
   */
  restore(state: GrdPersistedState): boolean {
    const data = migrate(state);
    if (!data) {
      this.unknownVersion = state.v;
      return false;
    }
    this.text.set(data.text);
    this.color.set(data.color);
    this.savedVersion = state.v;
    return true;
  }

  ngOnInit(): void {
    // A migrated state is written back at once, in the current version.
    if (this.savedVersion !== null && this.savedVersion !== VERSION) this.tab.requestSave();
  }

  protected setText(text: string): void {
    this.text.set(text);
    this.tab.requestSave();
  }

  protected setColor(color: NoteColor): void {
    this.color.set(color);
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
      This counter does not save its state: after F5 it starts from 0 again. A note (File › Add
      note) saves its state, and comes back as it was.
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

- **`v` belongs to the component.** The engine stores `{ v, data }` with the tab and gives it back to `restore` as it was saved. It checks only that `v` is a number; what the versions mean is up to the component.
- **`restore` gets whatever was saved**: a state of this release, of an older one, or of a newer one, if the user went back to an older release. So its parameter is `GrdPersistedState` with an unknown `data`, and `migrate` looks at `v` before it trusts `data`.
- **A new field needs a value for the old states.** The best one is the value that the old code behaved as: every note of the first release was yellow.
- **More versions, in steps.** With a version 3, `migrate` turns version 1 into version 2 and version 2 into version 3, one step after the other. Each step is written once, and the old steps never change.
- **A version that is not known** is a state of a newer release. The note cannot read it, so it starts empty, and `restore` returns `false`: the engine keeps the saved state of the tab as it was, on every save, until the note asks for a save of its own (`requestSave`, after a change by the user). So going back to an older release for a while does not lose what the newer one saved. A `restore` that throws is taken the same way.
- **Writing back.** A migrated state is new only in the memory of the page until the next save. `requestSave()` in `ngOnInit` writes it at once, so the old shape leaves `localStorage`. A tab that is not shown keeps its old state until it is shown: the migration code stays as long as old saves can exist.
- **The layout has a version of its own.** The saved layout is `"version": 1`, the version of the format of the engine. A layout of another version is not loaded: the engine starts from its default layout. The `v` of a component is inside that layout, and the engine does not look at it.
- **Why the command stops the saving.** With automatic saving on, the engine writes the layout after every change and when the page is closed, with the notes as they are in the page, in version 2. The old save would be gone before the reload. `saveLayout()` first writes what the page has now, `setAutoSaveLayout(false)` stops the saving, and the constructor turns it on again after F5.

## What you get without writing any of it

- **The version stored with the state** of every tab, and handed back with it.
- **Every state of a tab handed to `restore` before the first render**, so a migrated note never shows its default state first.
- **A state that is not understood is kept**: after `restore` returns `false`, the engine saves the state as it was read, until the component asks for a save.
- **One save for a burst of requests**: `requestSave` after the migration and after typing writes once.
- **A layout of another format is not read**: the engine starts from its default layout instead of failing on it.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 121 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new state-migration --style=scss --ssr=false --skip-tests
   cd state-migration
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` and `src/app/note.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
