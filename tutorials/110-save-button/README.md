# 110 – A save button

This tutorial shows how to save the layout only when the user asks for it, instead of after every change. You will learn how to:

- turn the automatic saving off and keep the layout under a key of your own;
- save with a **Save layout** button at the end of the menu bar, with **File › Save layout** and with Ctrl+S (`saveLayout()`);
- show the time of the last save in the status bar (`layoutSaved`).

A series about saving starts here, one thing at a time (110–125). F5 shows the layout that was saved last, and whatever changed after it is lost. It is the application of 015 with a few lines changed.

```
npm run tutorial 110
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30110, add two tabs (**File › Add component**, **File › Add HTML**), click **Save layout**, add a third tab and press F5: the two saved tabs are back, the third is gone.

Every tutorial runs on an address of its own (this one on http://localhost:30110), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-110-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: no automatic saving, a key of its own

Take `inject(GrdEngineSettings).setAutoSaveLayout(true);` out of the constructor (and `GrdEngineSettings` out of the imports). Automatic saving is off by default: the engine loads the saved layout when it starts, and writes the layout only when it is told to. The constructor keeps the registration of the component:

```ts
constructor() {
  // A saved tab names its component by a key: the key must be known before the layout comes back.
  inject(GrdContentRegistry).registerComponent('counter', Counter);
}
```

Give the engine the key of this tutorial and listen to `layoutSaved` (step 4):

```html
<!-- Automatic saving is off (the default): the layout is written only when save() asks for it. -->
<grd-docking-engine layoutStorageKey="tutorial-110-layout" (layoutSaved)="saved()" />
```

### Step 2: the Save button

A button at the end of the menu bar: a `grd-button` with the attribute `grdMenuBarEnd` goes into the fixed end of the bar, on the right. Add `GrdButton` to the imports of the component and of the file:

```html
<grd-menu-bar [menus]="menus" shortcuts>
  <grd-button grdMenuBarEnd label="Save layout" variant="primary" (pressed)="save()" />
</grd-menu-bar>
```

The button calls `saveLayout()` of the engine. That is all saving takes:

```ts
/** Writes the layout as it is now; the engine answers with `layoutSaved`. */
protected save(): void {
  this.engine().saveLayout();
}
```

### Step 3: Save in the menu and on Ctrl+S

**File** gets the same command, with a shortcut:

```ts
{ separator: true },
{ label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
{ label: '&Reset layout', run: () => this.engine().resetLayout() },
```

`Mod` is Ctrl (⌘ on a Mac). The menu shows the shortcut; the attribute `shortcuts` of the menu bar (step 2) makes it work while the menu is closed, and keeps the browser from opening its own _Save page as_.

### Step 4: the time of the last save

The engine tells every save with the output `layoutSaved`. `saved()` keeps the time, and a `computed` makes the item of the status bar from it:

```ts
/** `layoutSaved`: the layout is in localStorage now. */
protected saved(): void {
  this.savedAt.set(new Date().toLocaleTimeString());
}
```

```ts
private readonly engine = viewChild.required(GrdDockingEngine);
/** The time of the last save in this session; `null` before the first one. */
private readonly savedAt = signal<string | null>(null);

protected readonly status = computed<GrdStatusItem[]>(() => {
  const at = this.savedAt();
  const text = at
    ? `Layout saved at ${at}`
    : 'Not saved yet: F5 shows the layout that was saved last';
  return [{ id: 'saved', text, shrink: true, live: true }];
});
```

The status bar goes under the engine:

```html
<grd-status-bar [items]="status()" />
```

Add `GrdStatusBar` and the type `GrdStatusItem` to the imports, and `computed` and `signal` to the imports from `@angular/core`.

## Try it

1. **File › Add component** and **File › Add HTML.** The status bar says _Not saved yet: F5 shows the layout that was saved last_.
2. **Click Save layout.** The status bar says _Layout saved at 10:41:07_.
3. **File › Add HTML** once more, then **F5.** The two saved tabs are back; the third one was never saved and is gone. The status bar says _Not saved yet_ again: the time is kept only while the page runs.
4. **File › Add HTML, then Ctrl+S, then F5.** Three tabs: Ctrl+S saved them.
5. **File › Reset layout, then F5.** The three tabs are back: Reset changed the screen, not what is saved.
6. **File › Reset layout, Save layout, F5.** Now the empty area is what is saved, and F5 shows it.
7. **See it.** In the developer tools of the browser, _Application › Local storage › http://localhost:30110_ has the key `tutorial-110-layout`. It changes only when you save.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-menu-bar [menus]="menus" shortcuts>
      <grd-button grdMenuBarEnd label="Save layout" variant="primary" (pressed)="save()" />
    </grd-menu-bar>
    <!-- Automatic saving is off (the default): the layout is written only when save() asks for it. -->
    <grd-docking-engine layoutStorageKey="tutorial-110-layout" (layoutSaved)="saved()" />
    <grd-status-bar [items]="status()" />
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
  /** The time of the last save in this session; `null` before the first one. */
  private readonly savedAt = signal<string | null>(null);

  protected readonly status = computed<GrdStatusItem[]>(() => {
    const at = this.savedAt();
    const text = at
      ? `Layout saved at ${at}`
      : 'Not saved yet: F5 shows the layout that was saved last';
    return [{ id: 'saved', text, shrink: true, live: true }];
  });

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** Writes the layout as it is now; the engine answers with `layoutSaved`. */
  protected save(): void {
    this.engine().saveLayout();
  }

  /** `layoutSaved`: the layout is in localStorage now. */
  protected saved(): void {
    this.savedAt.set(new Date().toLocaleTimeString());
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **Automatic saving is off by default.** `GrdEngineSettings.setAutoSaveLayout(true)` (015) turns it on for every engine of the application: the engine then saves after every change and when the page is closed. Without it the engine only _loads_ the saved layout when it starts, and saves when `saveLayout()` is called.
- **`saveLayout()` writes the whole layout at once**: the panels and their sizes, the tabs in them, the active tab of every panel, the floating windows, the HTML of the HTML tabs. It returns `true` when the layout is written, `false` when it could not be (the key is `null`, or `localStorage` is full or turned off).
- **`layoutSaved`** is told after every save that was written: the ones that `saveLayout()` makes and, with automatic saving, the automatic ones too. It is the place to show that a save happened; a click on the button alone does not say that the layout is written.
- **F5 is the test.** What F5 shows is the layout of the last save. Every change after it (a new tab, a closed one, a moved line, a reset) lives only on the screen until the next save.
- **What is inside a component is not saved** (015): the counter comes back at 0. The state of a component is for a later tutorial.

## What you get without writing any of it

- **Loading at the start.** The engine looks under its key when it starts and shows what it finds; with nothing there, it shows its default layout.
- **The shortcut.** `Mod+S` is shown in the menu as Ctrl+S (⌘S on a Mac) and works while the menu is closed; the browser's own Ctrl+S does not open.
- **A status that the screen reader reads.** `live: true` announces the new text of the item; `shrink: true` lets a long text end with an ellipsis instead of pushing the other items away.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 110 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new save-button --style=scss --ssr=false --skip-tests
   cd save-button
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` of 015 and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
