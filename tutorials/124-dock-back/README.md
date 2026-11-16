# 124 – Floating windows dock back

This tutorial shows how a floating window goes back to the place its tab came from: the same panel at the same position or, when that panel has gone, a new panel beside the same neighbour. You will learn how to:

- detach a tab into a floating window (the menu of its tab, or a drag out of the dock);
- dock it back with **Dock back** in the menu of the window, or with a button in its header (`setShowDockButton(true)`);
- give the tabs of the default layout tags, so that the windows still find their way back after F5;
- see where a tool, a document without a tag, and a document that stood beside the other documents come back.

The windows are saved with the layout, together with the place each one came from. Detaching, the place, docking back and saving the windows are the engine's: the application gives the layout its tags and turns the button on. The tutorial is from the series about saving (110–125).

```
npm run tutorial 124
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30124, detach a tab with the menu of its tab (the three dots, or the right mouse button), and put it back with the first button in the header of the window. Then detach a few, move them apart, and press F5.

Every tutorial runs on an address of its own (this one on http://localhost:30124), so it has a `localStorage` of its own. It still keeps its layout under the key `tutorial-124-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with a default layout that has tags and a button that docks a window back.

### Step 1: a layout with tags

A floating window remembers where its tab sat. Within one session the engine knows the panels and the tabs by their ids. After a reload the ids are new, so the place is described with **tags**: the tag of the panel, the tags of the tabs that shared it, the tag of the neighbour. Give tags to the panels and the documents of your default layout. In `src/app/app.ts`, a helper makes the documents:

```ts
/** A document of the default layout. Its tag names it after a reload, when the ids of the tabs are new. */
const page = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'document',
  title,
  content: `<p>${text}</p>`,
});
```

and the layout has the documents Readme and Changes in the panel `documents`, and the tool Outline in the panel `tools` on the right:

```ts
/** Two documents and a tool on the right. The panels have tags: a tab that docks back finds them by them. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [
        page('readme', 'Readme', 'What the project is.'),
        page('changes', 'Changes', 'What is new in this version.'),
      ],
    },
    {
      tag: 'tools',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          tag: 'outline',
          role: 'tool',
          title: 'Outline',
          content: '<p>The headings of the page.</p>',
        },
      ],
    },
  ],
};
```

### Step 2: give the layout to the engine

```html
<grd-docking-engine layoutStorageKey="tutorial-124-layout" [defaultLayout]="layout" />
```

```ts
  protected readonly layout = LAYOUT;
```

### Step 3: the button that docks a window back

Every floating window has **Dock back** in its menu (the three dots in its header, or the right mouse button on the header). A button for it is the setting `showDockButton`. By default (`'auto'`) the button is only there where the window has no other way back: where its title cannot be dragged back to the dock. Here the title can be dragged, so the tutorial turns the button on for every window:

```ts
const settings = inject(GrdEngineSettings);
// Save the layout after every change (by default the engine only loads a saved layout).
settings.setAutoSaveLayout(true);
// Every floating window gets the button that docks it back (by default only the menu of the window has Dock back).
settings.setShowDockButton(true);
```

Nothing else is needed: detaching, the place, docking back and saving the windows are the engine's.

### Step 4: run it

```
npm run tutorial 124
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **A tool.** Open the menu of the _Outline_ tab (the three dots on it) and choose **Detach to a floating window**. The window opens in the middle of the engine, and the panel on the right has gone. Click the first button in the header of the window (**Dock back**): Outline is on the right again. Dragging a tab out of the dock and dropping it where no anchor is detaches it too.
2. **A document without a tag.** Choose **File › Add HTML**: _Notes_ opens as the third tab of the documents. It has no tag. Detach it (the right mouse button on the tab, **Detach to a floating window**), then choose **Dock back** in the menu of the window (the three dots in its header). Notes is the third tab of the documents again: in the same session the engine knows its panel and its neighbours by their ids.
3. **Beside the documents.** Drag the _Changes_ tab over the right half of the documents panel and drop it on the anchor at the right: two document panels stand side by side. Detach _Changes_: its panel goes away. Dock it back: it is beside Readme again, between Readme and Outline, in a document panel of its own.
4. **After F5.** Detach _Changes_, _Outline_ and _Notes_. Each window opens in the middle, over the one before, so move each aside by the empty part of its header. **Press F5.** The three windows are where you left them. Dock back _Changes_, then _Outline_, then _Notes_ (or in any other order): Changes goes beside the documents, Outline to the right edge, Notes into the documents panel, and every panel is as wide as it was. Notes has no tag, but the panel it came from has one, and that is enough.
5. **See it.** In the developer tools, _Application › Local storage › http://localhost:30124_, the key `tutorial-124-layout` has `floatingWindows`: the windows with their position, their size and a `dockSpot`, the place they came from.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
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

/** A document of the default layout. Its tag names it after a reload, when the ids of the tabs are new. */
const page = (tag: string, title: string, text: string): GrdDockTabInput => ({
  tag,
  role: 'document',
  title,
  content: `<p>${text}</p>`,
});

/** Two documents and a tool on the right. The panels have tags: a tab that docks back finds them by them. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [
        page('readme', 'Readme', 'What the project is.'),
        page('changes', 'Changes', 'What is new in this version.'),
      ],
    },
    {
      tag: 'tools',
      type: 'panel',
      role: 'tool',
      size: 25,
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          tag: 'outline',
          role: 'tool',
          title: 'Outline',
          content: '<p>The headings of the page.</p>',
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-124-layout" [defaultLayout]="layout" />
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
  protected readonly layout = LAYOUT;

  constructor() {
    const settings = inject(GrdEngineSettings);
    // Save the layout after every change (by default the engine only loads a saved layout).
    settings.setAutoSaveLayout(true);
    // Every floating window gets the button that docks it back (by default only the menu of the window has Dock back).
    settings.setShowDockButton(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
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
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
```

`src/app/counter.ts`, `src/app/app.config.ts`, `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### The place is taken when the tab leaves

The place is written down when a docked tab becomes a floating window: by the menu of the tab, by a drop outside the anchors, by the undock button of a tab (`showUndockButton`), or by `engine.api.floatTab(id)` from code. It is the same description that a closed tab leaves (see 123): the panel, the tabs that shared it, the neighbour and the side, the edge of the core. When Outline is detached at the start (step 1), its window is saved as:

```json
{
  "title": "Outline",
  "tag": "outline",
  "x": 390,
  "y": 210.5,
  "w": 500,
  "h": 350,
  "dockSpot": {
    "mates": [],
    "index": 0,
    "panel": "tools",
    "beside": {
      "tabs": ["readme", "changes"],
      "side": "right",
      "node": "documents",
      "share": { "axis": "row", "value": 0.25 }
    },
    "edge": { "side": "right", "share": { "axis": "row", "value": 0.25 } }
  }
}
```

(a part of it). A window that is docked by dragging its title leaves nothing behind: it was put where it was dropped.

### The way back

**Dock back** (the button or the menu of the window) tries, in this order:

1. **the panel it was in** (`panel`), at its position (`index`);
2. **the panel of one of its mates** (`mates`), the tabs it shared the panel with;
3. **a new panel beside its neighbours** (`beside`, and `next` for a panel that had one on both sides), on the same side, as big to the neighbour as it was (`ratio`);
4. **a new panel at the edge of the core** it stood at (`edge`).

When nothing is found, the tab goes where a new tab goes. A collapsed panel or group on the way is expanded, so the tab can be seen. The way back is the same with or without `rememberPosition`; that setting is about closed tabs.

The place is described against the layout as it was when the tab left, and it knows the windows that had left before it. So the windows come back in whatever order they are docked back: Outline left when Changes was already floating, and still goes to the right edge when Changes is back first (a tool that stood at an edge goes back to the edge); Changes goes between Readme and Outline when Outline is back first. The neighbour gets back the part of its width it held for the panel, so the widths are what they were, however often the tabs leave and come back.

### Documents beside documents

In the `roles` mode a document goes back only to a document panel, or into a new document panel **beside documents**: beside a document panel, or beside a part of the layout that holds only documents. Never beside a tool, and never alone at an edge of the core. When there is no such place, it goes where a new document goes. That is why Changes in step 3 comes back in a document panel of its own next to Readme.

### With tags and without

Within one session the place also knows the tabs and the panels around it by their ids. A document opened at run time without a tag (Notes) finds its panel and its neighbours again (step 2). A saved place keeps only the tags, because the ids are new after a load. After F5 a tab finds its way when something around it has a tag: its panel, a mate, or its neighbour. Notes in step 4 finds the panel `documents`. A tab whose panel, mates and neighbours have no tag at all goes to the edge it stood at (a tool), or beside the documents at the side it stood (a document), and its width may differ.

So: give the panels of your default layout a tag, and give a tag to every document that the application can open again (the path of a file, the id of a record).

## What you get without writing any of it

- **Detaching** from the menu of a tab, by a drag outside the anchors, or from code, with the place taken at that moment.
- **Dock back** from the button or the menu of the window, by the four rules, with the `roles` mode kept: documents beside documents, tools in tool panels.
- **Saving** the windows with the layout: position, size and place. After F5 they are where they were, and the place is checked when it is read: anything that is not a well-formed place is quietly left out.
- **Windows that stay reachable**: a window is never lost over the edge of the browser window.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 124 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new dock-back --style=scss --ssr=false --skip-tests
   cd dock-back
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
