# 010 – Hello, world: a docking application

This tutorial shows how to build the smallest docking application: a docking engine under a menu bar, and commands that open tabs in it. You will learn how to:

- put `grd-docking-engine` into a page and give it the room it needs;
- reach the engine from the code (`viewChild`);
- open a tab with an Angular component (`openComponentTab`) and a tab with plain HTML (`openHtmlTab`);
- write a menu as plain data (`GrdMenu`), with access keys.

Everything else, dragging, splitting, floating windows, closing, comes with the engine. Nothing is saved yet: a reload starts empty (015 adds the saving).

```
npm run tutorial 010
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30010 and choose **File › Add component** a few times, then **File › Add HTML**.

## The code

The whole application is one component, `src/app/app.ts`:

```ts
import { Component, viewChild } from '@angular/core';
import { GrdDockingEngine, GrdMenu, GrdMenuBar } from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- null: no layout is loaded or saved, a reload starts empty (saving comes in tutorial 015) -->
    <grd-docking-engine [layoutStorageKey]="null" />
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
  private opened = 0;

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () =>
            this.engine().openComponentTab({
              title: `Counter ${++this.opened}`,
              componentType: Counter,
            }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: `Notes ${++this.opened}`,
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
      ],
    },
  ];
}
```

The component in the tabs, `src/app/counter.ts`, is an ordinary Angular component. Nothing in it knows about the engine:

```ts
import { Component, signal } from '@angular/core';
import { GrdButton } from '@gridify/studio';

/** A real Angular component in a tab: it keeps its state while the tab is moved around. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>An Angular component with a signal.</p>
    <grd-button [label]="'Clicked ' + clicks() + ' times'" (pressed)="clicks.set(clicks() + 1)" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Counter {
  protected readonly clicks = signal(0);
}
```

And one line in `src/styles.scss` brings in the themes, the density of the controls and the text styles:

```scss
@use '@gridify/studio/styles';
```

### What the code does

- **`<grd-docking-engine>`** fills its parent, so the parent needs a height. Here the root component is a column as tall as the page: the menu bar takes what it needs, the engine the rest.
- **`viewChild.required(GrdDockingEngine)`** gives the engine to the code. The menu runs after the page is drawn, so the engine is always there by then.
- **`openComponentTab`** opens a tab with a component class; the engine creates the component. **`openHtmlTab`** opens a tab with a string of HTML. Both open the tab in the document area, and the new tab is the active one.
- **`GrdMenu`** is plain data: a menu with a label and items, each item with a label and a `run`. The `&` marks the access key of a menu or an item: Alt+F opens the File menu, then C or H chooses a command.
- **`[layoutStorageKey]="null"`**: the engine neither loads a saved layout nor saves one, so every reload starts empty. Without it the engine would load a layout saved under its default key (`grd-layout-state`), even one that another application on the same address saved. Saving takes a little more: a key of your own, automatic saving switched on, and a component tab that can be found again after a reload. That is tutorial 015.
- **The empty area**: when no document is open, the engine shows its default text. The engine's `emptyDocument` input replaces it with your own HTML or component.

## What you get without writing any of it

Try these in the running application:

- **Split the area.** Drag a tab into the content: four arrows appear. Drop the tab on one of them and the area splits; the tab gets a panel of its own on that side.
- **Reorder tabs.** Drag a tab along the header of its panel.
- **Float a tab.** Drop a tab anywhere that is not an arrow and it becomes a floating window. Move the window by its header, resize it by its corner, and put it back with **Dock back** in its **⋯** menu.
- **The menu of a tab** (**⋯** on the tab): Close, Close others, Close tabs to the left and to the right, Close all tabs, Detach to a floating window, and Maximize once the area is split.
- **Maximize a document.** Once the area is split, double-click the strip of tabs of a panel (or press the button at the end of its header, or Ctrl+M on a tab): it fills the area, and the same, or Esc, brings the others back.
- **Resize and collapse.** Drag the line between two panels; the arrow in the header of a panel folds it into a narrow bar.
- **The component keeps its state.** Click the counter a few times, then drag its tab to another panel or into a floating window: the count is still there. The tab is moved, the component is not created again.
- **Close everything.** When the last document is closed, the empty area shows its text again.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 010 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new hello-world --style=scss --ssr=false --skip-tests
   cd hello-world
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, its package is made in the repository: `npm run build:studio:community` there builds it into `dist/studio-community`. Pack it into a file here and install the file:

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

   `npm pack` names the file after the version of the library (now 0.0.0). Install the file, not the folder: npm would only link the folder, and the library would then take Angular from the repository instead of from the application.

   If npm stops with `Cannot read properties of null (reading 'edgesOut')`, add a file `.npmrc` next to `package.json` with the line `legacy-peer-deps=true` and run the command again. That is an error of npm 10.9 (the npm of Node 22.14) while it looks at the optional peer dependencies of `@angular/build`; `npm run tutorial:eject` writes the same `.npmrc` into the projects it makes.

3. Add the line `@use '@gridify/studio/styles';` at the top of `src/styles.scss`, and give the page its full height and the font of the themes:

   ```scss
   html,
   body {
     height: 100%;
     margin: 0;
     font-family: var(--grd-font-main);
   }
   ```

4. Replace `src/app/app.ts` with the code above and add `src/app/counter.ts`. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

5. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`). A docking application is bigger than the 500 kB that the starter budget expects, and `ng build` would warn about it.

6. Run it:

   ```
   ng serve
   ```
