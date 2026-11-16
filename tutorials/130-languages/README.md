# 130 – The languages of the library

This tutorial shows how to switch the language of the library (English, German or Japanese) with one call, and what follows the switch. You will learn how to:

- offer the languages to the user: the Language select of the header, and a menu of your own (`languages()`, `languageName()`);
- switch the language (`setLanguage`), and remember the choice under a key of your own (`provideGrdLanguage`);
- see what follows at once, without a line of code for any of it: the menus and buttons of the engine, the empty area, the message boxes, the messages of the fields, the calendar;
- see what the library does with the page when the language changes (`<html lang>`, a taller line for a tall script);
- see what stays English: the texts of the application itself.

The texts of the application are the subject of 131. A series about languages starts here (130–135).

```
npm run tutorial 130
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30130 and choose _Deutsch_ in the select at the right of the header.

Every tutorial runs on an address of its own (this one on http://localhost:30130), so it has a `localStorage` of its own. It still keeps its language under the key `tutorial-130-language` and its layout under `tutorial-130-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with a header above the menu bar, a default layout with components of the library, and a status bar.

### Step 1: a key of its own

`src/app/app.config.ts` gives the language a key in `localStorage`, so the choice comes back after F5 and stays apart from other applications on the same address (125 tells more about the keys):

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-130-language' }),
  ],
};
```

### Step 2: the Language select of the header

```html
<!-- the Language select of the header switches the language by itself -->
<grd-app-header productName="Languages" preferences="language" />
```

`preferences="language"` draws one select: every language that has a dictionary, each in its own name (_English_, _Deutsch_, _日本語_). Choosing one calls `GrdI18n.setLanguage`, and that is all a language switch is. The select needs no code.

### Step 3: components of the library in tabs

Two small components put controls of the library in tabs. `src/app/calendar-page.ts` shows the calendar:

```ts
import { Component, signal } from '@angular/core';
import { GrdCalendar } from '@gridify/studio';

/** The calendar of the library in a tab: the names of the months and the days come from the language. */
@Component({
  selector: 'app-calendar-page',
  imports: [GrdCalendar],
  template: `<grd-calendar [(value)]="day" />`,
  styles: `
    :host {
      display: block;
      padding: 12px 16px;
    }
  `,
})
export class CalendarPage {
  protected readonly day = signal('');
}
```

`src/app/form.ts` shows a field that must be filled and a file upload:

```ts
import { Component, signal } from '@angular/core';
import { GrdFileUpload, GrdInput } from '@gridify/studio';

/** Two controls of the library in a tab. The label Name is a text of the application; everything else is the library's. */
@Component({
  selector: 'app-form',
  imports: [GrdInput, GrdFileUpload],
  template: `
    <grd-input label="Name" required [(value)]="name" />
    <grd-file-upload />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
    }
  `,
})
export class Form {
  protected readonly name = signal('');
}
```

The label _Name_ is a text of this application, so it stays English. Everything else in these two tabs (the names of the months and the days, _Today_, the message of an empty required field, _Choose a file or drag it here_) is the library's.

The default layout puts the calendar and HTML notes among the documents and the form in a tool on the right. The tabs name their components by keys, and the constructor of `App` registers the keys (as in 117):

```ts
/** Two documents (a calendar and HTML notes) and a tool with a form on the right. */
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
        { tag: 'calendar', role: 'document', title: 'Calendar', componentKey: 'calendar' },
        {
          tag: 'notes',
          role: 'document',
          title: 'Notes',
          content: '<p>The texts of this application are English: they are its own.</p>',
        },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'form', role: 'tool', title: 'Form', componentKey: 'form' }],
    },
  ],
};
```

```ts
// The components of the tabs, by the keys that the layout names.
const registry = inject(GrdContentRegistry);
registry.registerComponent('calendar', CalendarPage);
registry.registerComponent('form', Form);
```

### Step 4: a View menu with the languages

The header is one way to choose. A menu is another: one item for every language, with a check mark at the one in use. `GrdI18n` has all it needs: `languages()` (the codes that have a dictionary), `languageName(code)` (the name of the language in itself) and `language()` (the language in use). All three are signals, so a `computed` follows them:

```ts
  /** One item for every language that has a dictionary, in its own name, with a check mark at the one in use. */
  private readonly languageItems = computed(() =>
    this.i18n.languages().map((code) => ({
      label: this.i18n.languageName(code),
      checked: this.i18n.language() === code,
      run: () => void this.i18n.setLanguage(code),
    })),
  );
```

The View menu puts them in a submenu, and two blocks of the library after them: `grd:tools` (the tools of the engine, here _Form_) and `grd:restore-layout` (_Restore layout_). The engine fills the blocks because of `viewSources`:

<!-- prettier-ignore -->
```html
<!-- viewSources: the engine fills the blocks grd:tools and grd:restore-layout of the View menu -->
<grd-docking-engine
  layoutStorageKey="tutorial-130-layout"
  [defaultLayout]="layout"
  viewSources
/>
```

```ts
    {
      id: 'view',
      label: '&View',
      items: [
        { label: '&Language', children: this.languageItems() },
        { separator: true },
        // The tools of the engine and Restore layout: blocks of the library, in the language in use.
        { source: 'grd:tools' },
        { separator: true },
        { source: 'grd:restore-layout' },
      ],
    },
```

`menus` is a `computed` (the template reads `[menus]="menus()"`), so the check mark moves when the language changes, whoever changed it.

### Step 5: a question

**Help › Ask a question** opens a message box of the library. Its message is a text of this application; its title and its three buttons are the library's:

```ts
          run: () =>
            this.box.question('Keep the notes for the next visit?', { buttons: 'yesNoCancel' }),
```

### Step 6: the status bar

The status bar shows what the library writes on `<html>` when the language changes: the attribute `lang`, and `data-grd-script` with the kind of script (`latin`, or `tall` for Japanese):

```ts
  /** What the page says about its language: the attributes that the library sets on <html>. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    { id: 'lang', text: `<html lang="${this.i18n.language()}">` },
    { id: 'script', text: `data-grd-script="${this.i18n.scriptClass()}"` },
  ]);
```

### Step 7: run it

```
npm run tutorial 130
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** Everything is English. The calendar shows the month (_October 2026_, say), and the status bar says `<html lang="en">`.
2. **German.** Choose _Deutsch_ in the header. The calendar says _Oktober 2026_, the week begins on Monday (_Mo_), and _Today_ is _Heute_. The file upload says _Datei wählen oder hierher ziehen_. The tooltip of the × of a tab is _Schließen_. The texts of this application stay English: **File**, **View**, **Help**, the titles of the tabs and _Name_. The status bar says `<html lang="de">` and `data-grd-script="latin"`. The message box of **Help › Ask a question** is _Frage_ with _Ja_, _Nein_ and _Abbrechen_. Press Esc.
3. **A required field.** Click into _Name_ and leave it with Tab: under it, _Dieses Feld ist erforderlich_.
4. **The menu of a tab.** Right-click the tab _Calendar_: _Schließen_, _Andere schließen_, _Tabs links schließen_, … _In ein schwebendes Fenster abdocken_. Press Esc.
5. **A floating window.** Right-click _Notes_ and choose _In ein schwebendes Fenster abdocken_. The tooltips of the window are German (_Fenster verschieben_, _Fenstergröße ändern_). Its menu (the three dots) has _Wieder andocken_, which puts the notes back.
6. **The View menu.** Open **View**: _Language_ (its submenu has a check mark at _Deutsch_), the tool _Form_ (checked while it is open), and _Layout wiederherstellen_.
7. **Japanese.** Choose **View › Language › 日本語**. The select of the header follows. The calendar says _2026年10月_ and its week begins on Sunday (_日_). The fields and the rows of the calendar are a little taller, and so are the lines of text: the status bar says `data-grd-script="tall"`, and the library gives scripts like Japanese more room.
8. **A message box.** Choose **Help › Ask a question**: the title is _質問_ and the buttons are _はい_, _いいえ_ and _キャンセル_. The question itself is English: it is the application's. Press Esc.
9. **The empty area.** Right-click _Calendar_ and choose _すべてのタブを閉じる(A)_. The documents are gone, and the empty area says _開いているドキュメントはありません_.
10. **Press F5.** The page comes back in Japanese, with no documents (the layout is saved too).
11. **Restore layout.** Choose **View › レイアウトを元に戻す(R)**: the calendar and the notes are back.
12. **English again.** Choose _English_ in the header.
13. **See it.** In the developer tools, _Application › Local storage › http://localhost:30130_ has `tutorial-130-language` with the code of the language. `grd-language`, the key that applications share when they give none, is not used.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdStatusBar,
  GrdStatusItem,
} from '@gridify/studio';
import { CalendarPage } from './calendar-page';
import { Form } from './form';

/** Two documents (a calendar and HTML notes) and a tool with a form on the right. */
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
        { tag: 'calendar', role: 'document', title: 'Calendar', componentKey: 'calendar' },
        {
          tag: 'notes',
          role: 'document',
          title: 'Notes',
          content: '<p>The texts of this application are English: they are its own.</p>',
        },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'form', role: 'tool', title: 'Form', componentKey: 'form' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <!-- the Language select of the header switches the language by itself -->
    <grd-app-header productName="Languages" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <!-- viewSources: the engine fills the blocks grd:tools and grd:restore-layout of the View menu -->
    <grd-docking-engine
      layoutStorageKey="tutorial-130-layout"
      [defaultLayout]="layout"
      viewSources
    />
    <grd-status-bar [items]="statusItems()" />
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
  private readonly i18n = inject(GrdI18n);
  private readonly box = inject(GrdMessageBox);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by the keys that the layout names.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('calendar', CalendarPage);
    registry.registerComponent('form', Form);
  }

  /** One item for every language that has a dictionary, in its own name, with a check mark at the one in use. */
  private readonly languageItems = computed(() =>
    this.i18n.languages().map((code) => ({
      label: this.i18n.languageName(code),
      checked: this.i18n.language() === code,
      run: () => void this.i18n.setLanguage(code),
    })),
  );

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add a &calendar',
          run: () =>
            this.engine().openComponentTab({ title: 'Calendar', componentKey: 'calendar' }),
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        { label: '&Language', children: this.languageItems() },
        { separator: true },
        // The tools of the engine and Restore layout: blocks of the library, in the language in use.
        { source: 'grd:tools' },
        { separator: true },
        { source: 'grd:restore-layout' },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [
        {
          label: 'Ask a &question',
          run: () =>
            this.box.question('Keep the notes for the next visit?', { buttons: 'yesNoCancel' }),
        },
      ],
    },
  ]);

  /** What the page says about its language: the attributes that the library sets on <html>. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    { id: 'lang', text: `<html lang="${this.i18n.language()}">` },
    { id: 'script', text: `data-grd-script="${this.i18n.scriptClass()}"` },
  ]);
}
```

`src/app/app.config.ts` is in step 1, `src/app/calendar-page.ts` and `src/app/form.ts` in step 3. `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### The texts of the library

Every text that the library shows is stored under a key that starts with `grd.` (`grd.tabMenu.close`, `grd.validation.required`, `grd.messageBox.title.question`). The library brings three dictionaries of them, English (`GRD_LIB_EN`), German (`GRD_LIB_DE`) and Japanese (`GRD_LIB_JA`), and registers them itself when it is loaded. An application does nothing to have them, and they are in all three languages for every component.

### What follows the language

The language is a signal of the translator (`GrdI18n.language()`), and the components read their texts in templates and `computed`s, so they are drawn again when it changes. The docking engine draws its tabs without Angular, and rewrites its own texts (tooltips, the empty area, the menu of a tab) in place, without drawing the layout again. Nothing is lost by a switch: the layout, the floating windows, what is typed in a field and the state of every component stay as they are.

Some texts are not in the dictionaries at all: the names of the months and the days, and the first day of the week. The calendar asks the browser for them (`Intl`) in the language in use, so they are right for every language the browser knows.

### The page

A switch also sets `<html lang>`, which screen readers, hyphenation and the translation offers of the browser read. For a language with a tall script (Japanese, Chinese, Korean, Thai and others, the list `GRD_TALL_LANGUAGES`) it sets `data-grd-script="tall"`, and the density of the controls gives such a script a larger line height and taller fields; `GrdI18n.setTallLanguages` changes the list. `GrdI18n.scriptClass()` tells the kind in use.

### The languages offered

`languages()` lists the languages that have a dictionary, English first. The library makes it English, German and Japanese; a language that the application registers joins the list (132 adds French), and the select of the header and the menu of step 4 show it with no change. `languageName(code)` asks the browser for the name of the language in itself, so every user finds their own.

### Remembered

`setLanguage` remembers the choice under the key of `provideGrdLanguage` (here `tutorial-130-language`), and the next start applies it before anything is drawn. Without `provideGrdLanguage` the key is `grd-language`, shared by all the applications on the same address. 125 shows the keys and how to stop remembering.

### What stays English

The texts of the application: the menus, the titles of the tabs, the label _Name_, the question. The library cannot know them. 131 gives them dictionaries of their own, 132 adds a language that the library does not have, and 133 changes a few texts of the library.

## What you get without writing any of it

- **Every text of the library in English, German and Japanese**: the docking engine, the menus, the message boxes, the fields and their messages, the calendar, the file upload, the header.
- **A switch that keeps everything**: no reload, no new layout, nothing typed is lost.
- **The names of months and days** in the language, and the first day of the week as the language has it.
- **The page attributes**: `<html lang>` and `data-grd-script`, with taller lines for tall scripts.
- **The Language select** of the header, and the list of languages with their own names for a menu of your own.
- **The language kept** after F5 under a key of your own.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 130 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new languages --style=scss --ssr=false --skip-tests
   cd languages
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library and its dictionaries).

4. Write `src/styles.scss` as in 015.

5. Write `src/app/calendar-page.ts` and `src/app/form.ts` from step 3, and replace `src/app/app.config.ts` and `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
