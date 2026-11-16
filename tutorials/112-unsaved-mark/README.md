# 112 – The unsaved mark

This tutorial shows how to tell the user that the layout on the screen differs from the saved one, and how to keep them from losing the difference. You will learn how to:

- set an unsaved-changes mark on every change that would be saved (`layoutChanged` with `persisted`), and clear it on a save (`layoutSaved`);
- show the mark in the status bar, and disable **Save** while there is nothing to save;
- ask before **Reset** throws the changes away (`GrdMessageBox.confirm`);
- let the browser ask before the page is left or reloaded (`beforeunload`), only while something is unsaved.

Tutorial 110 saves on a button, so F5 can lose what changed after the last save. It is the application of 110 with a few lines changed, from the series about saving (110–125).

```
npm run tutorial 112
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30112, add a tab (**File › Add component**) and watch the status bar, click **Save layout**, add another tab and try **File › Reset layout** and F5.

Every tutorial runs on an address of its own (this one on http://localhost:30112), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-112-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 110 (or one made by `npm run tutorial:eject 110 path/to/new-folder` in the root of the repository). Automatic saving stays off: with it, nothing would ever be unsaved.

### Step 1: the mark

One signal says whether the layout has changed since it was saved last:

```ts
/** The layout has changed since it was saved last: F5 would not show it as it is. */
protected readonly unsaved = signal(false);
```

The engine tells every change of the layout with `layoutChanged` and every save with `layoutSaved`. The first sets the mark, the second clears it:

```html
<!-- The mark: every change of what is saved sets it, a save clears it. -->
<grd-docking-engine
  layoutStorageKey="tutorial-112-layout"
  (layoutChanged)="changed($event)"
  (layoutSaved)="unsaved.set(false)"
/>
```

`layoutChanged` says with `persisted` whether the change is a part of what the layout saves. A change of the shell (the frame of an application, tutorial 111: its width, its collapsed panels) is never saved, so it comes with `persisted: false`, and Save could not keep it anyway. Only a change that is saved sets the mark. The type of the event is in `GrdEventMap`, under the name of the event:

```ts
/** A change of what the layout saves sets the mark. A change of the shell (`persisted: false`) is never saved, so it does not. */
protected changed(event: GrdEventMap['layoutChanged']): void {
  if (event.persisted) this.unsaved.set(true);
}
```

Import `GrdEventMap` with the rest (`type GrdEventMap`: only its type is used). This application has no shell, so here every change is `persisted`; the check costs one line and keeps the mark right when the layout gets a shell.

### Step 2: nothing is unsaved at the start

The layout the engine starts with, loaded or the default one, is what F5 shows, so there is nothing to lose. The engine does not tell it as a change: no `layoutChanged` comes for it (`layoutLoaded` or `layoutReset` tells it, tutorial 111), and the mark starts clear. Nothing to write for that.

### Step 3: show it

The status bar of 110 showed the time of the last save; now it shows the mark, in the color of a warning:

```ts
protected readonly status = computed<GrdStatusItem[]>(() => [
  this.unsaved()
    ? { id: 'layout', text: '● Unsaved changes', variant: 'warning', live: true }
    : { id: 'layout', text: 'All changes are saved', live: true },
]);
```

`savedAt` and `saved()` of 110 go. The Save button is disabled while there is nothing to save:

```html
<grd-button
  grdMenuBarEnd
  label="Save layout"
  variant="primary"
  [disabled]="!unsaved()"
  (pressed)="save()"
/>
```

### Step 4: Reset asks first

A reset throws away what is not saved. With the mark set, `reset()` asks with a message box (`GrdMessageBox`, tutorial 070) and goes on only when the answer is yes:

```ts
private readonly messages = inject(GrdMessageBox);
```

```ts
/** Reset throws away the changes that are not saved: it asks first, but only when there are some. */
protected async reset(): Promise<void> {
  if (this.unsaved()) {
    const sure = await this.messages.confirm(
      'The layout has changes that are not saved. Reset it anyway and lose them?',
      { title: 'Reset the layout', danger: true, confirmLabel: 'Reset', cancelLabel: 'Keep' },
    );
    if (!sure) return;
  }
  this.engine().resetLayout();
}
```

**File › Reset layout** calls it: `{ label: '&Reset layout', run: () => this.reset() }`.

### Step 5: leaving asks first

F5, closing the browser tab and going to another address all lose what is not saved. The browser asks before it when the page cancels its `beforeunload` event. The host of `App` listens to it on the window:

```ts
host: { '(window:beforeunload)': 'leaving($event)' },
```

```ts
/** The page is about to go (F5, the tab is closed, another address): with unsaved changes the browser asks first. */
protected leaving(event: BeforeUnloadEvent): void {
  if (this.unsaved()) event.preventDefault();
}
```

## Try it

1. **Start the application.** _All changes are saved_, and **Save layout** is disabled: nothing is saved yet, but F5 would show the same empty area. The start is no change of the layout.
2. **File › Add component.** _● Unsaved changes_, in the warning color, and the button is enabled.
3. **Click Save layout.** The mark is gone.
4. **Click the button of the counter** a few times. No mark: what is inside a component is not a part of the layout (it is not saved, 015).
5. **File › Add HTML, then click the Counter tab.** Both set the mark: which tab is active is a part of the layout and is saved with it. Ctrl+S clears the mark.
6. **File › Add HTML, then F5.** The browser asks whether to leave the page. **Cancel** keeps it with all three tabs; F5 again and **Leave** (or **Reload**) shows the saved layout, and the third tab is gone.
7. **File › Add HTML, then File › Reset layout.** _Reset the layout_ asks; **Keep** changes nothing. **Reset** shows the empty area, and the mark stays set: F5 would show the saved tabs, not the empty area.
8. **Save layout, then File › Reset layout.** No question: nothing unsaved is lost (the saved layout is still there).

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockingEngine,
  type GrdEventMap,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  host: { '(window:beforeunload)': 'leaving($event)' },
  template: `
    <grd-menu-bar [menus]="menus" shortcuts>
      <grd-button
        grdMenuBarEnd
        label="Save layout"
        variant="primary"
        [disabled]="!unsaved()"
        (pressed)="save()"
      />
    </grd-menu-bar>
    <!-- The mark: every change of what is saved sets it, a save clears it. -->
    <grd-docking-engine
      layoutStorageKey="tutorial-112-layout"
      (layoutChanged)="changed($event)"
      (layoutSaved)="unsaved.set(false)"
    />
    <grd-status-bar [items]="status()" />
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
  private readonly messages = inject(GrdMessageBox);
  /** The layout has changed since it was saved last: F5 would not show it as it is. */
  protected readonly unsaved = signal(false);

  protected readonly status = computed<GrdStatusItem[]>(() => [
    this.unsaved()
      ? { id: 'layout', text: '● Unsaved changes', variant: 'warning', live: true }
      : { id: 'layout', text: 'All changes are saved', live: true },
  ]);

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** A change of what the layout saves sets the mark. A change of the shell (`persisted: false`) is never saved, so it does not. */
  protected changed(event: GrdEventMap['layoutChanged']): void {
    if (event.persisted) this.unsaved.set(true);
  }

  protected save(): void {
    this.engine().saveLayout();
  }

  /** Reset throws away the changes that are not saved: it asks first, but only when there are some. */
  protected async reset(): Promise<void> {
    if (this.unsaved()) {
      const sure = await this.messages.confirm(
        'The layout has changes that are not saved. Reset it anyway and lose them?',
        { title: 'Reset the layout', danger: true, confirmLabel: 'Reset', cancelLabel: 'Keep' },
      );
      if (!sure) return;
    }
    this.engine().resetLayout();
  }

  /** The page is about to go (F5, the tab is closed, another address): with unsaved changes the browser asks first. */
  protected leaving(event: BeforeUnloadEvent): void {
    if (this.unsaved()) event.preventDefault();
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
        { label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
        { label: '&Reset layout', run: () => this.reset() },
      ],
    },
  ];
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **`layoutChanged` is told after every change of the layout**, with automatic saving on or off: a tab opened, closed, moved or made active, a panel split, a line between panels moved, a floating window moved, a reset. Right before it the engine tells the change itself (`tabOpened`, `tabClosed`, `panelResized` …); `layoutChanged` is the one event for all of them. It also comes when a component in a tab asks for a save of its own state (tutorial 120).
- **`persisted: false` is a change that is never saved:** the shell, its width, its collapsed panels, its active tabs. It is the layout of the application, which comes from `defaultLayout` on every start, so it cannot make the layout unsaved.
- **The first layout is no change.** The layout the engine starts with and the layout of a new `layoutStorageKey` (tutorial 113) come without `layoutChanged`; `layoutLoaded` or `layoutReset` tells them.
- **The mark says "changed since the last save", not "different from the saved layout".** Open a tab and close it again: the layout is the same as the saved one, and the mark is set. To know whether the two really differ, an application would compare the layout with the saved one; for a mark that asks before something is lost, "changed" is enough and costs nothing.
- **A load is no change.** `loadLayout()` (111) puts the saved layout on the screen and tells `layoutLoaded`, not `layoutChanged`. An application with both a Load and the mark clears the mark on `layoutLoaded` too.
- **`beforeunload` is the browser's question, not the application's.** Its text cannot be changed, and the browser asks only when the user has done something on the page (clicked, typed). An application cannot keep the user on the page; it can only make the browser ask.
- **The question of the reset** is a `GrdMessageBox.confirm`: `true` when the user agrees, `false` for the other button, Esc or the cross. `danger: true` makes the agreeing button red and puts the focus on the other one, so Enter keeps the changes.

## What you get without writing any of it

- **One event for every change.** The application does not need to know the kinds of changes of the layout; `layoutChanged` covers them all, including the ones that the user makes with the mouse (drag, split, resize), and tells which of them are saved (`persisted`).
- **A message box that waits.** `confirm` returns a promise: `reset()` simply awaits the answer. The box is modal, keeps the focus and blocks the page under it.
- **The status in the warning color** (`variant: 'warning'`), in the light and the dark theme, and announced by the screen reader (`live: true`).

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 112 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new unsaved-mark --style=scss --ssr=false --skip-tests
   cd unsaved-mark
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
