# 040 – Shell

This tutorial shows how to build the frame of an application around the area where the user docks: bars that the application puts into its default layout and that the user cannot close, drag or dock into (the **shell**), and the **dockable core** in the middle. You will learn how to:

- give the engine a default layout of your own (`defaultLayout`);
- make bars of the shell (`shell: true`) and give them fixed, resizable or ratio sizes (`size`, `resizable`);
- choose the header of a bar: a strip of tabs, a title, or none (`shellHeader`);
- put two panels side by side inside one bar;
- listen to what the engine reports (`GrdEngineEvents`).

Here four bars surround the engine of 025: a banner at the top, a clock on the left that the user can make wider, a short text on the right, and two tools side by side at the bottom. The user works in the core with **File › New tool** and **File › New document** as in 025, and only the layout of the core is saved.

```
npm run tutorial 040
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30040. Drag the splitter on the right of the clock, add a tool and a document, and look at the tab **Events** at the bottom: it lists what the engine reports. Then try to drag the tab Notes out of the bottom bar.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EventsTool } from './events-tool';
import { NotesTool } from './notes-tool';

/** Four bars of the shell around the dockable core. The shell comes from here every time; only the core is saved. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'column',
  size: 100,
  children: [
    // At the top: 48 px, no header, plain HTML.
    {
      type: 'panel',
      role: 'tool',
      size: '48px',
      shell: true,
      shellHeader: 'none',
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          role: 'tool',
          title: 'Banner',
          content: '<div class="banner"><b>Shell</b> · the frame of the application</div>',
        },
      ],
    },
    {
      type: 'row',
      size: 100,
      children: [
        // On the left: 300 px that the user may drag, the clock.
        {
          type: 'panel',
          role: 'tool',
          size: '300px',
          resizable: true,
          shell: true,
          shellHeader: 'text',
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Clock', componentType: ClockTool }],
        },
        // The dockable core: everything the user opens goes here.
        { type: 'panel', role: 'document', size: 100, activeTab: 0, collapsed: false, tabs: [] },
        // On the right: 200 px, fixed, plain HTML.
        {
          type: 'panel',
          role: 'tool',
          size: '200px',
          shell: true,
          shellHeader: 'text',
          activeTab: 0,
          collapsed: false,
          tabs: [
            {
              role: 'tool',
              title: 'About',
              content: '<p>The shell cannot be closed, dragged or docked into.</p>',
            },
          ],
        },
      ],
    },
    // At the bottom: 300 px, Events and Notes side by side (two panels in a row).
    {
      type: 'row',
      size: '300px',
      shell: true,
      children: [
        {
          type: 'panel',
          role: 'tool',
          size: 50,
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Events', componentType: EventsTool }],
        },
        {
          type: 'panel',
          role: 'tool',
          size: 50,
          activeTab: 0,
          collapsed: false,
          tabs: [{ role: 'tool', title: 'Notes', componentType: NotesTool }],
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
    <grd-docking-engine layoutStorageKey="shell" [defaultLayout]="layout" />
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
    settings.setDockingMode('roles');
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
          label: 'New &tool',
          run: () =>
            this.engine().openComponentTab({ title: 'Clock', role: 'tool', componentKey: 'clock' }),
        },
        {
          label: 'New &document',
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

`src/app/events-tool.ts`, the tool on the left of the bottom bar, lists the events of the engine:

```ts
import { Component, inject, signal } from '@angular/core';
import { GrdEngineEvents } from '@gridify/studio';

/** A tool: what the engine reports, the newest on top. */
@Component({
  selector: 'app-events-tool',
  template: `
    @for (line of lines(); track $index) {
      <div>{{ line }}</div>
    } @empty {
      <p>Open, close, move or resize something.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font: 12px/1.6 var(--grd-font-mono);
      color: var(--grd-text-main);
    }
  `,
})
export class EventsTool {
  protected readonly lines = signal<string[]>([]);

  constructor() {
    const events = inject(GrdEngineEvents);
    const write = (line: string) => this.lines.update((lines) => [line, ...lines].slice(0, 50));
    events.on('tabOpened', (e) => write(`tabOpened ${e.title} (${e.role})`));
    events.on('tabClosed', (e) => write(`tabClosed ${e.title}`));
    events.on('tabDocked', (e) => write(`tabDocked ${e.title}: ${e.action}`));
    events.on('tabFloated', (e) => write(`tabFloated ${e.title}`));
    events.on('panelResized', (e) =>
      write(`panelResized ${e.sizes.map((s) => Math.round(s.size) + s.unit).join(' | ')}`),
    );
    events.on('layoutReset', () => write('layoutReset'));
  }
}
```

`src/app/notes-tool.ts`, the one on the right, is a text field that fills its panel:

```ts
import { Component, signal } from '@angular/core';
import { GrdTextarea } from '@gridify/studio';

/** A tool: a text field that fills the panel. The text lives as long as the page. */
@Component({
  selector: 'app-notes-tool',
  imports: [GrdTextarea],
  template: `
    <grd-textarea
      fill
      ariaLabel="Notes"
      placeholder="Notes for this session…"
      [(value)]="text"
      [reserveMessageSpace]="false"
      [validationMessage]="false"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      box-sizing: border-box;
      padding: 8px;
    }
  `,
})
export class NotesTool {
  protected readonly text = signal('');
}
```

`src/app/clock-tool.ts` is the one of 020, `src/app/counter.ts` is the one of 010. `src/styles.scss` is the one of 010 with a rule for the banner at its end:

```scss
/* The banner of the shell (the top bar): a plain HTML tab has a padding of 14 px, which leaves a bar of 48 px no room for a line. */
grd-docking-engine .grd-panel-body:has(> .banner) {
  display: flex;
  align-items: center;
  padding: 4px 14px;
}
```

### What changed against 025

- **A default layout of the application** (`[defaultLayout]="layout"`). 025 used the default layout of the engine, one empty document panel; here that panel is the dockable core in the middle of the shell.
- **Two tools for the bottom bar.** `EventsTool` listens to `GrdEngineEvents`; `on()` called in the constructor stops listening by itself when the component goes. `NotesTool` is a `grd-textarea` with `fill`.
- **The menu Empty content is gone**, so the empty document panel shows the caption of the engine. The commands are called **New tool** and **New document** and the menus are a plain array again.
- **The layout has a key of its own**, `shell`.

## The shell

A node of the default layout with `shell: true` belongs to the shell, and so does everything inside it:

- It cannot be closed, dragged or detached, and nothing can be docked into it. Its tabs have no close button and no menu, and a tab of the bottom bar stays in its panel when it is dragged.
- Everything else is the dockable core: **New tool** and **New document** open their tabs there, between the bars. While a tab of the core is dragged, the arrows stay inside the core; the arrows at its outer edges put the tab right next to a bar, never over it.
- A shell node stands first or last among its siblings, and its container keeps a child that is not a shell: here the column is top bar, row, bottom bar, and the row is left bar, core, right bar. A layout that breaks the rule is reported in the console.
- **Inside a shell node the structure is free.** The bottom bar is a `row` with `shell: true`, and its two panels belong to the shell with it: Events on the left, Notes on the right, each half of the bar. Tabs in one panel take turns in the same place; side by side they have to be two panels. The panels have ratio sizes, so there is a splitter between them: drag it and the tab Events writes the two shares, such as `panelResized 70fr | 30fr`.

The four bars:

| Bar    | `size`    | `resizable`                                  | `shellHeader`                         | Content                            |
| ------ | --------- | -------------------------------------------- | ------------------------------------- | ---------------------------------- |
| top    | `'48px'`  | not set: a length is fixed                   | `'none'`: no header                   | HTML (`.banner`)                   |
| left   | `'300px'` | `true`: a splitter, a drag changes the width | `'text'`: the title across the header | `ClockTool`                        |
| right  | `'200px'` | not set: fixed                               | `'text'`                              | HTML                               |
| bottom | `'300px'` | not set: fixed                               | not set: `'tabs'`, a strip of tabs    | a row: `EventsTool` \| `NotesTool` |

- **`size`** is a ratio when it is a number (the core has `100` and takes what the bars leave), a fixed length in `'px'`, or a share of the whole container in `'%'`. A node with a length cannot be resized unless it has `resizable: true`. Drag the splitter of the left bar: the clock grows, the core shrinks and the right bar keeps its 200 px. The tab Events writes `panelResized 380px | 100fr | 200px`, every size in its own unit.
- **`shellHeader`** is `'tabs'` (the default, a strip of tabs), `'text'` (the title of the only tab across the header, without a tab) or `'none'` (no header at all).
- **A bar with a header can be collapsed** with the arrow in it, and the core takes its room. The top bar has no header, so it has no arrow either.
- **The content has to fit the length.** The body of a plain HTML tab has a padding of 14 px and a line of text about 21 px, more than the 47 px that the top bar has inside its border: the text would scroll. The banner is a `div` with the class `banner`, and the rule at the end of `src/styles.scss` gives the body that holds it a padding of 4 px at the top and the bottom and puts the line in the middle.
- **Only the core is saved.** The shell always comes from the default layout: a reload brings back the tabs of the core, and the left bar has its 300 px again. **File › Reset layout** builds both anew: the core is one empty document panel again, and the components of the shell start afresh (the notes are empty, and the list of events starts again with what the reset itself reports: a `tabClosed` for every tab of the old layout, then `layoutReset`).
- Because the shell is not saved, its components need only `componentType`: no key and no registration. The core still registers `clock` and `counter`, so its tabs come back after a reload.

## Build it from 025

The quick way: `npm run tutorial:eject 040 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 025.

1. Start from your application of 025 (or one made by `npm run tutorial:eject 025 path/to/new-folder` in the root of the repository).

2. Add `src/app/events-tool.ts` and `src/app/notes-tool.ts` (above). `src/app/empty-area.ts` is not needed any more. Add the rule for the banner to the end of `src/styles.scss` (above).

3. In `app.ts`, add the constant `LAYOUT` (above), give it to the engine and give the engine its own key:

   ```html
   <grd-menu-bar [menus]="menus" />
   <grd-docking-engine layoutStorageKey="shell" [defaultLayout]="layout" />
   ```

   ```ts
   protected readonly layout = LAYOUT;
   ```

4. Take out the choice of the empty content (`emptyContent`, `emptyDocument`, the menu Empty content and `choice`), make `menus` a plain array again and call the commands **New tool** and **New document**.

5. Run it:

   ```
   ng serve
   ```
