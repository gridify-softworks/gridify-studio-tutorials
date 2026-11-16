# 116 – Tabs that are not saved

This tutorial shows how to keep a tab out of the saved layout, and which tabs the engine leaves out by itself. You will learn how to:

- leave an HTML tab or a component tab out of the saved layout (`serialize: 'none'`);
- see why a component tab without a `componentKey` is left out too, and the warning in the console about it;
- see what happens to a panel that is left without tabs.

The menu **File** opens five tabs, each saved in another way or not at all, and a reload shows which of them survive. It is the application of 015 with a few lines more, from the series about saving (110–125); the dialog of 114 shows what is saved.

```
npm run tutorial 116
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30116, add the five tabs of the menu **File**, and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30116), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-116-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

As in 114: a constant, a field of `App` and a binding in the template.

```ts
/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-116-layout';
```

```html
<grd-docking-engine [layoutStorageKey]="layoutKey" />
```

### Step 2: two HTML tabs, one of them not saved

```ts
{
  label: 'Add HTML, &saved',
  run: () =>
    this.engine().openHtmlTab({
      title: 'HTML (saved)',
      content: `<p>An HTML tab without <code>serialize</code>, so <code>'html'</code>: its HTML is saved. It is back after F5.</p>`,
    }),
},
{
  label: 'Add HTML, &not saved',
  run: () =>
    this.engine().openHtmlTab({
      title: 'HTML (not saved)',
      serialize: 'none',
      content: `<p>An HTML tab with <code>serialize: 'none'</code>: it is not saved. It is gone after F5.</p>`,
    }),
},
```

The first one is the HTML tab of 114: without `serialize` its HTML is saved. `serialize: 'none'` leaves the second one out of the saved layout.

### Step 3: three component tabs

```ts
{
  label: 'Add component, s&aved',
  run: () =>
    this.engine().openComponentTab({ title: 'Counter (saved)', componentKey: 'counter' }),
},
{
  label: 'Add component, n&ot saved',
  run: () =>
    this.engine().openComponentTab({
      title: 'Counter (not saved)',
      componentType: Counter,
      serialize: 'none',
    }),
},
{
  label: 'Add component without a &key',
  run: () =>
    this.engine().openComponentTab({ title: 'Counter (no key)', componentType: Counter }),
},
```

All three show the counter of 015. The first is the one of 015: the class is found by its key, `counter`, registered in the constructor. The second is given by its class and says `serialize: 'none'`. The third is given by its class only: nothing in it says how to make it again after a reload.

### Step 4: show what is saved

**File › Show what is saved** is the dialog of 114 (its step 4, with the rule `.saved` in `src/styles.scss`).

## Try it

1. **Add the five tabs of the menu File**, from the top. They open in one panel; each says in its title what happens to it.
2. **Look into the console of the browser** (F12). There is one warning:

   ```
   [grd-docking-engine] Tab "Counter (no key)" has a component with neither a `componentKey` nor a callback, so it will not be restored after a page reload (set `componentKey`, or `serialize: 'none'` to suppress this warning).
   ```

   It came with the save that followed the new tab, and it is said once, not at every save.

3. **Click the tab Counter (saved), and its button twice**: _Clicked 2 times_.
4. **Drag the tab HTML (not saved) to the right half of the area**, so that it has a panel of its own.
5. **Press F5.** Two tabs are back, _HTML (saved)_ and _Counter (saved)_, in one panel. The panel on the right is gone with its only tab. The counter says _Clicked 0 times_: the tab is back with a new component (a component that wants its own state back saves it itself, tutorial 120). There is no new warning: the tab without a key is not there any more.
6. **File › Show what is saved.** Two tabs: the HTML tab with its `content` and `"serialize": "html"`, the counter as `"componentKey": "counter"`, `"serialize": "json"` and `"inputs": {}`. Nothing of the other three.
7. **File › Reset layout, then F5**: the area is empty.

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
} from '@gridify/studio';
import { Counter } from './counter';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-116-layout';

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
  protected readonly layoutKey = LAYOUT_KEY;
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** Five tabs, each saved in another way (or not at all): the title says which. */
  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add HTML, &saved',
          run: () =>
            this.engine().openHtmlTab({
              title: 'HTML (saved)',
              content: `<p>An HTML tab without <code>serialize</code>, so <code>'html'</code>: its HTML is saved. It is back after F5.</p>`,
            }),
        },
        {
          label: 'Add HTML, &not saved',
          run: () =>
            this.engine().openHtmlTab({
              title: 'HTML (not saved)',
              serialize: 'none',
              content: `<p>An HTML tab with <code>serialize: 'none'</code>: it is not saved. It is gone after F5.</p>`,
            }),
        },
        { separator: true },
        {
          label: 'Add component, s&aved',
          run: () =>
            this.engine().openComponentTab({ title: 'Counter (saved)', componentKey: 'counter' }),
        },
        {
          label: 'Add component, n&ot saved',
          run: () =>
            this.engine().openComponentTab({
              title: 'Counter (not saved)',
              componentType: Counter,
              serialize: 'none',
            }),
        },
        {
          label: 'Add component without a &key',
          run: () =>
            this.engine().openComponentTab({ title: 'Counter (no key)', componentType: Counter }),
        },
        { separator: true },
        { label: 'Show what is sa&ved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];

  /** What the engine wrote into localStorage under the key, in a dialog: the saved layout as JSON. */
  private showSaved(): void {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const text = saved ? JSON.stringify(JSON.parse(saved), null, 2) : 'Nothing is saved yet.';
    this.dialogs.open({
      title: `localStorage["${LAYOUT_KEY}"]`,
      html: `<pre class="saved">${escapeHtml(text)}</pre>`,
      width: 720,
      height: 520,
      resizable: true,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
```

`src/app/counter.ts` is the one of 015. `src/styles.scss` is the one of 114 (the one of 015 with the rule `.saved`).

## How it fits together

- **Which tabs are saved.** At every save the engine looks at `serialize` of each tab and at what the tab has:

  | The tab                         | `serialize`            | What is saved                    | After a reload                 |
  | ------------------------------- | ---------------------- | -------------------------------- | ------------------------------ |
  | HTML                            | not given, so `'html'` | its HTML (114)                   | back                           |
  | HTML                            | `'callback'`           | the key and the parameters (115) | back, the HTML is loaded again |
  | HTML                            | `'none'`               | nothing                          | gone                           |
  | component with a `componentKey` | not given, so `'json'` | the key and the inputs (117)     | back, with a new component     |
  | component with a factory        | `'callback'`           | the key and the parameters (119) | back, made by the factory      |
  | component                       | `'none'`               | nothing                          | gone                           |
  | component with a class only     | not given              | nothing, and a warning           | gone                           |

- **`'none'` is for tabs that mean nothing after a reload**: a search result, a preview, a step of a wizard. The application opens them again when they are needed.
- **A class cannot go into JSON.** A component tab with only `componentType` could not be made again after a reload, so the engine leaves it out rather than bring back an empty tab, and the warning names the tab and the two ways out: a `componentKey` (tutorial 117), or `serialize: 'none'` when leaving it out is what you want (then the warning goes away).
- **The warning is said once.** The engine saves after every change (250 ms after the last one), so the same warning would otherwise fill the console; it is said once for a tab of that title while the page runs.
- **Panels go with their tabs.** A panel whose tabs are all left out is left out too, the same way as when its last tab is closed: its neighbours take its place. A floating window of a tab that is not saved is left out with it.
- **Not saved is not closed.** While the page runs, such a tab is a tab like any other: it is moved, docked and floated, and its component keeps its state. Only the saved layout has no trace of it.

## What you get without writing any of it

- **A decision for every tab at every save**: what can come back is saved, the rest is left out. A reload never brings back a tab that cannot show anything.
- **The warning** that names the tab and the fix, once.
- **No empty panels** after a reload: a panel left without tabs is removed, and the layout closes up.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 116 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new not-saved --style=scss --ssr=false --skip-tests
   cd not-saved
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 114 (`@use '@gridify/studio/styles';`, a full height for `html` and `body`, and the rule `.saved`).

5. Add `src/app/counter.ts` of 015 and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
