# 125 – Theme, density and language after a reload

This tutorial shows how the settings of the whole application, the theme, the density and the language, are kept across a reload, and how to decide where and whether they are kept. You will learn how to:

- switch them with the selects of the application header (`preferences="theme density language"`);
- see where each choice is kept in `localStorage`, and give each a key of your own (`provideGrdTheme`, `provideGrdDensity`, `provideGrdLanguage`);
- stop remembering one of them (`setStorageKey(null)`);
- forget a chosen theme, so that the page follows the system again (`followSystem()`).

They are settings of the application, not of the layout, so they are kept apart from it. The tutorial closes the series about saving (110–125).

```
npm run tutorial 125
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30125, choose a theme, a density and a language in the header, and press F5.

Every tutorial runs on an address of its own (this one on http://localhost:30125), so it has a `localStorage` of its own. It still keeps its theme under `tutorial-125-theme`, its density under `tutorial-125-density`, its language under `tutorial-125-language` and its layout under `tutorial-125-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with the header above the menu bar.

### Step 1: the header with three selects

Add `GrdAppHeader` to the imports of `App` and put the header at the top of the template:

```html
<!-- the selects of the header switch the theme, the density and the language by themselves -->
<grd-app-header productName="App settings" preferences="theme density language" />
```

`preferences` says which selects the header draws: the theme and the density by default, here the language as well. The selects need no code: each one calls its service (`GrdTheme.setTheme`, `GrdUiSettings.setDensity`, `GrdI18n.setLanguage`), and the service applies the choice and remembers it. That alone makes the three survive F5.

### Step 2: keys of your own

Without anything more, the theme is kept under `grd-theme-choice`, the density under `grd-density-choice` and the language under `grd-language`, the same keys for every application on the same address. `src/app/app.config.ts` gives them keys of this application:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdDensity, provideGrdLanguage, provideGrdTheme } from '@gridify/studio';

/** The key of the density; the Settings menu turns remembering it off and on. */
export const DENSITY_KEY = 'tutorial-125-density';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The theme, the density and the language that the user chooses are kept in localStorage under these keys.
    provideGrdTheme({ storageKey: 'tutorial-125-theme' }),
    provideGrdDensity({ storageKey: DENSITY_KEY }),
    provideGrdLanguage({ storageKey: 'tutorial-125-language' }),
  ],
};
```

`DENSITY_KEY` is a constant because the **Settings** menu of step 5 needs the key of the density too.

### Step 3: a line that says what is in use

The three services are signals, so a `computed` follows every switch. `storageKey()` of a service is the key it remembers under now, `null` when it remembers nothing. In `src/app/app.ts`:

```ts
  private readonly theme = inject(GrdTheme);
  private readonly ui = inject(GrdUiSettings);
  private readonly i18n = inject(GrdI18n);

  /** What is in use now: the services are signals, so the line follows every switch. */
  protected readonly now = computed(() => {
    const system = this.theme.followsSystem() ? ' (follows the system)' : '';
    const kept = this.ui.storageKey() === null ? ' (not remembered)' : '';
    return `Theme ${this.theme.theme()}${system}, density ${this.ui.density()}${kept}, language ${this.i18n.language()}`;
  });
```

```html
<p class="now">{{ now() }}</p>
```

The line goes between the menu bar and the engine, with the same style as the line of 122.

### Step 4: follow the system again

Until the user chooses a theme, the page follows the system: IDE Light for a light system, IDE Dark for a dark one. A choice is saved and stays. `followSystem()` forgets it. A **Settings** menu offers that, greyed while there is nothing to forget, and `menus` becomes a `computed` (the template reads `[menus]="menus()"`):

```ts
    {
      id: 'settings',
      label: '&Settings',
      items: [
        {
          // Forgets the chosen theme: the light or the dark theme follows the system again.
          label: '&Follow the system theme',
          enabled: !this.theme.followsSystem(),
          run: () => this.theme.followSystem(),
        },
      ],
    },
```

### Step 5: remember the density, or not

A key of `null` remembers nothing: the service reads no choice and writes none. `provideGrdDensity({ storageKey: null })` would do that from the start; `setStorageKey` does it while the page runs. A switch in the **Settings** menu, after **Follow the system theme**:

```ts
        { separator: true },
        {
          // Off: no key (null), so a density chosen now lasts until F5. On: the key again, and what it keeps.
          label: '&Remember the density',
          checked: this.ui.storageKey() !== null,
          run: () => this.ui.setStorageKey(this.ui.storageKey() === null ? DENSITY_KEY : null),
        },
```

Import `DENSITY_KEY` from `./app.config`. `setStorageKey(null)` keeps the density that is on the screen and stops writing. `setStorageKey(DENSITY_KEY)` takes the key again and applies what it keeps, the density of the start (`classic`) when it keeps nothing, the way a first visit starts.

### Step 6: run it

```
npm run tutorial 125
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** The line says _Theme ide-light (follows the system), density classic, language en_ (or _Theme ide-dark_ when the system is dark). **Settings › Follow the system theme** is greyed. Nothing is stored yet.
2. **Choose.** In the header, choose the theme _Cappuccino_, the density _Compact_ and the language _Deutsch_. The colors change, the controls and the tabs get smaller, and the texts of the library are German: the caption of the empty area (_Keine offenen Dokumente_) and the names in the selects (_Kompakt_). The texts of the application (**File**, **Settings**, the line) stay English: they are the application's own, and it has no German dictionary. The line says _Theme cappuccino, density compact, language de_.
3. **Press F5.** The theme, the density and the language are back, and the selects show them.
4. **Forget the theme.** Choose **Settings › Follow the system theme**: the page follows the system again, and the line says _(follows the system)_. Switch the system between light and dark: the page follows at once. **Press F5**: it still follows the system. The density and the language stay as chosen.
5. **Back to English.** Choose _English_ in the language select.
6. **Not remembered.** Uncheck **Settings › Remember the density**. The line says _density compact (not remembered)_. Choose _Spacious_: the controls grow, but nothing is written. **Press F5**: the density is _Compact_ again, the last one that was remembered, and the switch is checked again, because `app.config.ts` gives the key at every start.
7. **Back on.** Uncheck the switch, choose _Dense_, and check it again: the density is _Compact_ at once, the one the key keeps. A choice made while the switch was off lasts only until the key comes back.
8. **See it.** In the developer tools, _Application › Local storage › http://localhost:30125_ has `tutorial-125-theme` (while a theme is chosen), `tutorial-125-density` and `tutorial-125-language`. `grd-theme-choice`, `grd-density-choice` and `grd-language` are not used by this tutorial, so another application on the same address that uses them does not change this one.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdMenu,
  GrdMenuBar,
  GrdTheme,
  GrdUiSettings,
} from '@gridify/studio';
import { DENSITY_KEY } from './app.config';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- the selects of the header switch the theme, the density and the language by themselves -->
    <grd-app-header productName="App settings" preferences="theme density language" />
    <grd-menu-bar [menus]="menus()" />
    <p class="now">{{ now() }}</p>
    <grd-docking-engine layoutStorageKey="tutorial-125-layout" />
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
    .now {
      margin: 0;
      padding: 4px 12px;
      border-bottom: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
      color: var(--grd-text-main);
      font-size: var(--grd-font-size-base);
    }
  `,
})
export class App {
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly theme = inject(GrdTheme);
  private readonly ui = inject(GrdUiSettings);
  private readonly i18n = inject(GrdI18n);

  /** What is in use now: the services are signals, so the line follows every switch. */
  protected readonly now = computed(() => {
    const system = this.theme.followsSystem() ? ' (follows the system)' : '';
    const kept = this.ui.storageKey() === null ? ' (not remembered)' : '';
    return `Theme ${this.theme.theme()}${system}, density ${this.ui.density()}${kept}, language ${this.i18n.language()}`;
  });

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
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
    {
      id: 'settings',
      label: '&Settings',
      items: [
        {
          // Forgets the chosen theme: the light or the dark theme follows the system again.
          label: '&Follow the system theme',
          enabled: !this.theme.followsSystem(),
          run: () => this.theme.followSystem(),
        },
        { separator: true },
        {
          // Off: no key (null), so a density chosen now lasts until F5. On: the key again, and what it keeps.
          label: '&Remember the density',
          checked: this.ui.storageKey() !== null,
          run: () => this.ui.setStorageKey(this.ui.storageKey() === null ? DENSITY_KEY : null),
        },
      ],
    },
  ]);
}
```

`src/app/app.config.ts` is in step 2. `src/app/counter.ts`, `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### Three services, three keys

| Setting  | Service         | Switched by                      | Kept under (default)                             | A key of your own                                                       |
| -------- | --------------- | -------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| theme    | `GrdTheme`      | `setTheme(id)`, `followSystem()` | `grd-theme-choice` (`GRD_THEME_STORAGE_KEY`)     | `provideGrdTheme({ storageKey })`, or the token `GRD_THEME_STORAGE`     |
| density  | `GrdUiSettings` | `setDensity(id)`                 | `grd-density-choice` (`GRD_DENSITY_STORAGE_KEY`) | `provideGrdDensity({ storageKey })`, or the token `GRD_DENSITY_STORAGE` |
| language | `GrdI18n`       | `setLanguage(code)`              | `grd-language` (`GRD_LANGUAGE_STORAGE_KEY`)      | `provideGrdLanguage({ storageKey })`                                    |

Each service writes the choice when it is made and reads it when it is created. A browser that blocks the storage (a private window with blocked site data) raises no error: the choice is simply not remembered. `storageKey()` of each service tells the key in use, and `setStorageKey(key)` changes it while the page runs.

### When they come back

- **The theme**: `GrdTheme` puts the class `grd-theme-<id>` on `<body>`, and the colors of the whole page come from it. Without a saved choice it takes the light or the dark theme of `provideGrdTheme({ defaults: { light, dark } })` (IDE Light and IDE Dark when not given) by `prefers-color-scheme`, and keeps following the system until the user chooses.
- **The density**: `GrdUiSettings` sets the attribute `data-grd-density` on `<html>`.
- **The language**: `GrdI18n` applies the remembered language as soon as a dictionary for it is registered. The library registers its own texts in English, German and Japanese, so those come back at once. A language that only the application has comes back when the application registers it. It also sets `<html lang>`, and `data-grd-script` for languages with tall scripts (Japanese gets a larger line height).

The theme and the density are applied when their service is created. Here the header and `App` inject them at the start. An application without the header injects them once itself (in the constructor of `App`, say), so that the saved choice is applied before the user touches anything.

### Another key

`storageKey` keeps two applications on one address apart: without it, a theme chosen in one is the theme of the other. The keys are given at the start. The language is a little different from the other two: its translator is one for the page and exists before the application, so `provideGrdLanguage` sets the key when the application starts: what the shared key `grd-language` gave is forgotten, and the language saved under the new key is selected (with `null`, the default language). List it before an initializer of your own that chooses a language.

A key can also change while the page runs: `setStorageKey(key)` of `GrdTheme`, `GrdUiSettings` and `GrdI18n`. The service then takes what the new key keeps, or the value of a first visit when it keeps nothing (the theme follows the system, the density is `classic`, the language English). That is how the settings follow a signed-in user, the way the layout does in 122: `effect(() => theme.setStorageKey(auth.userKey('my-app-theme')))`.

### Not remembering

- **`storageKey: null`** in `provideGrdTheme`, `provideGrdDensity` or `provideGrdLanguage` remembers nothing from the start: no choice is read, none is written, and every visit starts with the defaults. An empty text is the same; it never means the default key.
- **`setStorageKey(null)`** stops remembering while the page runs and keeps what is on the screen (the switch of step 5).
- **`followSystem()`** forgets the chosen theme: the page follows the system again.

### Texts of the application

Only the texts of the library change with the language. An application translates its own texts with `i18n.register('de', { … })` and reads them with `t()` or `tk()`. The language select then offers the languages that have a dictionary (`i18n.languages()`).

## What you get without writing any of it

- **Three selects** that switch by themselves and show what the services hold, whoever changed it.
- **Saving and loading** of the three choices under keys of your own, with no error where the storage is blocked, and the keys switched at run time.
- **A theme that follows the system** until the user chooses one, also when the system changes while the page is open.
- **The page attributes**: the theme class on `<body>`, `data-grd-density`, `<html lang>` and `data-grd-script`.
- **The texts of the library** in English, German and Japanese.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 125 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new app-settings --style=scss --ssr=false --skip-tests
   cd app-settings
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` and `src/app/counter.ts` as in 015.

5. Replace `src/app/app.config.ts` and `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
