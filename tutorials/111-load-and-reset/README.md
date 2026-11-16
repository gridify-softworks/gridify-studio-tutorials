# 111 – Load and reset

This tutorial shows how to load the saved layout and go back to the default one on a button, without reloading the page. You will learn how to:

- put the saved layout back on the screen (`loadLayout()`), and disable **Load** while nothing is saved (`hasSavedLayout()`);
- go back to the default layout (`resetLayout()`, which does not save by itself);
- tell the user what happened (`layoutSaved`, `layoutLoaded`, `layoutReset`);
- keep the frame of the application out of the saved sizes: a shell panel (`shell: true`), whose width is never saved, and why.

It is the application of 110 with a few lines more, from the series about saving (110–125).

```
npm run tutorial 111
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30111, add two tabs (**File › Add component**, **File › Add HTML**), click **Save**, add a third tab and click **Load**: the two saved tabs are back, and the page was not reloaded.

Every tutorial runs on an address of its own (this one on http://localhost:30111), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-111-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 110 (or one made by `npm run tutorial:eject 110 path/to/new-folder` in the root of the repository). Automatic saving stays off: Load and Reset mean something only when the layout is saved on purpose.

### Step 1: a default layout with a shell

Until now the engine started from its own default layout, the empty document area. This one has a panel of the shell on the left and the dockable core (the document panel) next to it:

```ts
/** The default layout: a shell on the left (the frame of the application, never saved) and the dockable core for the tabs. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'tool',
      size: '260px',
      resizable: true,
      shell: true,
      shellHeader: 'text',
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          role: 'tool',
          title: 'Shell',
          content:
            '<p>This panel is the <b>shell</b>: the frame that the application defines. ' +
            'Drag its edge: the new width is not saved, it comes from the default layout again ' +
            'after Load, Reset and F5.</p>',
        },
      ],
    },
    { type: 'panel', role: 'document', size: 100, activeTab: 0, collapsed: false, tabs: [] },
  ],
};
```

`shell: true` makes the panel a part of the frame: its tab cannot be closed, dragged away or docked into, and `resizable: true` still lets the user drag its edge. `shellHeader: 'text'` shows the title as a plain heading instead of a tab (tutorial 040 has more about the shell). Import the type `GrdDockContainerNodeInput`, give `App` the field `protected readonly layout = LAYOUT;` and the engine the input `[defaultLayout]="layout"` (step 5).

### Step 2: Load

Two more buttons at the end of the menu bar. The Save button of 110 is now just **Save**:

```html
<grd-menu-bar [menus]="menus()" shortcuts>
  <grd-button grdMenuBarEnd label="Save" variant="primary" (pressed)="save()" />
  <grd-button grdMenuBarEnd label="Load" [disabled]="!canLoad()" (pressed)="load()" />
  <grd-button grdMenuBarEnd label="Reset" (pressed)="reset()" />
</grd-menu-bar>
```

`loadLayout()` returns `false` when there is nothing to load, and then changes nothing:

```ts
/** Puts the saved layout in place of the one on the screen, as F5 does, but without reloading the page. */
protected load(): void {
  if (!this.engine().loadLayout()) this.tell('Nothing is saved yet: there is nothing to load');
}
```

### Step 3: Load only when there is something to load

`hasSavedLayout()` tells whether there is a saved layout that `loadLayout()` would load. One signal keeps the answer, and Load is disabled while it is `false` (the `[disabled]` of step 2):

```ts
/** Is there a saved layout to load? Load is disabled while there is none. */
protected readonly canLoad = signal(false);
```

The engine is a child of `App`, so it has started when `ngAfterViewInit` of `App` runs (its own runs before): that is the moment to ask whether a layout of an earlier visit is saved. `App` implements `AfterViewInit`:

```ts
/** The engine has started (its `ngAfterViewInit` runs before this one): is a layout of an earlier visit saved? */
ngAfterViewInit(): void {
  this.canLoad.set(this.engine().hasSavedLayout());
}
```

Later only a save can make a saved layout, and the engine tells every save with `layoutSaved` (step 5):

```ts
/** A save made a saved layout: from now on there is something to load. */
protected saved(): void {
  this.canLoad.set(true);
  this.tell('Saved');
}
```

The item of the menu follows it too. `enabled` of an item is a plain value, so the menus become a `computed` that reads the signal (and `[menus]="menus()"` in the template):

```ts
/** A computed: Load saved layout is enabled only while there is something to load. */
protected readonly menus = computed<GrdMenu[]>(() => [
```

### Step 4: Reset

```ts
/** Goes back to the default layout (`defaultLayout`). It is not saved by itself: Save keeps it, Load brings the saved one back. */
protected reset(): void {
  this.engine().resetLayout();
}
```

**File** gets the three commands:

```ts
{ separator: true },
{ label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
{ label: '&Load saved layout', enabled: this.canLoad(), run: () => this.load() },
{ label: '&Reset layout', run: () => this.reset() },
```

### Step 5: say what happened

The engine tells each of the three with an output of its own: `layoutSaved`, `layoutLoaded` and `layoutReset`. The template binds them, with the default layout of step 1:

```html
<grd-docking-engine
  layoutStorageKey="tutorial-111-layout"
  [defaultLayout]="layout"
  (layoutSaved)="saved()"
  (layoutLoaded)="tell('The saved layout is loaded')"
  (layoutReset)="tell('The default layout is shown (Save keeps it)')"
/>
```

The status bar shows the last of them. It replaces `savedAt`, `status` and `saved()` of 110 (`saved()` is the one of step 3 now):

```ts
/** What happened last, for the status bar. */
protected readonly status = signal<GrdStatusItem[]>([]);
```

```ts
/** Shows what happened, with the time. */
protected tell(text: string): void {
  const at = new Date().toLocaleTimeString();
  this.status.set([{ id: 'said', text: `${text} (${at})`, shrink: true, live: true }]);
}
```

## Try it

1. **Start the application.** The status bar already says _The default layout is shown (Save keeps it)_: nothing is saved yet, so the engine started from its default layout, and it said so.
2. **Load is disabled**, and so is **File › Load saved layout**: nothing is saved yet, there is nothing to load.
3. **File › Add component, File › Add HTML, Save.** _Saved (10:41:07)._ Load is enabled now.
4. **File › Add HTML, then Load.** The two saved tabs are back and the third is gone, without a reload. _The saved layout is loaded._
5. **Reset.** Only the shell and the empty document area. **Load** brings the two tabs back: Reset did not touch what is saved.
6. **Drag the edge of the shell** to the right, click **Save**, then **Load**. The shell is 260 px wide again. **F5** shows the same: the width of the shell was never saved.
7. **F5.** The status bar says _The saved layout is loaded_: at the start the engine loaded the saved layout, and told it. Load is enabled at once: a layout is saved.
8. **Reset, Save, F5.** Now the default layout is what is saved.

## The code

`src/app/app.ts`:

```ts
import { AfterViewInit, Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

/** The default layout: a shell on the left (the frame of the application, never saved) and the dockable core for the tabs. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'tool',
      size: '260px',
      resizable: true,
      shell: true,
      shellHeader: 'text',
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          role: 'tool',
          title: 'Shell',
          content:
            '<p>This panel is the <b>shell</b>: the frame that the application defines. ' +
            'Drag its edge: the new width is not saved, it comes from the default layout again ' +
            'after Load, Reset and F5.</p>',
        },
      ],
    },
    { type: 'panel', role: 'document', size: 100, activeTab: 0, collapsed: false, tabs: [] },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-menu-bar [menus]="menus()" shortcuts>
      <grd-button grdMenuBarEnd label="Save" variant="primary" (pressed)="save()" />
      <grd-button grdMenuBarEnd label="Load" [disabled]="!canLoad()" (pressed)="load()" />
      <grd-button grdMenuBarEnd label="Reset" (pressed)="reset()" />
    </grd-menu-bar>
    <grd-docking-engine
      layoutStorageKey="tutorial-111-layout"
      [defaultLayout]="layout"
      (layoutSaved)="saved()"
      (layoutLoaded)="tell('The saved layout is loaded')"
      (layoutReset)="tell('The default layout is shown (Save keeps it)')"
    />
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
export class App implements AfterViewInit {
  private readonly engine = viewChild.required(GrdDockingEngine);
  protected readonly layout = LAYOUT;
  /** What happened last, for the status bar. */
  protected readonly status = signal<GrdStatusItem[]>([]);
  /** Is there a saved layout to load? Load is disabled while there is none. */
  protected readonly canLoad = signal(false);

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** The engine has started (its `ngAfterViewInit` runs before this one): is a layout of an earlier visit saved? */
  ngAfterViewInit(): void {
    this.canLoad.set(this.engine().hasSavedLayout());
  }

  protected save(): void {
    this.engine().saveLayout();
  }

  /** A save made a saved layout: from now on there is something to load. */
  protected saved(): void {
    this.canLoad.set(true);
    this.tell('Saved');
  }

  /** Puts the saved layout in place of the one on the screen, as F5 does, but without reloading the page. */
  protected load(): void {
    if (!this.engine().loadLayout()) this.tell('Nothing is saved yet: there is nothing to load');
  }

  /** Goes back to the default layout (`defaultLayout`). It is not saved by itself: Save keeps it, Load brings the saved one back. */
  protected reset(): void {
    this.engine().resetLayout();
  }

  /** Shows what happened, with the time. */
  protected tell(text: string): void {
    const at = new Date().toLocaleTimeString();
    this.status.set([{ id: 'said', text: `${text} (${at})`, shrink: true, live: true }]);
  }

  /** A computed: Load saved layout is enabled only while there is something to load. */
  protected readonly menus = computed<GrdMenu[]>(() => [
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
        { label: '&Load saved layout', enabled: this.canLoad(), run: () => this.load() },
        { label: '&Reset layout', run: () => this.reset() },
      ],
    },
  ]);
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **`loadLayout()` does what F5 does, without the reload.** It reads the layout under the key and puts it in place of the one on the screen: every tab on the screen is closed (`tabClosed` with `reason: 'layout'`, nobody is asked), the saved tabs come back, their components are created anew. It returns `false` and changes nothing when nothing is saved, when the saved layout has another version, or when the key is `null`. It saves nothing.
- **`resetLayout()` shows the default layout**, the `defaultLayout` input (the empty document area when there is none). The tabs on the screen are closed the same way. It is saved only with automatic saving on (015); here the saved layout stays as it was, so Load and F5 bring it back.
- **The start is a load or a reset.** When the engine starts, it loads the layout under its key; when there is none, it resets. The outputs are connected before that, so the application hears `layoutLoaded` or `layoutReset` from the start too: that is the first text of the status bar.
- **The shell is not saved.** A saved layout has only the dockable core, the part that the user arranges. On a load, the engine builds the layout from the default layout (the shell, exactly as the application defines it now) and puts the saved core into its place. The shell belongs to the application, not to the user: when a new version of the application changes its frame (a new bar, another width, a panel less), the users get the new frame, and their own arrangement of the tabs inside it stays. The price is that what the user does to the shell itself, here the width, is not kept.
- **`hasSavedLayout()` asks before a load**: `true` when there is a saved layout that `loadLayout()` would load (under the key, of the version the engine knows), `false` otherwise and always with the key `null`. It reads the storage each time it is asked, so an application asks when it needs to know (at the start, after a save), not in a template.
- **`layoutChanged` is not told by a load.** A reset tells `layoutReset` and then `layoutChanged` (the layout on the screen is different now); a load tells only `layoutLoaded`, and so does the start (with `layoutLoaded` or `layoutReset`). Dragging the edge of the shell tells `layoutChanged` with `persisted: false`: the shell is not saved. Tutorial 112 builds an "unsaved changes" mark on these events.

## What you get without writing any of it

- **A clean swap.** The components of the old layout are destroyed before the new ones are made, the ids are new, nothing of the old layout is left on the screen.
- **A load that fails leaves the screen alone.** A saved text that is not a layout, or a layout of another version, is not loaded: `loadLayout()` returns `false` and the layout on the screen stays as it was.
- **The frame of a new version.** Change the width of the shell in `LAYOUT` to `'320px'` and reload: the saved tabs are back, in the new frame.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 111 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new load-and-reset --style=scss --ssr=false --skip-tests
   cd load-and-reset
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
