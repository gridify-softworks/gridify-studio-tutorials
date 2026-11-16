# 025 – Roles docking mode

This tutorial shows how the **roles** mode, the default mode of the engine, docks the tabs: a document goes only into a document panel, and a tool only into a tool panel. You will learn how to:

- dock documents and tools in the roles mode (`setDockingMode('roles')`, the default);
- choose what the empty document panel shows: nothing (`null`), the caption of the engine, or a component of your own (`emptyDocument`);
- change that choice while the application runs, from a signal, with a menu whose check marks follow it (`checked`, menus in a `computed`).

020 switched the roles mode off; this is the application of 020 in the roles mode, with one more menu, **Empty content**. Its number lies between 020 and 030, because it goes deeper into what 020 only mentions. The layout is saved, as in 015.

```
npm run tutorial 025
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30025. The engine starts with one empty document panel, and the caption of the engine is in it. Choose something else in **Empty content**, then use **File › Add tool** and **File › Add document** and drag the tabs around.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  GrdMenuItem,
} from '@gridify/studio';
import { ClockTool } from './clock-tool';
import { Counter } from './counter';
import { EmptyArea } from './empty-area';

/** What the empty document panel shows: nothing, the caption of the engine, or a component of your own. */
type EmptyContent = 'nothing' | 'default' | 'own';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="roles-docking-mode" [emptyDocument]="emptyDocument()" />
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
  protected readonly emptyContent = signal<EmptyContent>('default');
  protected readonly emptyDocument = computed(() => {
    switch (this.emptyContent()) {
      case 'nothing':
        return null; // an empty panel
      case 'default':
        return undefined; // the caption of the engine
      case 'own':
        return EmptyArea; // a component of your own
    }
  });

  constructor() {
    const settings = inject(GrdEngineSettings);
    // Documents go into document panels, tools into tool panels (the default mode).
    settings.setDockingMode('roles');
    settings.setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('clock', ClockTool);
    registry.registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
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
    {
      id: 'empty',
      label: '&Empty content',
      items: [
        this.choice('&Nothing', 'nothing'),
        this.choice('&Default', 'default'),
        this.choice('&Own component', 'own'),
      ],
    },
  ]);

  /** An item of the menu Empty content: checked while it is the choice. */
  private choice(label: string, content: EmptyContent): GrdMenuItem {
    return {
      label,
      checked: this.emptyContent() === content,
      run: () => this.emptyContent.set(content),
    };
  }
}
```

`src/app/empty-area.ts`, the component of the choice **Own component**:

```ts
import { Component } from '@angular/core';

/** What the empty document panel shows while no document is open (the choice Own component). */
@Component({
  selector: 'app-empty-area',
  template: `
    <h2>No document</h2>
    <p>File › Add document</p>
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

`src/app/clock-tool.ts` is the one of 020, `src/app/counter.ts` and `src/styles.scss` are the ones of 010.

### What changed against 020

- **`setDockingMode('roles')`** instead of `'free'`. The roles mode is the default, so 010 and 015 did not set it; without the line this application works the same.
- **A second menu, Empty content.** Its three items have a check mark (`checked`) that shows the current choice. The menus are a `computed` now (`[menus]="menus()"`), so the check moves when the choice changes.
- **`emptyDocument` comes from a signal.** The `computed` turns the choice into what the engine takes: `null`, nothing (`undefined`), or the class of a component.
- **The empty area talks about documents.** In the roles mode it fills the empty document panel, and the tools stay next to it.
- **The layout has a key of its own**, `roles-docking-mode`.

## The roles mode

- **A first start**, or **File › Reset layout**: one empty document panel, with the empty content in it.
- **File › Add document** puts the counter into the document panel, and the empty content goes away.
- **File › Add tool** gives the clock a tool panel of its own, on the right of the document panel.
- **File › Add document again**, while the clock panel has the focus (the last tab added takes it): the counter still goes into the document panel, next to the first one. In the free mode of 020 it would join the clock in its panel.
- **Drag the clock over the counters.** There is no square in the middle of the panel: a tool does not go into a document panel. The four arrows in the middle dock the clock beside the whole document area (the left one puts it on the left of the documents), and the arrows at the edges of the engine dock it at the outer edge. Released anywhere else, it becomes a floating window.
- **Close the last document.** The document panel stays, empty, and shows the empty content again.
- **Reload the page**: the layout comes back, as in 015.

A document that the user works in for long can also get the whole area of the panels for a while (maximized: the documents can by default, a double-click on the strip of their tabs): see [027](../027-maximize-a-panel/README.md).

## The empty content

`emptyDocument` is an input of the engine. It tells the engine what to show in the empty document panel:

| Value                 | Choice        | The panel shows                                                                                                              |
| --------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| not set (`undefined`) | Default       | the caption of the engine: "No open documents" and "Open a document, or drag a tab here", in the language of the application |
| `null`                | Nothing       | nothing                                                                                                                      |
| a component class     | Own component | the component; the engine creates it when the panel is empty and destroys it when a document takes its place                 |

A string of HTML works too (it is application code and is not sanitized).

The engine takes a new value at once, also while the empty panel is shown: choose **Default** with no document open and the caption replaces your component.

The choice lives in a signal of the application and is not saved: after a reload it is **Default** again. The layout is saved.

## Build it from 020

The quick way: `npm run tutorial:eject 025 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 020.

1. Start from your application of 020 (or one made by `npm run tutorial:eject 020 path/to/new-folder` in the root of the repository).

2. In `app.ts`, give the engine its own key, bind the empty content and switch the mode:

   ```html
   <grd-menu-bar [menus]="menus()" />
   <grd-docking-engine layoutStorageKey="roles-docking-mode" [emptyDocument]="emptyDocument()" />
   ```

   ```ts
   settings.setDockingMode('roles');
   ```

3. Add the choice and what it means for the engine:

   ```ts
   type EmptyContent = 'nothing' | 'default' | 'own';

   protected readonly emptyContent = signal<EmptyContent>('default');
   protected readonly emptyDocument = computed(() => {
     switch (this.emptyContent()) {
       case 'nothing':
         return null;
       case 'default':
         return undefined;
       case 'own':
         return EmptyArea;
     }
   });
   ```

4. Make `menus` a `computed`, add the menu Empty content after File, and the method `choice` (see the code above):

   ```ts
   {
     id: 'empty',
     label: '&Empty content',
     items: [
       this.choice('&Nothing', 'nothing'),
       this.choice('&Default', 'default'),
       this.choice('&Own component', 'own'),
     ],
   },
   ```

5. Change the text of `empty-area.ts` to "No document" and "File › Add document".

6. Run it:

   ```
   ng serve
   ```
