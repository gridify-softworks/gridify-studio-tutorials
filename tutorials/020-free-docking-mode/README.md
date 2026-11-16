# 020 – Free docking mode

This tutorial shows how to switch the engine to the **free** docking mode, in which any tab can be docked into any panel, and how to give the engine an empty area of your own. You will learn how to:

- open the two kinds of tabs, **documents** (what the user works on) and **tools** (what helps with it), with `role`;
- switch the docking mode (`setDockingMode('free')`) and see how it differs from the default **roles** mode;
- show a component of your own while no tab is docked (`emptyDocument`).

In 010 and 015 every tab was a document. It is the application of 015 with two more components and a few lines more; the layout is still saved.

```
npm run tutorial 020
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30020 and use **File › Add tool** and **File › Add document**. Then drag the tabs around: next to each other, into each other's panel.

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
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EmptyArea } from './empty-area';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="free-docking-mode" [emptyDocument]="emptyArea" />
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
  // What the engine shows while no panel is docked.
  protected readonly emptyArea = EmptyArea;

  constructor() {
    const settings = inject(GrdEngineSettings);
    // All panels are equal: any tab can be docked into any panel.
    settings.setDockingMode('free');
    settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('clock', ClockTool);
    registry.registerComponent('counter', Counter);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &tool',
          run: () =>
            this.engine().openComponentTab({ title: 'Clock', role: 'tool', componentKey: 'clock' }),
        },
        {
          label: 'Add &document',
          run: () =>
            this.engine().openComponentTab({
              title: 'Counter',
              role: 'document',
              componentKey: 'counter',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
```

`src/app/clock-tool.ts`, the tool, is a clock of the library that ticks:

```ts
import { Component } from '@angular/core';
import { GrdClock } from '@gridify/studio';

/** The tool: a clock that ticks. */
@Component({
  selector: 'app-clock-tool',
  imports: [GrdClock],
  template: `<grd-clock displayOnly seconds />`,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 16px;
    }
  `,
})
export class ClockTool {}
```

`src/app/empty-area.ts` is what the engine shows while no tab is docked:

```ts
import { Component } from '@angular/core';

/** What the engine shows while no tab is docked. */
@Component({
  selector: 'app-empty-area',
  template: `
    <h2>Nothing open</h2>
    <p>File › Add tool or File › Add document</p>
  `,
  styles: `
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--grd-text-main);
    }
    h2 {
      margin: 0;
      font-weight: 600;
    }
  `,
})
export class EmptyArea {}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 010.

### What changed against 015

- **`setDockingMode('free')`** switches the engine from its default mode, `roles`, to `free`. It is a setting of `GrdEngineSettings`, like the automatic saving of 015.
- **A tool.** `ClockTool` is registered under the key `clock` and opened with `role: 'tool'`. The counter is opened with `role: 'document'`. That is the default, so 015 opened documents without saying so.
- **An empty area of your own.** `EmptyArea` goes to the `emptyDocument` input of the engine, which shows it instead of its own caption of 010.
- **Add HTML is gone**, and the layout has a key of its own, `free-docking-mode`.

## Free mode and roles mode

**In the roles mode** (the default, 010 and 015) a document goes only into a document panel and a tool only into a tool panel:

- **File › Add document**, then **File › Add tool** gives two panels: the tool gets one of its own next to the document.
- Drag the clock over the panel of the counter: there is no arrow to drop it into that panel, only arrows at the edges. Released there, it becomes a floating window.
- Close the last document and the empty area comes back, in the empty document panel.

**In the free mode** (this tutorial) all panels are equal:

- **File › Add tool**, then **File › Add document** puts the clock and the counter into **one** panel.
- Drag the counter onto the right arrow and you have two panels. Drag the clock onto the middle of the counter's panel and they share one panel again.
- Close every tab and no panel is left, not even an empty one: the empty area covers the whole engine (see below).

In both modes **a tool always gets a new panel**, and a document goes into the panel that has the focus. Try **Add document**, **Add tool**, **Add tool**: three panels. **Add document** now goes into the last clock panel, because that panel has the focus. In the roles mode it goes into the document panel instead.

The saving of 015 works the same way: arrange the panels, reload, and they are back.

### The empty area

`emptyDocument` tells the engine what to show while no tab is docked: here the `EmptyArea` component. Not set, the engine shows its own caption (the one of 010); `null` shows nothing, and a string of HTML works too.

- **In the free mode** the empty area covers the whole engine as soon as no panel is docked. Close every tab, or drag the last one out into a floating window: the window stays above the area, and dragging it back over the area docks it again.
- **In the roles mode** the empty area fills the empty document panel, next to the tools that are still docked.

The engine creates the component when the area is shown and destroys it when a tab takes its place, so the component starts afresh every time.

**File › Reset layout** goes back to the default layout of the engine: one empty panel. The free mode keeps no empty panel, so the reset ends where closing every tab ends: on the empty area.

### Try the roles mode

Change `'free'` to `'roles'`, run it again and start with **File › Reset layout**. The layout saved in the free mode comes back as it is (the clock and the counter may still share one panel), and the roles mode does not sort it out by itself. Tutorial `025-roles-docking-mode` is this application in the roles mode, with a key of its own.

## Build it from 015

The quick way: `npm run tutorial:eject 020 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 015.

1. Start from your application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

2. Add `src/app/clock-tool.ts` and `src/app/empty-area.ts` (above).

3. In `app.ts`, give the engine its own key, switch the mode and register the clock:

   ```html
   <grd-docking-engine layoutStorageKey="free-docking-mode" [emptyDocument]="emptyArea" />
   ```

   ```ts
   protected readonly emptyArea = EmptyArea;

   constructor() {
     const settings = inject(GrdEngineSettings);
     settings.setDockingMode('free');
     settings.setAutoSaveLayout(true);
     const registry = inject(GrdContentRegistry);
     registry.registerComponent('clock', ClockTool);
     registry.registerComponent('counter', Counter);
   }
   ```

4. Replace the two Add commands:

   ```ts
   { label: 'Add &tool', run: () => this.engine().openComponentTab({ title: 'Clock', role: 'tool', componentKey: 'clock' }) },
   { label: 'Add &document', run: () => this.engine().openComponentTab({ title: 'Counter', role: 'document', componentKey: 'counter' }) },
   ```

5. Run it:

   ```
   ng serve
   ```
