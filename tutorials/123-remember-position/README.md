# 123 – A closed tool comes back to its place

This tutorial shows how to make a tool that the user closed come back where the user had it, not wherever a new tab goes. You will learn how to:

- give tools a `tag`, by which the engine remembers the place of a closed tab (its panel, a mate, its neighbour, its edge);
- close and open the tools from a **View** menu (the block `grd:tools`);
- keep the places across F5 (they are saved with the layout, as `closedTabs`);
- turn the memory off (`rememberPosition`) to see the difference.

The application has three tools: Explorer, Output and Properties. The engine remembers the places by itself for every tab with a tag; the application only gives the tags and the View menu. The tutorial is from the series about saving (110–125).

```
npm run tutorial 123
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30123, close a tool with **View › Output** and open it again. Move it somewhere else, close it, open it again, and press F5 at any point.

Every tutorial runs on an address of its own (this one on http://localhost:30123), so it has a `localStorage` of its own. It still keeps its layout under the key `tutorial-123-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with a default layout of three tools and a View menu.

### Step 1: tools with a tag

A tool is a tab with `role: 'tool'`. The `tag` is what this tutorial is about: it is the name of the tool. The View menu finds the tool by it, and the engine remembers the place of the tool under it. The ids of the tabs are new after every reload; the tag stays. A small helper makes the three tools in `src/app/app.ts`:

```ts
/** A tool: a tab with a tag. The View menu finds it by the tag, and the engine remembers its place by it. */
const tool = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'tool',
  title,
  content: `<p>${text}</p>`,
});
```

The default layout puts Explorer on the left, the documents in the middle with Output under them, and Properties on the right. The panels have tags too (`left`, `documents`, `bottom`, `right`): a tool that comes back finds its panel by them.

```ts
/** Explorer on the left, the documents in the middle with Output under them, Properties on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('explorer', 'Explorer', 'The files of the project.')],
    },
    {
      type: 'column',
      size: 60,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 70,
          activeTab: 0,
          collapsed: false,
          tabs: [],
        },
        {
          tag: 'bottom',
          type: 'panel',
          role: 'tool',
          size: 30,
          activeTab: 0,
          collapsed: false,
          tabs: [tool('output', 'Output', 'What the last build said.')],
        },
      ],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('properties', 'Properties', 'The properties of what is selected.')],
    },
  ],
};
```

### Step 2: give the layout to the engine and turn on the View blocks

<!-- prettier-ignore -->
```html
<!-- viewSources: the engine fills the block grd:tools of the View menu with its tools -->
<grd-docking-engine
  layoutStorageKey="tutorial-123-layout"
  [defaultLayout]="layout"
  viewSources
/>
```

```ts
  protected readonly layout = LAYOUT;
```

`viewSources` (an attribute without a value) makes the engine register its named blocks of menu items: `grd:tools`, `grd:documents` and `grd:restore-layout`. A menu that names a block gets the items of the engine in its place.

### Step 3: a View menu

The tools of the View menu are one line, the block `grd:tools`:

```ts
    {
      id: 'view',
      label: '&View',
      items: [
        // One item for every tool, with a check mark while it is open: a click closes or opens it.
        { source: 'grd:tools' },
```

The block lists the tool tabs of the default layout that have a tag, with their titles. An open tool has a check mark, and a click closes it; a closed one has none, and a click opens it again. This is where the place comes in: the engine puts the tool back where it was.

### Step 4: the switch

Remembering the places is the setting `rememberPosition` of `GrdEngineSettings`, on by default. Nothing has to be written to have it. The switch is only there to turn it off and see the difference. Keep the settings in a field:

```ts
  private readonly settings = inject(GrdEngineSettings);
```

and add an item with a check mark after the tools:

```ts
        { separator: true },
        {
          label: 'Remember the &position',
          checked: this.settings.rememberPosition(),
          run: () => this.settings.setRememberPosition(!this.settings.rememberPosition()),
        },
```

The check mark reads a signal, so `menus` becomes a `computed` (and the template reads it as `[menus]="menus()"`): the menu is drawn again when the setting changes.

### Step 5: run it

```
npm run tutorial 123
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** Explorer is on the left, Output under the documents, Properties on the right. Open **View**: the three tools have a check mark, and so has **Remember the position**.
2. **Close and open.** Choose **View › Output**: Output closes, and the panel at the bottom goes with it. Choose **View › Output** again: it is back under the documents, as high as before, and as it was in the default layout: the same icon (the one of the tools, as it has none of its own) and the same text.
3. **Where it was last.** Drag the _Output_ tab onto the Properties panel and drop it on the anchor in the middle: Output is now a tab next to Properties. Close it with its cross, then choose **View › Output**. It comes back next to Properties, not to the bottom: the place is where the tool was when it was closed, not where it started.
4. **After F5.** Choose **View › Explorer**: the left panel is gone, and the others take its room. **Press F5.** Explorer is still closed and Output is still next to Properties. Choose **View › Explorer**: it comes back on the left, as wide as before. Its place was saved with the layout.
5. **Without the memory.** Choose **View › Remember the position** (the check mark goes). Choose **View › Explorer** twice, to close it and open it again. This time it does not go to the left: it gets a new panel at the right end, where any new tool goes. Choose **View › Remember the position** again to turn the memory back on. The switch itself is not saved: after F5 it is on again.
6. **Reset.** **File › Reset layout** brings the default layout back and forgets the places.
7. **See it.** In the developer tools, _Application › Local storage › http://localhost:30123_, the key `tutorial-123-layout` has `closedTabs` while a tool is closed: one place for each closed tag.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdDockTabInput,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** A tool: a tab with a tag. The View menu finds it by the tag, and the engine remembers its place by it. */
const tool = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'tool',
  title,
  content: `<p>${text}</p>`,
});

/** Explorer on the left, the documents in the middle with Output under them, Properties on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'left',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('explorer', 'Explorer', 'The files of the project.')],
    },
    {
      type: 'column',
      size: 60,
      children: [
        {
          tag: 'documents',
          type: 'panel',
          role: 'document',
          size: 70,
          activeTab: 0,
          collapsed: false,
          tabs: [],
        },
        {
          tag: 'bottom',
          type: 'panel',
          role: 'tool',
          size: 30,
          activeTab: 0,
          collapsed: false,
          tabs: [tool('output', 'Output', 'What the last build said.')],
        },
      ],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 20,
      activeTab: 0,
      collapsed: false,
      tabs: [tool('properties', 'Properties', 'The properties of what is selected.')],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <!-- viewSources: the engine fills the block grd:tools of the View menu with its tools -->
    <grd-docking-engine
      layoutStorageKey="tutorial-123-layout"
      [defaultLayout]="layout"
      viewSources
    />
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
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    this.settings.setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

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
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        // One item for every tool, with a check mark while it is open: a click closes or opens it.
        { source: 'grd:tools' },
        { separator: true },
        {
          label: 'Remember the &position',
          checked: this.settings.rememberPosition(),
          run: () => this.settings.setRememberPosition(!this.settings.rememberPosition()),
        },
      ],
    },
  ]);
}
```

`src/app/counter.ts`, `src/app/app.config.ts`, `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### The tag is the name of a tool

When a tab with a `tag` is closed (its cross, the View menu, `api.closeTab`, the cross of a floating window), the engine writes down where it was. When a tab with the same tag is opened (the View menu, `openHtmlTab`, `openComponentTab`), it goes there instead of where a new tab goes. A tab without a tag is placed the usual way: it has nothing to be found by after a reload.

### What a place is

A place is written with tags and with the shape of the layout, never with ids (they are new after every load). When Explorer is closed at the start, `closedTabs` holds:

```json
"closedTabs": {
  "explorer": {
    "dock": {
      "mates": [],
      "index": 0,
      "panel": "left",
      "beside": {
        "tabs": ["output"],
        "side": "left",
        "share": { "axis": "row", "value": 0.2 }
      },
      "edge": { "side": "left", "share": { "axis": "row", "value": 0.2 } }
    }
  }
}
```

(a part of it). The tool is put back by the first rule that finds something:

1. **Its panel** (`panel`, the tag of the panel), at its position among the tabs (`index`).
2. **The panel of a tab it shared the panel with** (`mates`, up to 8 tags), when its panel has gone.
3. **Beside its neighbour** (`beside`): a new panel on the same side of the node that holds those tabs (here the column with Output), as big to the neighbour as it was (`ratio`), otherwise with the same share of the row (a fifth).
4. **At the edge of the core** it stood at (`edge`).

Explorer was alone in its panel, so the panel went away when it was closed, and rule 3 brings it back: a new panel on the left of what is in the middle, a fifth of the row wide. In step 3 of _Try it_, Output finds the panel of Properties by rule 1: that panel is where Output was when it was closed.

A place is used up when the tool comes back, and every close makes a new one, so it is always the last place. At most 64 places are kept. In the `roles` mode a tool goes only into a tool panel, and a document only into a document panel. The shell, if there is one, is never touched.

### The View menu

`{ source: 'grd:tools' }` is a named block: the engine says what is in it, the menu says only where it goes. The check marks follow the layout: a tool closed with its cross loses its check mark too. Without `viewTools` the block takes the tool tabs of the default layout that have a tag, and a tool it opens again is the tab of the default layout as it is written there: its icon (or, without one, the icon of the tools), its content and its behaviour. With `[viewTools]` the application chooses the tools itself and can give each a label with an access key, an icon, a shortcut, or an `open` function of its own. Commands of the application can do the same through `engine.view`: `toggle(tag)`, `show(tag)` and `isOpen(tag)`, which a `computed` can read.

### The switch

`setRememberPosition(false)` stops both remembering and using places: a closed tool leaves no place, and an opened one goes where a new tab goes. The places that were remembered are kept, and are used again when it is turned on. The setting belongs to `GrdEngineSettings`, a service of the application, and is not saved: a reload starts with the default (on), unless the application saves the setting itself.

### Saved with the layout

The places are part of the saved layout (`closedTabs`). With `setAutoSaveLayout(true)` they are saved with every change, like the panels, so they come back after F5. When a saved layout is read, every place is checked, and anything that is not a well-formed place is quietly left out. `resetLayout()` forgets them.

## What you get without writing any of it

- **The places themselves**: remembered on every close, used on every open of the same tag, with four rules from the panel down to the edge of the core.
- **The last place, not the first one**: a tool that was moved and then closed comes back where it was moved to.
- **The View menu**: one item per tool, check marks that follow the layout, close and open in one click.
- **Saving and loading** of the places with the layout, with every place checked when it is read.
- **A tool that can be seen**: a collapsed panel or group that it comes back into is expanded.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 123 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new remember-position --style=scss --ssr=false --skip-tests
   cd remember-position
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` and `src/app/counter.ts` as in 015.

5. Replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
