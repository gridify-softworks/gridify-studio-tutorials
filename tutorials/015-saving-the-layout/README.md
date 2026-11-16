# 015 – Saving the layout

This tutorial shows how to make the layout survive a reload: the panels and their sizes, the tabs, the floating windows and the HTML in the tabs come back after F5. You will learn how to:

- keep the layout under a key of your own in `localStorage` (`layoutStorageKey`);
- save it after every change (`setAutoSaveLayout(true)`);
- register a component by a key (`registerComponent`) and open its tab by the key, so that the engine can make it again after a reload;
- go back to the default layout (`resetLayout()`).

It is the application of 010 with a few lines more. What is inside a component is not saved: the counter starts from 0 after a reload (120 shows how a component saves a state of its own).

```
npm run tutorial 015
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30015, add a few tabs (**File › Add component**, **File › Add HTML**), drag one of them to the side or out into a floating window, and reload the page.

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

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- the layout is saved in localStorage under this key and comes back after a reload -->
    <grd-docking-engine layoutStorageKey="saving-the-layout" />
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
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
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

`src/app/counter.ts` and `src/styles.scss` are the ones of 010.

### What changed against 010

- **`layoutStorageKey="saving-the-layout"`** instead of `null`: the key under which the layout is kept in `localStorage`. Without the input the engine uses its default key `grd-layout-state`; a key of your own keeps the layout apart from every other application on the same address (everything that runs on one address shares one `localStorage`).
- **`setAutoSaveLayout(true)`**: by default the engine only _loads_ a saved layout when it starts, and saves when it is told to (`engine.saveLayout()`). With automatic saving it saves after every change of the layout and when the page is closed.
- **`registerComponent('counter', Counter)`**: a saved component tab is saved with its key, not with its class. After a reload the engine finds the class by the key, so the key has to be in the registry before the saved layout comes back, which is why it is registered in the constructor. Without it the restored tab shows _Failed to load content: Component "counter" is not registered in GrdContentRegistry._ and a **Try again** button.
- **`openComponentTab({ title: 'Counter', componentKey: 'counter' })`**: the tab is opened by the key; the class comes from the registry. An HTML tab needs nothing: its HTML is saved with it.
- **The titles have no numbers any more.** The number in 010 came from a field of `App`, which starts from 0 again after a reload, while the restored tabs keep their titles.
- **File › Reset layout** calls `resetLayout()`: the engine goes back to its default layout (the empty area) and saves that.

## What is saved and what is not

Try these in the running application:

- **The arrangement comes back.** Split the area (drop a tab on an arrow), move the line between the panels, drag a tab out into a floating window, then reload: the panels, their sizes, the tabs in them and the floating window with its place and size are back.
- **The HTML comes back.** An HTML tab is saved with its content.
- **A component comes back as a new component.** The component tab is there again, but its component is created anew: click the counter a few times, reload, and it says _Clicked 0 times_. The engine saves where the tab is, not what is inside the component (a component can save a state of its own; that is for a later tutorial).
- **Closing is saved too.** Close a tab and reload: it stays closed.
- **Reset layout** empties the area, and a reload after it starts empty as well.
- **See it.** In the developer tools of the browser, _Application › Local storage › http://localhost:30015_ has the key `saving-the-layout`.

## Build it from 010

The quick way: `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 010.

1. Start from your application of 010 (or one made by `npm run tutorial:eject 010 path/to/new-folder` in the root of the repository).

2. In the template of `App`, give the engine a key instead of `null`:

   ```html
   <grd-docking-engine layoutStorageKey="saving-the-layout" />
   ```

3. Add a constructor that turns on automatic saving and registers the component, and import `inject`, `GrdEngineSettings` and `GrdContentRegistry`:

   ```ts
   constructor() {
     inject(GrdEngineSettings).setAutoSaveLayout(true);
     inject(GrdContentRegistry).registerComponent('counter', Counter);
   }
   ```

4. Open the component tab by its key, drop the numbers from the titles (and the field `opened`), and add the command that resets the layout:

   ```ts
   { label: 'Add &component', run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }) },
   { label: 'Add &HTML', run: () => this.engine().openHtmlTab({ title: 'Notes', content: '<p>Plain <b>HTML</b> in a tab.</p>' }) },
   { separator: true },
   { label: '&Reset layout', run: () => this.engine().resetLayout() },
   ```

5. Run it:

   ```
   ng serve
   ```
