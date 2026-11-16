# 114 – HTML that is saved

This tutorial shows how the HTML of an HTML tab is saved with the layout, so that the tab comes back after a reload exactly as it was. You will learn how to:

- open an HTML tab whose HTML is saved (`serialize: 'html'`, the default);
- change the HTML of an open tab (`api.setTabHtml`), and have the change saved too;
- look at what the engine wrote into `localStorage` for a tab.

What comes back after a reload is the HTML itself, not the code that made it: a tab that tells when it was made still shows the time it was made. It is the application of 015 with a few lines more, from the series about saving (110–125); 115, 116 and 117 use its dialog that shows what is saved.

```
npm run tutorial 114
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30114, add an HTML tab (**File › Add HTML**), change it (**Edit › Change the active HTML tab**), look at **File › Show what is saved**, and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30114), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-114-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

The key under which the engine keeps the layout is a constant, and the template binds it:

```ts
/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-114-layout';

/** The time of the day, `10:41:07`. */
const now = (): string => new Date().toLocaleTimeString('en-GB');

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
```

```html
<grd-docking-engine [layoutStorageKey]="layoutKey" />
```

`App` gets the field `protected readonly layoutKey = LAYOUT_KEY;`, and **File › Add HTML** calls a method of its own: `{ label: 'Add &HTML', run: () => this.addHtml() }`.

### Step 2: an HTML tab that tells when it was made

```ts
/**
 * An HTML tab. `serialize` is not given, so it is `'html'` (the default): the HTML itself is saved with the layout. The time in it is
 * written once, now; after a reload it is still this time, because the saved HTML comes back, not the code that made it.
 */
private addHtml(): void {
  this.engine().openHtmlTab({
    title: 'Notes',
    content: `<p>Plain <b>HTML</b> in a tab, made at ${now()}.</p>`,
  });
}
```

Nothing in it says how the tab is saved: `serialize` is left out, and for an HTML tab that means `'html'`, the HTML is saved. The time is written into the HTML once, when the tab is opened.

### Step 3: change the HTML of a tab

A new menu **Edit** with one command, `{ label: '&Change the active HTML tab', run: () => this.changeActive() }`:

```ts
/**
 * Adds a line to the HTML of the active tab. `setTabHtml` shows the new HTML at once and asks for a save, so the changed HTML is what
 * comes back after a reload. A component tab has no HTML: nothing happens for it.
 */
private changeActive(): void {
  const engine = this.engine();
  const active = engine.activeTab();
  const tab = active ? engine.api.findById(active.tabId) : null;
  if (!engine.api.isTab(tab) || typeof tab.content !== 'string') return;
  engine.api.setTabHtml(tab.id, `${tab.content}<p>Changed at ${now()}.</p>`);
}
```

`engine.activeTab()` is a signal of the tab the user works in (or `null`). `api.findById` finds the tab by its id, `api.isTab` tells a tab from a panel, and `api.setTabHtml(id, html)` puts the new HTML into the tab.

### Step 4: show what is saved

**File › Show what is saved** reads `localStorage` under the key and shows the JSON in a dialog (`GrdDialog`, injected as `private readonly dialogs = inject(GrdDialog);`):

```ts
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
```

The long lines of the JSON wrap by a rule in `src/styles.scss` (the HTML of a dialog is not a part of a component, so the rule is a global one):

```scss
.saved {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
```

This is only for learning: an application never needs to read the saved layout itself, the engine does it.

## Try it

1. **File › Add HTML.** The tab says _Plain HTML in a tab, made at 10:41:07_ (the time of now).
2. **Wait a few seconds and press F5.** The tab is back and says the same time, _made at 10:41:07_: the saved HTML came back, the method `addHtml` did not run again.
3. **Edit › Change the active HTML tab** (twice, if you like). A line _Changed at 10:42:30_ is added each time.
4. **Press F5.** The tab has the changed HTML, every line of it.
5. **File › Show what is saved.** The tab is in the JSON with its HTML under `content`, `"serialize": "html"` and `"contentEdited": true`.
6. **File › Add component**, then **Edit › Change the active HTML tab** while the counter is the active tab: nothing happens, a component has no HTML (`typeof tab.content !== 'string'`). In the saved JSON the counter is `"componentKey": "counter"`, without HTML.
7. **File › Reset layout**, then F5: the area is empty again.

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
const LAYOUT_KEY = 'tutorial-114-layout';

/** The time of the day, `10:41:07`. */
const now = (): string => new Date().toLocaleTimeString('en-GB');

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

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        { label: 'Add &HTML', run: () => this.addHtml() },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [{ label: '&Change the active HTML tab', run: () => this.changeActive() }],
    },
  ];

  /**
   * An HTML tab. `serialize` is not given, so it is `'html'` (the default): the HTML itself is saved with the layout. The time in it is
   * written once, now; after a reload it is still this time, because the saved HTML comes back, not the code that made it.
   */
  private addHtml(): void {
    this.engine().openHtmlTab({
      title: 'Notes',
      content: `<p>Plain <b>HTML</b> in a tab, made at ${now()}.</p>`,
    });
  }

  /**
   * Adds a line to the HTML of the active tab. `setTabHtml` shows the new HTML at once and asks for a save, so the changed HTML is what
   * comes back after a reload. A component tab has no HTML: nothing happens for it.
   */
  private changeActive(): void {
    const engine = this.engine();
    const active = engine.activeTab();
    const tab = active ? engine.api.findById(active.tabId) : null;
    if (!engine.api.isTab(tab) || typeof tab.content !== 'string') return;
    engine.api.setTabHtml(tab.id, `${tab.content}<p>Changed at ${now()}.</p>`);
  }

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

`src/app/counter.ts` is the one of 015. `src/styles.scss` is the one of 015 with the rule `.saved` of step 4.

## How it fits together

- **`serialize: 'html'` is the default of an HTML tab.** The engine writes the HTML of the tab into the saved layout (`content`), and on a load the tab shows that HTML again. Whatever made the HTML (a template string with the time, data of a server) does not run again: the HTML is a copy of how the tab looked when it was saved.
- **What is saved for a tab.** Every field of the tab except the ones that live only while the page runs: `id`, `role`, `icon`, `title` (the text it has now), `content`, `serialize`, `colorIndex` (the color of the document tab), `contentEdited`, `tag` and the behavior of the tab when it has them. Not saved: a component class (`componentType`), the text of the status bar of the tab, the mark of unsaved changes (`dirty`; it is saved only for a component that saves its own state, tutorial 120) and the signals behind a title or a content.
- **The ids are new after a load.** The saved `id` (`grd-id-2`) is what the tab had; on a load the engine gives every node a new id. Do not keep ids of tabs between reloads; find a tab by its `tag` (`api.getByTag`), which is saved and stays.
- **`setTabHtml` writes and saves.** It changes `content` of the tab, puts the new HTML into the page at once (the tab is not drawn again, only its HTML is replaced) and asks for a save. With automatic saving on (`setAutoSaveLayout(true)`, from 015) the layout is written a moment later (250 ms, merged with other changes).
- **`contentEdited: true`** marks a tab whose HTML was written by `setTabHtml`. It matters for a tab of a default layout whose content is a signal (a text that follows the language): after a load such a tab is linked to its signal again, unless its HTML was changed; then the changed HTML stays.
- **Only an HTML tab has HTML.** `setTabHtml` on a component tab (or a tab whose HTML comes from a callback, tutorial 115) does nothing and says so in the console. That is why `changeActive` asks first.

## What you get without writing any of it

- **Saving and loading** of the HTML of every HTML tab, with the panels, their sizes and the floating windows around it.
- **A change shown at once**: `setTabHtml` replaces the HTML in the open tab; the other tabs, the scroll position of the panel and the layout are not touched.
- **One save for many changes**: three quick changes are written once.
- **The saved layout carries a version** (`"version": 1`): a layout of another version is not loaded, the engine starts from its default layout instead.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 114 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new html-saved --style=scss --ssr=false --skip-tests
   cd html-saved
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`), with the rule `.saved` of step 4.

5. Add `src/app/counter.ts` of 015 and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
