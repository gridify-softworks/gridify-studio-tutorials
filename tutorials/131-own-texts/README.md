# 131 – Texts of your own in three languages

This tutorial shows how to translate the texts of your application (the menus, the titles of the tabs, the pages and the components), so that they follow the language like the texts of the library. You will learn how to:

- write the texts in English in the code, and register German and Japanese dictionaries for them;
- read a text in the three ways: as a signal (`t`, `tk`), in a template (`i18n.text`, `i18n.keyed`) and as a string of the moment (`tx`, `tkx`);
- keep long texts under keys, put values into texts (`{name}`), and give one English word two meanings (`context`);
- see what a missing translation does;
- keep the titles of tabs following the language after F5 (by their `tag`).

The texts of the library follow the language by themselves (130); the texts of an application are its own. The tutorial is from the series about languages (130–135).

```
npm run tutorial 131
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30131 and choose _Deutsch_ in the select at the right of the header.

Every tutorial runs on an address of its own (this one on http://localhost:30131), so it has a `localStorage` of its own. It still keeps its language under the key `tutorial-131-language` and its layout under `tutorial-131-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 130 without its components of the library: a welcome page and a counter as documents, a log as a tool, a menu bar and a status bar.

### Step 1: the dictionaries

A dictionary is a list: on the left the English text exactly as the code writes it, on the right the translation. `src/app/app.de.ts` is the German one:

```ts
import { GrdDictionary } from '@gridify/studio';

/** German: on the left the English text exactly as the code writes it (or a key), on the right the translation. */
export const DE: GrdDictionary = {
  // the menus: & marks the letter of Alt (Alt+D opens Datei)
  '&File': '&Datei',
  'Add a &counter': '&Zähler hinzufügen',
  'Add a &welcome page': '&Willkommensseite hinzufügen',
  '&View': '&Ansicht',
  // the titles of the tabs
  Welcome: 'Willkommen',
  Counter: 'Zähler',
  Log: 'Protokoll',
  // the welcome page
  'app.welcome':
    'Diese Seite ist HTML in einem Tab. Ihr Inhalt ist ein Signal, daher schreibt die Engine sie in der gewählten Sprache neu. Ein langer Text wie dieser ist unter einem Schlüssel (app.welcome) gespeichert, nicht unter seinem englischen Wortlaut.',
  // the counter
  'An Angular component with a signal.': 'Eine Angular-Komponente mit einem Signal.',
  'Clicks: {clicks}': 'Klicks: {clicks}',
  'Add one': 'Um eins erhöhen',
  // the log
  'Your name': 'Ihr Name',
  'Hello, {name}!': 'Hallo, {name}!',
  'Write a line': 'Zeile schreiben',
  'Greeting for {name} at {time}': 'Gruß an {name} um {time}',
  // "Empty" twice: the button empties the log (a verb), the log says it is empty (an adjective)
  'Empty|command': 'Leeren',
  Empty: 'Leer',
  // the status bar
  'Language: {name}': 'Sprache: {name}',
};
```

`src/app/app.ja.ts` is the Japanese one. One text of the counter is left out on purpose, to see what happens:

```ts
import { GrdDictionary } from '@gridify/studio';

/**
 * Japanese. The text of the counter's first line is left out on purpose: it is shown in English.
 * In Japanese menus the letter of Alt stands after the text, in brackets: ファイル(&F).
 */
export const JA: GrdDictionary = {
  // the menus
  '&File': 'ファイル(&F)',
  'Add a &counter': 'カウンターを追加(&C)',
  'Add a &welcome page': 'ようこそページを追加(&W)',
  '&View': '表示(&V)',
  // the titles of the tabs
  Welcome: 'ようこそ',
  Counter: 'カウンター',
  Log: 'ログ',
  // the welcome page
  'app.welcome':
    'このページはタブの中の HTML です。コンテンツはシグナルなので、選んだ言語でエンジンが書き直します。このような長い文は英語の文章ではなくキー（app.welcome）で保存します。',
  // the counter ('An Angular component with a signal.' is missing on purpose)
  'Clicks: {clicks}': 'クリック数: {clicks}',
  'Add one': '1 つ増やす',
  // the log
  'Your name': 'お名前',
  'Hello, {name}!': 'こんにちは、{name} さん！',
  'Write a line': '1 行書く',
  'Greeting for {name} at {time}': '{time} に {name} さんへのあいさつ',
  'Empty|command': '空にする',
  Empty: '空です',
  // the status bar
  'Language: {name}': '言語: {name}',
};
```

English needs a dictionary only for the texts under keys (step 3). `src/app/app.en.ts`:

```ts
import { GrdDictionary } from '@gridify/studio';

/**
 * English needs a dictionary only for the texts under keys: a key has no English text in the code.
 * The other texts of the code are English already.
 */
export const EN: GrdDictionary = {
  'app.welcome':
    'This page is HTML in a tab. Its content is a signal, so the engine writes it again in the language you choose. A long text like this one is kept under a key (app.welcome), not under its English words.',
};
```

### Step 2: register them

`src/app/app.config.ts` registers the three dictionaries once, when the application starts, and gives the language a key of its own (130):

```ts
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { DE } from './app.de';
import { EN } from './app.en';
import { JA } from './app.ja';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-131-language' }),
    // The dictionaries of the application, once at the start: the texts under keys in English,
    // and every text in German and in Japanese.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('en', EN);
      i18n.register('de', DE);
      i18n.register('ja', JA);
    }),
  ],
};
```

`register` adds the texts to the dictionaries of the library: the library keeps its own texts, and the application's join them. Two registrations of one language merge; a later entry wins.

### Step 3: the titles of the tabs and an HTML page

The default layout in `src/app/app.ts` gives the tabs titles with `t()`. `t('Welcome')` is a **signal**: read, it gives the text in the language in use, and it changes when the language does. The engine follows a signal title by itself and writes the new title into the tab. The HTML of the welcome page is a signal too, a `computed` of two texts; the engine writes the page again when it changes:

```ts
/** The HTML of the welcome page: a signal, so the engine writes the page again in another language. */
const welcome = computed(() => `<h2>${tx('Welcome')}</h2><p>${tkx('app.welcome')}</p>`);

/** The welcome page and the counter as documents, the log as a tool. The titles are signals (t). */
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
        { tag: 'welcome', role: 'document', title: t('Welcome'), content: welcome },
        { tag: 'counter', role: 'document', title: t('Counter'), componentKey: 'counter' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: t('Log'), componentKey: 'log' }],
    },
  ],
};
```

`tkx('app.welcome')` is a text under a **key**. A long text is kept under a name of its own (`app.welcome`) instead of under its English words, so that a change of one English word does not make a new text in every dictionary. A key has no English in the code, so English needs an entry for it too (`app.en.ts`).

### Step 4: menus

A menu is made of plain strings, so the menus are a `computed`, and each label is `tx()`: the translation **now**, a string. Read inside the `computed`, it makes the `computed` depend on the language, so the menus are made again after a switch. `&` marks the letter of Alt, and the dictionaries move it where the language needs it (`&Datei`, `ファイル(&F)`):

```ts
  /** The menus: tx inside a computed, so the computed makes them again in another language. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [
        {
          label: tx('Add a &counter'),
          // The tag of the counter of the layout: after F5 the title finds its signal by it.
          run: () =>
            this.engine().openComponentTab({
              tag: 'counter',
              title: t('Counter'),
              componentKey: 'counter',
            }),
        },
        {
          label: tx('Add a &welcome page'),
          run: () =>
            this.engine().openHtmlTab({ tag: 'welcome', title: t('Welcome'), content: welcome }),
        },
      ],
    },
    {
      id: 'view',
      label: tx('&View'),
      items: [{ source: 'grd:tools' }, { separator: true }, { source: 'grd:restore-layout' }],
    },
  ]);
```

**Add a counter** opens a counter with the tag of the counter of the layout (`counter`); step 7 tells why.

### Step 5: a component

`src/app/counter.ts` is the counter of 015 with its texts translated:

```ts
import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n, t } from '@gridify/studio';

/** The counter of 015 with its texts translated. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>{{ description() }}</p>
    <p>{{ i18n.text('Clicks: {clicks}', { clicks: clicks() }) }}</p>
    <grd-button [label]="i18n.text('Add one')" (pressed)="clicks.set(clicks() + 1)" />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
      font-size: var(--grd-font-size-base);
    }
  `,
})
export class Counter {
  protected readonly i18n = inject(GrdI18n);
  protected readonly clicks = signal(0);
  /** A text as a signal, made once: read with () it follows the language. */
  protected readonly description = t('An Angular component with a signal.');
}
```

- `description` is a signal made once, in a field: the template reads it with `()`.
- `i18n.text('Clicks: {clicks}', { clicks: clicks() })` is read by the template, which reads it again when the language changes. `{clicks}` is a value: the translation puts it where the language needs it, and a number is written the way the language writes numbers.

### Step 6: a tool that writes lines

`src/app/log.ts` shows the difference between a signal and a string:

```ts
import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n, GrdInput, t, tx } from '@gridify/studio';

/** A tool that writes lines: a line is a string, written once, in the language of that moment. */
@Component({
  selector: 'app-log',
  imports: [GrdButton, GrdInput],
  template: `
    <grd-input [label]="i18n.text('Your name')" [(value)]="name" />
    <!-- a signal: it follows the language and the name -->
    <p class="greeting">{{ greeting() }}</p>
    <div class="buttons">
      <grd-button [label]="i18n.text('Write a line')" (pressed)="write()" />
      <!-- the same English word as the line below, another meaning: the context tells them apart -->
      <grd-button [label]="i18n.text('Empty', { context: 'command' })" (pressed)="lines.set([])" />
    </div>
    @for (line of lines(); track $index) {
      <p class="line">{{ line }}</p>
    } @empty {
      <p class="line">{{ i18n.text('Empty') }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      font-size: var(--grd-font-size-base);
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
    p {
      margin: 0;
    }
    .line {
      opacity: 0.88;
    }
  `,
})
export class Log {
  protected readonly i18n = inject(GrdI18n);
  protected readonly name = signal('Ana');
  protected readonly lines = signal<string[]>([]);
  /** A signal as the value of {name}: the text changes with the language and with the name. */
  protected readonly greeting = t('Hello, {name}!', { name: this.name });

  /** tx gives a string now: the line keeps the language it was written in. */
  protected write(): void {
    const time = new Date().toLocaleTimeString(this.i18n.language(), { timeStyle: 'short' });
    this.lines.update((lines) => [
      ...lines,
      tx('Greeting for {name} at {time}', { name: this.name(), time }),
    ]);
  }
}
```

- `greeting` is `t()` with a **signal as the value** of `{name}`: the greeting follows both the language and the name in the field.
- `write()` makes each line with `tx()`: a string of that moment. The line is kept in a list, so it stays in the language it was written in. That is right for a log, a message that was sent, a file name; it is wrong for a label, which must be a signal or be read in a template.
- **Empty** means two things here: the button empties the log (a verb), and the log says it is empty (an adjective). English writes both the same, German and Japanese do not, so the button has a `context`: its key is `Empty|command`, the other one is `Empty`.

### Step 7: the status bar

```ts
  /** The status bar: a computed as well, with the name of the language as the value of {name}. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    {
      id: 'language',
      text: tx('Language: {name}', { name: this.i18n.languageName(this.i18n.language()) }),
    },
  ]);
```

### Step 8: run it

```
npm run tutorial 131
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** Everything is English: **File**, **View**, the tabs _Welcome_, _Counter_ and _Log_, and the status bar _Language: English_. The log greets _Hello, Ana!_.
2. **A line.** Press **Write a line**: _Greeting for Ana at 10:42 AM_ (the time of now).
3. **German.** Choose _Deutsch_ in the header. The menus are **Datei** and **Ansicht**, the tabs _Willkommen_, _Zähler_ and _Protokoll_, the welcome page is written again in German, and the status bar says _Sprache: Deutsch_. The log has _Ihr Name_, _Hallo, Ana!_ and the buttons **Zeile schreiben** and **Leeren**. The line of step 2 stays English: it was a string.
4. **A German line.** Press **Zeile schreiben**: _Gruß an Ana um 10:43_.
5. **A value that is a signal.** Type _Petr_ into _Ihr Name_: the greeting says _Hallo, Petr!_ as you type.
6. **Two meanings.** Press **Leeren**: the log says _Leer_.
7. **The counter.** Open _Zähler_: _Eine Angular-Komponente mit einem Signal._, _Klicks: 0_ and **Um eins erhöhen**, which counts.
8. **The letter of Alt.** Press Alt+D: the menu **Datei** opens (the access key is part of the translation). Press Esc.
9. **The View menu.** Open **Ansicht**: the tool is there under its German title, _Protokoll_, and _Layout wiederherstellen_ is the library's.
10. **Japanese, with a text missing.** Choose _日本語_. The menus are **ファイル(F)** and **表示(V)**, the tabs _ようこそ_, _カウンター_ and _ログ_. The first line of the counter stays English, _An Angular component with a signal._: `app.ja.ts` has no entry for it, so the English text of the code is shown. Nothing breaks.
11. **A counter from the menu.** Choose **ファイル(F) › カウンターを追加(C)**: a second _カウンター_.
12. **Press F5.** The page comes back in Japanese with its four tabs. Choose _English_: every title follows, the second counter too.
13. **During development.** With `ng serve`, the console says once `[grd-i18n] Missing translation (ja): "An Angular component with a signal."` when the counter is shown in Japanese. `grdDev.checkLang()` typed into the console compares the dictionaries and lists the same missing text (132 uses the check for a whole language). A production build (`ng build`) writes nothing.

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
  GrdStatusBar,
  GrdStatusItem,
  t,
  tkx,
  tx,
} from '@gridify/studio';
import { Counter } from './counter';
import { Log } from './log';

/** The HTML of the welcome page: a signal, so the engine writes the page again in another language. */
const welcome = computed(() => `<h2>${tx('Welcome')}</h2><p>${tkx('app.welcome')}</p>`);

/** The welcome page and the counter as documents, the log as a tool. The titles are signals (t). */
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
        { tag: 'welcome', role: 'document', title: t('Welcome'), content: welcome },
        { tag: 'counter', role: 'document', title: t('Counter'), componentKey: 'counter' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: t('Log'), componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-app-header productName="Own texts" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine
      layoutStorageKey="tutorial-131-layout"
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
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by the keys that the layout names.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('log', Log);
  }

  /** The menus: tx inside a computed, so the computed makes them again in another language. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [
        {
          label: tx('Add a &counter'),
          // The tag of the counter of the layout: after F5 the title finds its signal by it.
          run: () =>
            this.engine().openComponentTab({
              tag: 'counter',
              title: t('Counter'),
              componentKey: 'counter',
            }),
        },
        {
          label: tx('Add a &welcome page'),
          run: () =>
            this.engine().openHtmlTab({ tag: 'welcome', title: t('Welcome'), content: welcome }),
        },
      ],
    },
    {
      id: 'view',
      label: tx('&View'),
      items: [{ source: 'grd:tools' }, { separator: true }, { source: 'grd:restore-layout' }],
    },
  ]);

  /** The status bar: a computed as well, with the name of the language as the value of {name}. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    {
      id: 'language',
      text: tx('Language: {name}', { name: this.i18n.languageName(this.i18n.language()) }),
    },
  ]);
}
```

`src/app/app.config.ts` is in step 2, the dictionaries in step 1, `src/app/counter.ts` in step 5 and `src/app/log.ts` in step 6. `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### Three ways to read a text

| Function                             | Gives                   | Follows the language                                          | For                                                                                             |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `t(text)`, `tk(key)`                 | a signal                | always: read it with `()`                                     | a field, a constant, a layout, a title of a tab, anything made once                             |
| `i18n.text(text)`, `i18n.keyed(key)` | a string, in a template | yes: the template reads it again                              | a template                                                                                      |
| `tx(text)`, `tkx(key)`               | a string, now           | inside a `computed`, an `effect` or a template; not when kept | the code of a `computed` (menus, status bar items), and texts that must not change (a log line) |

`t`, `tk`, `tx` and `tkx` are functions of `@gridify/studio` and work anywhere, also outside Angular's injection (a constant at the top of a file). `GrdI18n` has the same as methods (`i18n.t`, `i18n.text`, …).

### A text or a key

`t('Add one')`: the English text is the key of the dictionaries. Short texts of the interface are written so: the code reads well, and English needs no dictionary. `tk('app.welcome')`: a name of your own for a long text; every language needs an entry, English too, and without any the key itself is shown, so a forgotten entry is easy to see.

### Values

`{name}` in a text takes the value of the same name: a string, a number (written as the language writes numbers) or a signal (the text follows it). The translation may put the value anywhere in the sentence (`'{time} に {name} さんへのあいさつ'`). The value `count` is special: it chooses the plural form (135).

### One word, two meanings

`{ context: 'command' }` makes the key `Empty|command`, so the dictionaries can translate it apart from `Empty`. In English both stay _Empty_: the context is not shown.

### A missing text

A lookup goes from the language in use to its base language (`de-AT`, then `de`) and then to English, and when no dictionary has the text, the English text of the code is shown (for a key, the key). An empty translation (`''`) counts as missing, the way translation tools export what is not translated yet. In development the console warns once for each missing text and language, and `grdDev.checkLang()` lists all of them; a production build is silent.

### The titles of tabs after F5

The saved layout keeps a title as text, in the language of the moment it was saved: a signal cannot be saved. After F5 the engine links a tab to the signal again by its `tag`: a tab of the default layout with the same tag and a signal title gives it. That is why **Add a counter** opens its counter with the tag `counter` (and **Add a welcome page** with `welcome`): after F5 the new tabs find their signals and follow the language. A tab whose tag no tab of the default layout has keeps the title it was saved with until it is opened again.

### When to register

Once, at the start, before the texts are read: the environment initializer of `app.config.ts`, or `main.ts`. A dictionary registered later still works (the texts on the screen follow it at once), but until then the user sees English. Big dictionaries can come only when their language is chosen (134).

## What you get without writing any of it

- **Texts that follow the language**: signals, templates and `computed`s read again, the engine rewrites titles and HTML in place, nothing is drawn anew and no state is lost.
- **A missing text never breaks anything**: it falls back to English, with a warning in development.
- **Values in texts**, numbers written for the language, and signals as values.
- **Access keys in every language**, where the translation puts them.
- **Titles that follow after F5**, linked again by tags.
- **One switch for both**: the texts of the library and of the application change together.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 131 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new own-texts --style=scss --ssr=false --skip-tests
   cd own-texts
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015.

5. Write the dictionaries (`app.en.ts`, `app.de.ts`, `app.ja.ts`), `counter.ts` and `log.ts` in `src/app`, and replace `src/app/app.config.ts` and `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
