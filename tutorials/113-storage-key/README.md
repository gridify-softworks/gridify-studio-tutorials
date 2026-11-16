# 113 – The storage key

This tutorial shows how to choose where an engine keeps its layout in `localStorage`, so that several engines on one page do not overwrite each other. You will learn how to:

- give each engine a key of its own (`layoutStorageKey`), so that each keeps a layout of its own;
- make an engine that saves nothing and starts empty after every reload (the key `null`);
- see what `localStorage` has under the keys, and how many other keys share the address;
- forget the saved layout of one engine (`clearSavedLayout()`).

The page has three engines side by side: **Left** and **Right** with a key each, and **Scratch** with `null`. It is the application of 015 with three engines instead of one, from the series about saving (110–125).

```
npm run tutorial 113
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30113, add tabs to each of the three engines (the menus **Left**, **Right** and **Scratch**), watch the panel at the bottom, and press F5.

Every tutorial runs on an address of its own (this one on http://localhost:30113), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-113-left` and `tutorial-113-right`), as an application should: everything that runs on one address shares one `localStorage`. The panel counts the other keys of the address.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository). Automatic saving stays on (`setAutoSaveLayout(true)` of 015): every change is saved at once, so the panel shows it at once.

### Step 1: three engines, three keys

The template has three engines in a row, each under a heading with its key. `#left`, `#right` and `#scratch` name them for the code:

```html
<div class="engines">
  <section>
    <h2>Left <code>tutorial-113-left</code></h2>
    <grd-docking-engine #left layoutStorageKey="tutorial-113-left" (layoutSaved)="read()" />
  </section>
  <section>
    <h2>Right <code>tutorial-113-right</code></h2>
    <grd-docking-engine #right layoutStorageKey="tutorial-113-right" (layoutSaved)="read()" />
  </section>
  <section>
    <h2>Scratch <code>null</code></h2>
    <!-- null: this engine loads nothing and saves nothing -->
    <grd-docking-engine #scratch [layoutStorageKey]="null" />
  </section>
</div>
```

`null` is a value, not a text, so Scratch binds it with `[layoutStorageKey]="null"`. Written as `layoutStorageKey="null"`, it would be a key named `null`.

With more than one engine, `viewChild` finds each one by its name:

```ts
private readonly left = viewChild.required<GrdDockingEngine>('left');
private readonly right = viewChild.required<GrdDockingEngine>('right');
private readonly scratch = viewChild.required<GrdDockingEngine>('scratch');
```

### Step 2: a menu for each engine

The File menu of 015 becomes three menus with the same commands, each for its own engine:

```ts
/** A menu for one engine: the same commands, each for its own engine. */
private menuOf(id: string, label: string, engine: () => GrdDockingEngine): GrdMenu {
  return {
    id,
    label,
    items: [
      {
        label: 'Add &component',
        run: () => engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
      },
      {
        label: 'Add &HTML',
        run: () =>
          engine().openHtmlTab({ title: 'Notes', content: '<p>Plain <b>HTML</b> in a tab.</p>' }),
      },
      { separator: true },
      { label: '&Reset layout', run: () => engine().resetLayout() },
      { label: '&Forget the saved layout', run: () => this.forget(engine()) },
    ],
  };
}

protected readonly menus: GrdMenu[] = [
  this.menuOf('left', '&Left', () => this.left()),
  this.menuOf('right', '&Right', () => this.right()),
  this.menuOf('scratch', '&Scratch', () => this.scratch()),
];
```

`engine` is a function, not the engine itself: the menus are made when `App` is created, and the engines exist only later, when the view is.

**Forget the saved layout** removes the layout that an engine saved under its key, with `clearSavedLayout()`. The tabs stay on the screen; the next F5 shows the default layout, because nothing is saved any more. The panel of step 3 is read again right away:

```ts
/** Removes the saved layout of an engine: the tabs stay on the screen, and F5 shows the default layout. */
private forget(engine: GrdDockingEngine): void {
  engine.clearSavedLayout();
  this.read();
}
```

With automatic saving on, the engine would normally write its layout again when the page is closed or reloaded; after `clearSavedLayout()` it does not, until something that is saved changes again (a tab opened, moved, closed: then it saves as before). For Scratch it does nothing and returns `false`: there is no key.

### Step 3: what localStorage has

Above the class, the keys of the tutorial and two functions that describe what is stored under a key:

```ts
/** The keys of this tutorial: the panel at the bottom shows what `localStorage` has under them. */
const KEYS = ['tutorial-113-left', 'tutorial-113-right'];

/** A row of the panel: a key and what is stored under it. */
interface Stored {
  readonly key: string;
  readonly text: string;
}

/** The tabs in a saved layout: the docked ones (in `coreTree`) and the floating windows. */
function countTabs(node: { tabs?: unknown[]; children?: unknown[] }): number {
  if (Array.isArray(node.tabs)) return node.tabs.length;
  return (node.children ?? []).reduce<number>((sum, child) => sum + countTabs(child as object), 0);
}

/** What `localStorage` has under a key, in words. */
function describe(key: string): string {
  // A value that is not a saved layout (changed by hand, say) must not stop the page: the engine does not use it either.
  try {
    const json = localStorage.getItem(key);
    if (json === null) return 'nothing yet';
    const saved = JSON.parse(json) as { coreTree: object; floatingWindows?: unknown[] };
    const tabs = countTabs(saved.coreTree) + (saved.floatingWindows?.length ?? 0);
    return `${tabs} ${tabs === 1 ? 'tab' : 'tabs'}, ${json.length} characters`;
  } catch {
    return 'not a saved layout';
  }
}
```

`App` keeps the rows in a signal and reads them again after every save of Left or Right (the `(layoutSaved)="read()"` of step 1), and once in the constructor:

```ts
/** What `localStorage` has under the keys of this tutorial; `read()` reads it again. */
protected readonly stored = signal<Stored[]>([]);
/** How many keys of `localStorage` are not this tutorial's (everything that runs on the same address shares it). */
protected readonly others = signal(0);
```

```ts
/** Reads `localStorage` again (after every save of the left or the right engine). */
protected read(): void {
  this.stored.set(KEYS.map((key) => ({ key, text: describe(key) })));
  try {
    this.others.set(Object.keys(localStorage).filter((key) => !KEYS.includes(key)).length);
  } catch {
    // a blocked storage cannot be read: the count stays as it is
  }
}
```

The panel goes under the engines:

<!-- prettier-ignore -->
```html
<ul class="stored" aria-label="What localStorage has">
  @for (row of stored(); track row.key) {
    <li>
      <code>{{ row.key }}</code> {{ row.text }}
    </li>
  }
  <li>Scratch has no key: nothing of it is stored</li>
  <li>Other keys on this address: {{ others() }}</li>
</ul>
```

This is only for learning: an application never needs to read the saved layout itself, the engine does it.

### Step 4: the page around the engines

The page now shows more than an engine: the gaps between the engines, the headings and the panel. The styles of `App` give them the colors of the theme, so they follow the light and the dark theme like the engines:

```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* the page shows more than the engines: the colors of the theme, light and dark */
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}
```

## Try it

1. **Start the application.** The panel already has both keys, with _0 tabs_ each: with automatic saving on, an engine writes its layout as soon as it starts.
2. **Left › Add component, Right › Add HTML twice, Scratch › Add HTML.** The panel says _1 tab_ under `tutorial-113-left` and _2 tabs_ under `tutorial-113-right`. Scratch is not in it.
3. **F5.** Left has its counter, Right its two notes, Scratch is empty: it had no key, so nothing of it was saved.
4. **Left › Reset layout.** `tutorial-113-left` says _0 tabs_; Right is untouched. F5 shows the same.
5. **Close a tab in Right, then F5.** It stays closed: every engine saves its own changes under its own key.
6. **Right › Forget the saved layout.** The panel says _nothing yet_ under `tutorial-113-right`, and the tabs of Right are still on the screen. **F5:** Right shows its default layout (and saves it again, as at the start); Left is untouched.
7. **Look at _Other keys on this address_.** It counts the keys that are not this tutorial's. This tutorial has its address to itself, so they are few or none; on an address of many applications, they would all be there. In the developer tools of the browser, _Application › Local storage › http://localhost:30113_ lists them all, and a key added there by hand is counted after the next save.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** The keys of this tutorial: the panel at the bottom shows what `localStorage` has under them. */
const KEYS = ['tutorial-113-left', 'tutorial-113-right'];

/** A row of the panel: a key and what is stored under it. */
interface Stored {
  readonly key: string;
  readonly text: string;
}

/** The tabs in a saved layout: the docked ones (in `coreTree`) and the floating windows. */
function countTabs(node: { tabs?: unknown[]; children?: unknown[] }): number {
  if (Array.isArray(node.tabs)) return node.tabs.length;
  return (node.children ?? []).reduce<number>((sum, child) => sum + countTabs(child as object), 0);
}

/** What `localStorage` has under a key, in words. */
function describe(key: string): string {
  // A value that is not a saved layout (changed by hand, say) must not stop the page: the engine does not use it either.
  try {
    const json = localStorage.getItem(key);
    if (json === null) return 'nothing yet';
    const saved = JSON.parse(json) as { coreTree: object; floatingWindows?: unknown[] };
    const tabs = countTabs(saved.coreTree) + (saved.floatingWindows?.length ?? 0);
    return `${tabs} ${tabs === 1 ? 'tab' : 'tabs'}, ${json.length} characters`;
  } catch {
    return 'not a saved layout';
  }
}

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <div class="engines">
      <section>
        <h2>Left <code>tutorial-113-left</code></h2>
        <grd-docking-engine #left layoutStorageKey="tutorial-113-left" (layoutSaved)="read()" />
      </section>
      <section>
        <h2>Right <code>tutorial-113-right</code></h2>
        <grd-docking-engine #right layoutStorageKey="tutorial-113-right" (layoutSaved)="read()" />
      </section>
      <section>
        <h2>Scratch <code>null</code></h2>
        <!-- null: this engine loads nothing and saves nothing -->
        <grd-docking-engine #scratch [layoutStorageKey]="null" />
      </section>
    </div>
    <ul class="stored" aria-label="What localStorage has">
      @for (row of stored(); track row.key) {
        <li>
          <code>{{ row.key }}</code> {{ row.text }}
        </li>
      }
      <li>Scratch has no key: nothing of it is stored</li>
      <li>Other keys on this address: {{ others() }}</li>
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      /* the page shows more than the engines: the colors of the theme, light and dark */
      background: var(--grd-bg-main);
      color: var(--grd-text-main);
    }
    .engines {
      flex: 1;
      min-height: 0;
      display: flex;
      gap: 6px;
      padding: 6px;
    }
    section {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    h2 {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 600;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
      border: 1px solid var(--grd-border-color);
    }
    .stored {
      margin: 0;
      padding: 6px 12px 8px;
      list-style: none;
      border-top: 1px solid var(--grd-border-color);
      font-size: 13px;
      line-height: 1.6;
    }
    code {
      font-family: var(--grd-font-mono);
    }
  `,
})
export class App {
  private readonly left = viewChild.required<GrdDockingEngine>('left');
  private readonly right = viewChild.required<GrdDockingEngine>('right');
  private readonly scratch = viewChild.required<GrdDockingEngine>('scratch');

  /** What `localStorage` has under the keys of this tutorial; `read()` reads it again. */
  protected readonly stored = signal<Stored[]>([]);
  /** How many keys of `localStorage` are not this tutorial's (everything that runs on the same address shares it). */
  protected readonly others = signal(0);

  constructor() {
    // Save the layout after every change: the engines with a key save, the one with null does not.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
    this.read();
  }

  /** Reads `localStorage` again (after every save of the left or the right engine). */
  protected read(): void {
    this.stored.set(KEYS.map((key) => ({ key, text: describe(key) })));
    try {
      this.others.set(Object.keys(localStorage).filter((key) => !KEYS.includes(key)).length);
    } catch {
      // a blocked storage cannot be read: the count stays as it is
    }
  }

  /** A menu for one engine: the same commands, each for its own engine. */
  private menuOf(id: string, label: string, engine: () => GrdDockingEngine): GrdMenu {
    return {
      id,
      label,
      items: [
        {
          label: 'Add &component',
          run: () => engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            engine().openHtmlTab({ title: 'Notes', content: '<p>Plain <b>HTML</b> in a tab.</p>' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => engine().resetLayout() },
        { label: '&Forget the saved layout', run: () => this.forget(engine()) },
      ],
    };
  }

  /** Removes the saved layout of an engine: the tabs stay on the screen, and F5 shows the default layout. */
  private forget(engine: GrdDockingEngine): void {
    engine.clearSavedLayout();
    this.read();
  }

  protected readonly menus: GrdMenu[] = [
    this.menuOf('left', '&Left', () => this.left()),
    this.menuOf('right', '&Right', () => this.right()),
    this.menuOf('scratch', '&Scratch', () => this.scratch()),
  ];
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **One key, one layout.** An engine loads its layout from its key when it starts and saves it there. Two engines with two keys keep two layouts that know nothing of each other; the settings of `GrdEngineSettings` (automatic saving here) are the same for all of them.
- **Without the input, the key is `grd-layout-state`.** Every application on the same address that leaves the key out uses that one. A key of your own keeps your layout apart; with several engines on a page, each needs a key of its own.
- **Two engines with the same key** would each restore the other's layout after a reload. The engine reports it in the console: _The engine … saves its layout under the key …, which another engine on the page uses too_.
- **`null` turns saving off for one engine.** Nothing is loaded at the start (it always starts from its default layout), nothing is saved, `saveLayout()` returns `false` and `loadLayout()` finds nothing. It suits a scratch area, a preview, an engine in a dialog. The other engines save as before.
- **`clearSavedLayout()` removes what is saved, not what is shown.** It is the way to delete the layout under a key (no `localStorage.removeItem` of your own: with automatic saving on, the engine would write it back when the page closes). It returns `false` with the key `null` or when the storage refuses. `hasSavedLayout()` asks whether there is something saved (tutorial 111).
- **The key may change while the engine runs.** What waits to be saved is written under the old key, then the layout of the new key is loaded (the default layout when it has none). That is how a layout per signed-in user works: tutorial 122.
- **`localStorage` belongs to the address** (the scheme, the host and the port): `http://localhost:30113` (this tutorial) is one, `http://localhost:30114` (the next one) another. Everything that runs on one address shares it, and it holds a few megabytes. A layout takes a few hundred characters (an empty one about 330 here) plus the HTML of its HTML tabs.

## What you get without writing any of it

- **Saving and loading per engine**, with nothing shared between them but the settings.
- **A warning for a shared key**, instead of two engines that quietly overwrite each other.
- **No crash when the storage fails.** A full or blocked `localStorage` makes a save return `false` and writes the reason to the console; the application goes on.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 113 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new storage-key --style=scss --ssr=false --skip-tests
   cd storage-key
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
