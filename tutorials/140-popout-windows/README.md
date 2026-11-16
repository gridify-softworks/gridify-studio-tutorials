# 140 – Popout windows

This tutorial shows how a tab leaves the page for a browser window of its own and comes back, alive. You will learn how to:

- turn the popout windows on (`provideGrdPopouts()`, `grdPopoutReloadGuard()` and `popouts` on the engine);
- move a document to a new window with a command, with the menu of its tab, or by the API (`popout`, `closeWindow`, `returnAll`);
- draw bars in the windows you choose: the menu bar and the status bar in every window, a toolbar only in a popout window with a document (`*grdWindowBar`, `showForTags` with `grd:popout&doc*`);
- listen to what the engine says about the windows (`tabMovedToWindow`, `popoutOpened`, `popoutClosed`, `popoutRefused`);
- write a component that listens to the keys in the window of its tab (`GrdTabContext.window`);
- open the windows again after F5, from a bar: a browser opens a window only on a click of the user.

It is the application of 015 with the popout windows turned on. In a popout window any tab can be docked next to any other (the free mode of 020), whatever the mode of the main window.

```
npm run tutorial 140
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30140, click the counter a few times and choose **Window › Open the document in a new window**. If the browser asks about pop-up windows, allow them for localhost.

Every tutorial runs on an address of its own (this one on http://localhost:30140), so it has a `localStorage` of its own. It still keeps its layout under the key `tutorial-140-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: turn the popout windows on

Three places, and without all three nothing changes. In `src/app/app.config.ts`, `provideGrdPopouts()` puts in place what the windows need from the start of the application:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdPopouts } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // What the popout windows need from the start of the application. Without it no tab can leave the page.
    provideGrdPopouts(),
  ],
};
```

In `src/main.ts` the guard stops a second application in a popout window that the browser loads again:

```ts
// A popout window that the browser loads again must not start a second application in it.
if (!grdPopoutReloadGuard()) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
```

And the engine gets the attribute `popouts`. Its tabs may now leave the page:

```html
<grd-docking-engine
  popouts
  viewSources
  layoutStorageKey="tutorial-140-layout"
  [defaultLayout]="layout"
```

`viewSources` gives the engine's blocks to the menus (step 4 uses one of them).

### Step 2: a layout with documents and a log

Two documents and a tool. The tags of the documents start with `doc`: the toolbar of step 3 looks for them.

```ts
tabs: [
  { tag: 'doc-counter', role: 'document', title: 'Counter', componentKey: 'counter' },
  { tag: 'doc-keys', role: 'document', title: 'Keys', componentKey: 'keys' },
],
```

```ts
tabs: [{ tag: 'log', role: 'tool', title: 'Window log', componentKey: 'log' }],
```

The components are registered by their keys, so the tabs come back after a reload, in any window:

```ts
const registry = inject(GrdContentRegistry);
registry.registerComponent('counter', Counter);
registry.registerComponent('keys', KeyCounter);
registry.registerComponent('log', WindowLogTool);
```

`Counter` is the one of 015. `KeyCounter` (step 7) and `WindowLogTool` (step 5) are new.

### Step 3: the bars in every window

A bar marked with `*grdWindowBar` stays in the template of `App`, and every popout window draws a copy of it around its own engine: above the engine when the bar stands before the engine in the page, under it when after. `showForTags` says in which windows a copy is shown:

```html
<!-- every window: the main one and each popout window -->
<grd-menu-bar *grdWindowBar [menus]="menus()" [showForTags]="['*']" />
<!-- only in a popout window that has a document -->
<grd-toolbar
  *grdWindowBar="let win"
  [items]="toolbarItems"
  ariaLabel="Window"
  [showForTags]="['grd:popout&doc*']"
  (action)="onToolbar($event, win)"
/>
```

```html
<!-- every window, with a text of its own -->
<grd-status-bar *grdWindowBar="let win" [items]="statusOf(win)()" [showForTags]="['*']" />
```

A window has tags: `grd:main` or `grd:popout` (the kind of the window) and the tags of all its tabs. A mask is matched against them: `*` is every window, and `grd:popout&doc*` is a popout window that also has a tab whose tag starts with `doc` (`&` means "and"). A bar without `showForTags` stays in the main window only, as it always was. `let win` is the window of the copy: the toolbar tells its handler which window was pressed.

### Step 4: commands on the API

The **Window** menu opens the active document in a new window, and the block `grd:windows` of the engine lists the windows, with **Return all windows** at its end:

```ts
{
  id: 'window',
  label: '&Window',
  items: [
    {
      label: '&Open the document in a new window',
      enabled: this.activeDocument() !== null,
      run: () => this.popout(),
    },
    { separator: true },
    // The block of the engine: the main window, the popout windows, and Return all windows.
    { source: 'grd:windows' },
  ],
},
```

A browser opens a window only in a gesture of the user: a click, a key. So `popout` is called in the handler of the command, not later:

```ts
/** In the handler of the click: a browser opens a window only in a gesture of the user. */
private popout(): void {
  const active = this.activeDocument();
  if (active) this.engine()?.api.popout(active.tabId);
}
```

`activeDocument` is the active document of the application, in whichever window it is (`GrdEngineEvents.activeDocumentTab()`). The toolbar of a popout window closes its own window, or all of them:

```ts
/** The buttons of the toolbar: it is shown only in a popout window with a document. */
protected readonly toolbarItems: GrdToolbarItem[] = [
  { type: 'button', action: 'back', label: 'Back to the main window' },
  { type: 'button', action: 'all', label: 'Return all windows' },
];
```

```ts
/** A press in the toolbar of a popout window: `win` is the window of the copy of the toolbar. */
protected onToolbar(event: GrdRibbonActionEvent, win: GrdWindowRef): void {
  const api = this.engine()?.api;
  if (event.item.action === 'back') api?.closeWindow(win.id);
  if (event.item.action === 'all') api?.returnAll();
}
```

A window that closes sends its tabs home, to the places they had in the main window.

### Step 5: the events of the windows

The engine tells four events about the windows. `App` listens to them on the engine and writes them into a log:

```html
<grd-docking-engine
  popouts
  viewSources
  layoutStorageKey="tutorial-140-layout"
  [defaultLayout]="layout"
  (tabMovedToWindow)="moved($event)"
  (popoutOpened)="opened($event)"
  (popoutClosed)="closed($event)"
  (popoutRefused)="refused($event)"
/>
```

```ts
protected moved(event: GrdEventMap['tabMovedToWindow']): void {
  this.log.add('tabMovedToWindow', `${event.title}: ${event.from} → ${event.to}`);
  this.changes.update((n) => n + 1);
}

protected opened(event: GrdEventMap['popoutOpened']): void {
  this.log.add('popoutOpened', `${event.popoutId} (${event.way}), tabs: ${event.tabIds.length}`);
  this.changes.update((n) => n + 1);
}
```

`WindowLog` is a service of the application (`src/app/window-log.ts`), and the tool `WindowLogTool` shows its lines. A tool in a popout window reads the same service: the windows are one application.

### Step 6: a status bar in every window

Each window has its own status bar: which window it is, the ids of all the windows (`api.windows()`), and where the active document is (`api.windowOf(id)`). The API is not a signal, so `changes` goes up with every event of step 5 and the texts are asked again:

```ts
status = computed(() => {
  this.changes();
  const engine = this.engine();
  const api = engine?.ready() ? engine.api : undefined;
  const active = this.activeDocument();
  const where = active && api ? this.nameOf(api.windowOf(active.tabId)) : '';
```

The status bar stands in the template after the engine, but its first text is drawn before the engine has started: its API is there only after the first render. The signal `ready` of the engine says when it is there, and the status bar follows it.

### Step 7: a component that listens to the keys itself

The controls of the library work in every window by themselves. A component of the application that listens on `window` or `document` itself would still listen to the main page while its tab is in another window. `KeyCounter` counts the keys both ways, so you can see the difference:

```ts
constructor() {
  // Right: the document of the window the tab is in now, and again after every move.
  effect((onCleanup) => {
    const doc = this.tab.window().document;
    const count = () => this.inTab.update((n) => n + 1);
    doc.addEventListener('keydown', count);
    onCleanup(() => doc.removeEventListener('keydown', count));
  });
  // Wrong for a tab that can move: the global document is the one of the main page, always.
  const countOnPage = () => this.onPage.update((n) => n + 1);
  document.addEventListener('keydown', countOnPage);
  inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', countOnPage));
}
```

`this.tab` is `inject(GrdTabContext)`, and `window()` is a signal of the window the tab is in now. When the tab moves, the effect runs again and listens in the new window.

### Step 8: run it

```
npm run tutorial 140
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** The main window has a menu bar and a status bar, but no toolbar. The status bar says _Main window_, _Windows: main_ and _Counter is in the main window_. The log is empty.
2. **A window for the counter.** Click the counter three times, then **Window › Open the document in a new window**. A new window opens with the tab _Counter_: it still says _Clicked 3 times_, because the same component moved, it was not made again. The window has the menu bar, the toolbar (it has a document) and a status bar with _Window 2_ and _Windows: main, popout-1_. The log says `tabMovedToWindow Counter: main → popout-1` and `popoutOpened popout-1 (api), tabs: 1`.
3. **Move to window.** In the main window, open the menu of the tab _Keys_ (right click, or the three dots) and choose **Move to window › 2 Window 2 – Counter**. _Keys_ is in Window 2 now, and the log says so.
4. **The keys.** In Window 2, click the tab _Keys_. It says _the popout window popout-1_. Click into it and press three keys: _Keys heard in the window of the tab_ is 3, _Keys heard on the global document_ stays 0. Click into the log of the main window and press two keys: now the global document has heard 2, and the window of the tab still 3.
5. **A window with a tool only.** Open the menu of the tab _Window log_ and choose **Open in a new window**. Window 3 has the menu bar and the status bar, but no toolbar: it has no document (`grd:popout&doc*`). The log goes on in it.
6. **Back to the main window.** In the toolbar of Window 2, press **Back to the main window**. The window closes, _Counter_ and _Keys_ come home, and the log says `popoutClosed popout-1 (api)` after the two moves. The counter still says _Clicked 3 times_.
7. **Return all windows.** **Window › Return all windows** closes Window 3; the log comes home.
8. **A blocked window.** Block pop-up windows for localhost in the browser and choose **Window › Open the document in a new window** again: nothing opens, the tab stays, and the log says `popoutRefused the browser blocked the window (api)`. Allow pop-up windows again.
9. **Press F5 with a window open.** Open the counter in a new window and press F5 in the main window. The window closes with the page, the counter is back in the main window, and a bar above the engine says _A window was open before the page was reloaded._ Press **Open it again**: the window opens with its tab, and the log says `popoutOpened … (reopen)`. The counter says _Clicked 0 times_: after a reload every component is made again (tutorial 120 is about a component that keeps its state).
10. **Close the window yourself.** Close the window with its close button: its tab comes home, and the log says `popoutClosed … (user)`.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, Signal, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineEvents,
  GrdEngineSettings,
  GrdEventMap,
  GrdMenu,
  GrdMenuBar,
  GrdRibbonActionEvent,
  GrdStatusBar,
  GrdStatusItem,
  GrdToolbar,
  GrdToolbarItem,
  GrdWindowBar,
  GrdWindowRef,
} from '@gridify/studio';
import { Counter } from './counter';
import { KeyCounter } from './key-counter';
import { WindowLog, WindowLogTool } from './window-log';

/** Two documents on the left, the log of the windows on the right. The tags of the documents start with `doc`. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 65,
      activeTab: 0,
      collapsed: false,
      tabs: [
        { tag: 'doc-counter', role: 'document', title: 'Counter', componentKey: 'counter' },
        { tag: 'doc-keys', role: 'document', title: 'Keys', componentKey: 'keys' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Window log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdWindowBar, GrdMenuBar, GrdToolbar, GrdStatusBar, GrdDockingEngine],
  template: `
    <!-- every window: the main one and each popout window -->
    <grd-menu-bar *grdWindowBar [menus]="menus()" [showForTags]="['*']" />
    <!-- only in a popout window that has a document -->
    <grd-toolbar
      *grdWindowBar="let win"
      [items]="toolbarItems"
      ariaLabel="Window"
      [showForTags]="['grd:popout&doc*']"
      (action)="onToolbar($event, win)"
    />
    <grd-docking-engine
      popouts
      viewSources
      layoutStorageKey="tutorial-140-layout"
      [defaultLayout]="layout"
      (tabMovedToWindow)="moved($event)"
      (popoutOpened)="opened($event)"
      (popoutClosed)="closed($event)"
      (popoutRefused)="refused($event)"
    />
    <!-- every window, with a text of its own -->
    <grd-status-bar *grdWindowBar="let win" [items]="statusOf(win)()" [showForTags]="['*']" />
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
  private readonly engine = viewChild(GrdDockingEngine);
  private readonly log = inject(WindowLog);
  /** The active document of the application, in whichever window it is. */
  private readonly activeDocument = inject(GrdEngineEvents).activeDocumentTab();
  /** Goes up with every event of the windows: what the status bar asks the API is asked again. */
  private readonly changes = signal(0);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change: the popout windows are saved with it.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('keys', KeyCounter);
    registry.registerComponent('log', WindowLogTool);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Add a &counter', run: () => this.add('counter', 'Counter') },
        { label: 'Add a &key counter', run: () => this.add('keys', 'Keys') },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine()?.resetLayout() },
      ],
    },
    {
      id: 'window',
      label: '&Window',
      items: [
        {
          label: '&Open the document in a new window',
          enabled: this.activeDocument() !== null,
          run: () => this.popout(),
        },
        { separator: true },
        // The block of the engine: the main window, the popout windows, and Return all windows.
        { source: 'grd:windows' },
      ],
    },
  ]);

  /** The buttons of the toolbar: it is shown only in a popout window with a document. */
  protected readonly toolbarItems: GrdToolbarItem[] = [
    { type: 'button', action: 'back', label: 'Back to the main window' },
    { type: 'button', action: 'all', label: 'Return all windows' },
  ];

  /** A new document: its tag starts with `doc`, like the tags of the layout. */
  private add(componentKey: string, title: string): void {
    this.engine()?.openComponentTab({
      tag: `doc-${componentKey}`,
      role: 'document',
      title,
      componentKey,
    });
  }

  /** In the handler of the click: a browser opens a window only in a gesture of the user. */
  private popout(): void {
    const active = this.activeDocument();
    if (active) this.engine()?.api.popout(active.tabId);
  }

  /** A press in the toolbar of a popout window: `win` is the window of the copy of the toolbar. */
  protected onToolbar(event: GrdRibbonActionEvent, win: GrdWindowRef): void {
    const api = this.engine()?.api;
    if (event.item.action === 'back') api?.closeWindow(win.id);
    if (event.item.action === 'all') api?.returnAll();
  }

  protected moved(event: GrdEventMap['tabMovedToWindow']): void {
    this.log.add('tabMovedToWindow', `${event.title}: ${event.from} → ${event.to}`);
    this.changes.update((n) => n + 1);
  }

  protected opened(event: GrdEventMap['popoutOpened']): void {
    this.log.add('popoutOpened', `${event.popoutId} (${event.way}), tabs: ${event.tabIds.length}`);
    this.changes.update((n) => n + 1);
  }

  protected closed(event: GrdEventMap['popoutClosed']): void {
    this.log.add('popoutClosed', `${event.popoutId} (${event.reason})`);
    // The id of a closed window never comes back: its status would only keep the window in memory.
    this.statuses.delete(event.popoutId);
    this.changes.update((n) => n + 1);
  }

  protected refused(event: GrdEventMap['popoutRefused']): void {
    this.log.add('popoutRefused', `the browser blocked the window (${event.way})`);
  }

  /** The name of a window for people, as the Window menu numbers them. */
  private nameOf(windowId: string | null): string {
    const windows = this.engine()?.api.windows() ?? ['main'];
    if (windowId === 'main') return 'the main window';
    return `Window ${windows.indexOf(windowId ?? '') + 1}`;
  }

  /** The items of the status bar of every window: one signal for each window. */
  private readonly statuses = new Map<string, Signal<GrdStatusItem[]>>();

  protected statusOf(win: GrdWindowRef): Signal<GrdStatusItem[]> {
    let status = this.statuses.get(win.id);
    if (!status) {
      status = computed(() => {
        this.changes();
        const engine = this.engine();
        const api = engine?.ready() ? engine.api : undefined;
        const active = this.activeDocument();
        const where = active && api ? this.nameOf(api.windowOf(active.tabId)) : '';
        return [
          { id: 'window', text: win.kind === 'main' ? 'Main window' : this.nameOf(win.id) },
          { id: 'windows', text: `Windows: ${(api?.windows() ?? ['main']).join(', ')}` },
          {
            id: 'document',
            text: active ? `${active.title} is in ${where}` : 'No document',
            align: 'end',
          },
        ];
      });
      this.statuses.set(win.id, status);
    }
    return status;
  }
}
```

`src/app/key-counter.ts`:

```ts
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { GrdTabContext } from '@gridify/studio';

/**
 * A component that listens to the keys itself. It counts them twice: in the window its tab is in now
 * (`GrdTabContext.window`), and on the global `document`, which is always the one of the main page.
 */
@Component({
  selector: 'app-key-counter',
  template: `
    <p>
      Where this tab is: <b>{{ where() }}</b>
    </p>
    <p>Click into the tab and press a few keys.</p>
    <p>
      Keys heard in the window of the tab: <b class="in-tab">{{ inTab() }}</b>
    </p>
    <p>
      Keys heard on the global <code>document</code>: <b class="on-page">{{ onPage() }}</b>
    </p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class KeyCounter {
  private readonly tab = inject(GrdTabContext);
  protected readonly inTab = signal(0);
  protected readonly onPage = signal(0);

  /** The window the tab is in: the main window, or the id of a popout window. */
  protected readonly where = computed(() => {
    const win = this.tab.window();
    return win.kind === 'main' ? 'the main window' : `the popout window ${win.id}`;
  });

  constructor() {
    // Right: the document of the window the tab is in now, and again after every move.
    effect((onCleanup) => {
      const doc = this.tab.window().document;
      const count = () => this.inTab.update((n) => n + 1);
      doc.addEventListener('keydown', count);
      onCleanup(() => doc.removeEventListener('keydown', count));
    });
    // Wrong for a tab that can move: the global document is the one of the main page, always.
    const countOnPage = () => this.onPage.update((n) => n + 1);
    document.addEventListener('keydown', countOnPage);
    inject(DestroyRef).onDestroy(() => document.removeEventListener('keydown', countOnPage));
  }
}
```

`src/app/window-log.ts`:

```ts
import { Component, inject, Injectable, signal } from '@angular/core';

/** The lines of the log: the events of the windows, the newest first. */
@Injectable({ providedIn: 'root' })
export class WindowLog {
  readonly lines = signal<readonly string[]>([]);

  add(event: string, text: string): void {
    const time = new Date().toLocaleTimeString();
    this.lines.update((lines) => [`${time}  ${event}  ${text}`, ...lines].slice(0, 50));
  }
}

/** A tool that shows the log. It reads a service of the application, so it works in any window. */
@Component({
  selector: 'app-window-log',
  template: `
    @for (line of log.lines(); track $index) {
      <div class="line">{{ line }}</div>
    } @empty {
      <p>Move a tab to a window of its own: what happens is written here.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font-family: var(--grd-font-mono);
      font-size: 12px;
    }
    .line {
      white-space: nowrap;
    }
    p {
      font-family: var(--grd-font-main);
      font-size: inherit;
      margin: 0;
    }
  `,
})
export class WindowLogTool {
  protected readonly log = inject(WindowLog);
}
```

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdPopouts } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // What the popout windows need from the start of the application. Without it no tab can leave the page.
    provideGrdPopouts(),
  ],
};
```

`src/main.ts`:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { grdPopoutReloadGuard } from '@gridify/studio';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// A popout window that the browser loads again must not start a second application in it.
if (!grdPopoutReloadGuard()) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

### One application, many windows

A popout window has no Angular of its own. The main window opens an empty page and draws into it: the component of a tab is not made again, only its DOM moves to the other document, so it keeps its state. The same signals draw both windows, so the theme, the language and a check mark of a menu are the same everywhere, and the services of the application (the log here) are one.

### Free docking in a popout window

The engine of a popout window is always in the `free` docking mode, whatever the mode of the main engine: any tab may go next to any other, and there is no empty document area. A window with a single tool would otherwise show an empty document area beside it. A tab that comes back to the main window goes by its role there (documents to the documents, tools to the tools).

### The tags of a window and the masks

The tags of a window are its kind (`grd:main` or `grd:popout`) and the tags of all its tabs (also the ones that are not shown). A mask is a tag, a pattern with `*` and `?`, or a regular expression between slashes; `&` inside a mask means "and", and the masks of a list mean "or": `['grd:popout&doc*', 'grd:main']` is a popout window with a document, or the main window. The items of a menu, a toolbar and a status bar take masks too. The prefix `grd:` is the library's: a tab whose tag starts with it gets a warning in the console.

### A gesture of the user

A browser opens a window only in the few seconds after a click or a key of the user. A command of a menu, a button or the menu of a tab are such gestures; a timer, an answer of a server or an effect are not. When the browser blocks the window, `popout` returns `null`, the engine tells `popoutRefused`, and the tab stays where it was.

### The events

`tabMovedToWindow` comes for every tab that moves (from, to); `popoutOpened` after the moves of its tabs (`way`: `menu`, `drag`, `api` or `reopen`); `popoutClosed` after its tabs went home (`reason`: `user`, `api`, `empty`, `main` or `lost`). A window whose last tab leaves closes by itself (`empty`).

### Ids and names of windows

The API uses ids: `main`, `popout-1`, `popout-2`… The menus number the windows for people: _Main window_, _Window 2_, _Window 3_.

### Saving and F5

The layout of the main engine is saved with its popout windows (their layouts and their places on the screen). After a reload a browser opens no window by itself, so the tabs of those windows are in the main window, in their places, and the bar above the engine opens them again, one window for each press.

### Browsers and limits

Desktop Chromium (Chrome, Edge) and Firefox. Safari is not guaranteed, and a mobile browser is not a target. An `iframe` in a tab loads again after every move. Code that keeps listeners on the global `window` or `document` does not hear the popout windows (step 7). Without the permission to manage windows, Chrome opens a new window on the screen of the window it is opened from.

## What you get without writing any of it

- **The menu of every tab**: Open in a new window, Move to window (the open windows and a new one), and Return to the main window in a popout window.
- **Dragging** a tab from one window to another, with the docking anchors of that window, and out of all the windows into a new one.
- **The block `grd:windows`** for a menu: the windows, numbered, the one you work in checked, and Return all windows.
- **The bars of the application in every window**, filtered by their masks, and their shortcuts only in their own window.
- **Live tabs**: the component moves with its state, its inputs, its dirty mark and its tag.
- **Tabs that come home** to the places they had, when a window closes for any reason.
- **The styles, the theme and the density** of the page in every window, and the title of the active tab as the title of the window.
- **Saving the windows** with the layout, and the bar that opens them again after a reload.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 140 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new popout-windows --style=scss --ssr=false --skip-tests
   cd popout-windows
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library, and the popout windows bring some code of their own).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` of 015, `src/app/key-counter.ts` and `src/app/window-log.ts`, and replace `src/app/app.ts`, `src/app/app.config.ts` and `src/main.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
