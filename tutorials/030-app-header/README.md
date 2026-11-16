# 030 – The app header

This tutorial shows how to put an application header above the application: its name on the left, a button of your own and the select of the themes on the right. You will learn how to:

- add `grd-app-header` with the name of the application (`productName`);
- choose which selects the header shows (`preferences="theme"`);
- put controls of your own into the slots of the header (`grdAppHeaderEnd` and the others);
- show a message box from the code (`GrdMessageBox`);
- find where the chosen theme is remembered, so that it comes back after a reload.

It is 010 with a few lines more, so start from 010.

```
npm run tutorial 030
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30030, pick a theme in the select at the top right, press **Press me**, and reload the page.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- the name on the left; the button and the select of the themes on the right -->
    <grd-app-header productName="App Header" preferences="theme">
      <!-- grdAppHeaderEnd: the place at the right, before the select -->
      <grd-button grdAppHeaderEnd label="Press me" (pressed)="pressed()" />
    </grd-app-header>
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
  private readonly messageBox = inject(GrdMessageBox);
  private opened = 0;

  protected pressed(): void {
    this.messageBox.info('Button pressed');
  }

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

`src/app/counter.ts` and `src/styles.scss` are the ones of 010.

### What changed against 010

- **`<grd-app-header>`** is the first row of the column. It takes the height it needs (a control and a small margin), the menu bar stays under it and the engine takes the rest. The styles of `App` did not change.
- **`productName="App Header"`** is the name on the left, bold and in the accent color of the theme. It also names the header for a screen reader: the header is the `banner` landmark of the page. `subtitle="…"` would add a quieter text after the name.
- **`preferences="theme"`** says which selects stand on the right: only the theme. Without the attribute the header shows the theme and the density; `preferences` alone (with no value) shows the theme, the density and the language. The selects need no code of yours: a pick changes the theme of the whole page at once.
- **`grdAppHeaderEnd`** on the button puts it into a slot of the header: the place at the right, before the select. The other slots are `grdAppHeaderLogo` (before the name), `grdAppHeaderStart` (after the name), `grdAppHeaderCenter` (the free room in the middle) and `grdAppHeaderUser` (the last place, after the select). An element inside `<grd-app-header>` without one of these attributes is not shown at all.
- **`<grd-button label="Press me" (pressed)="pressed()" />`** is the button of the library, the same one as in the counter. `pressed` comes on a click, and on Enter or Space when the button has the focus.
- **`inject(GrdMessageBox)`** gives the service of the message boxes. `info('Button pressed')` shows a box titled _Information_ with an icon, the text and an **OK** button. The template needs nothing for it: the service creates the box and removes it when it closes. The service also has `warning`, `error`, `question` and `confirm`, and every box can be waited for: `await this.messageBox.info('Saved.').closed`.

## The theme is remembered

Try these in the running application:

- **Before you pick a theme the page follows the system.** With a light system it starts in _IDE Light_, with a dark one in _IDE Dark_, and it switches when the system changes its look while the page is open.
- **A pick is saved.** The select saves the theme in `localStorage` under the key `grd-theme-choice`, as its id (`cappuccino`, `golden-hour`, `ide-light`…). After a reload, and in a new tab of the same address, the page starts in that theme, and it no longer follows the system. Picking the theme that is already shown saves nothing: the page still follows the system.
- **See it.** In the developer tools of the browser, _Application › Local storage › http://localhost:30030_ has the key `grd-theme-choice`. Delete the key and reload, and the page follows the system again.
- **The key belongs to the address.** Every tutorial runs on an address of its own, so the theme picked here stays here: tutorial 010 on http://localhost:30010 does not see it. Applications on one address do share the key, and so one of them could start in the theme picked in another. An application gets a key of its own in `app.config.ts`, with `provideGrdTheme({ storageKey: 'app-header.theme' })` among the providers.
- **The layout is not saved**, as in 010: after a reload the tabs are gone and the theme stays.

## What you get without writing any of it

- **The whole page changes with the theme**: the header, the menu bar, the tabs and the panels of the engine, and the message box. The select lists every theme of the library under the name of its group (IDE, Desktop, Binder…).
- **The message box is modal.** While it is open the page under it cannot be clicked. It closes with **OK**, with Esc and with the × in its title, and the focus goes back to **Press me**, so Enter opens it again.
- **The File menu works as before**, also with Alt+F.

## Build it from 010

The quick way: `npm run tutorial:eject 030 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make it by hand from 010.

1. Start from your application of 010 (or one made by `npm run tutorial:eject 010 path/to/new-folder` in the root of the repository).

2. Put the header at the top of the template of `App`, before the menu bar:

   ```html
   <grd-app-header productName="App Header" preferences="theme">
     <grd-button grdAppHeaderEnd label="Press me" (pressed)="pressed()" />
   </grd-app-header>
   ```

3. Import `GrdAppHeader`, `GrdButton` and `GrdMessageBox` from `@gridify/studio` and `inject` from `@angular/core`. Add `GrdAppHeader` and `GrdButton` to the `imports` of the component:

   ```ts
   imports: [GrdAppHeader, GrdButton, GrdMenuBar, GrdDockingEngine],
   ```

4. Add the service and the method that the button calls to `App`:

   ```ts
   private readonly messageBox = inject(GrdMessageBox);

   protected pressed(): void {
     this.messageBox.info('Button pressed');
   }
   ```

5. Run it:

   ```
   ng serve
   ```
