# 132 – A language of your own: French

This tutorial shows how to add a language that the library does not have, here French, both for the library and for the application. You will learn how to:

- write a dictionary with every text of the library (the `grd.…` keys), and one with the texts of the application under keys;
- register both, so that French joins the Language select by itself;
- add a regional variant, Canadian French, which differs in one text and takes the rest from French;
- see what happens to a text that has no French;
- find the missing texts before a user does (`grdCheckDictionaries`), also after an update of the library.

The library speaks English, German and Japanese. The tutorial is from the series about languages (130–135).

```
npm run tutorial 132
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30132 and choose _français_ in the header.

Every tutorial runs on an address of its own (this one on http://localhost:30132), so it has a `localStorage` of its own. It still keeps its language under `tutorial-132-language` and its layout under `tutorial-132-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015 with the header of 125 (a theme and a language select), a status bar at the bottom and a default layout: two documents, Notes and Counter, and a tool on the right that lists what French lacks.

### Step 1: the texts of the application under keys

A language of your own needs the texts of the application in one place. They go into a dictionary under keys of the application (`app.…`), the way the library keeps its own texts under `grd.…` keys. `src/app/i18n/app-en.ts` starts like this:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in English, under keys of its own (`app.*`), the way the library
 * keeps its texts (`grd.*` in `GRD_LIB_EN`). English is the template: every other language has the
 * same keys, and the check of the dictionaries finds the ones that a language lacks.
 */
export const APP_EN: GrdDictionary = {
  'app.menu.file': '&File',
  'app.menu.addCounter': 'Add a &counter',
  'app.menu.addNotes': 'Add &notes',
  'app.menu.reset': '&Reset layout…',
  'app.menu.check': '&Check',
  'app.menu.checkFrench': 'Check the &French dictionaries',
  'app.menu.help': '&Help',
  'app.menu.about': '&About this tutorial',
  'app.tab.notes': 'Notes',
```

English is the template: every other language has the same keys. A text is read by its key, `i18n.keyed('app.menu.file')` (`GrdI18n.keyed`, the current text) or `tk('app.tab.notes')` (a signal of it). An entry can have plural forms, `{ one: 'Clicked {count} time', other: 'Clicked {count} times' }`, and `{count}` chooses the form.

### Step 2: the French of the application

`src/app/i18n/app-fr.ts` has the same keys in French, except one:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in French: the keys of `APP_EN`. One is left out on purpose,
 * `app.menu.about`: in French, Help › About this tutorial stays in English, and the check of the
 * dictionaries reports it.
 */
export const APP_FR: GrdDictionary = {
  'app.menu.file': '&Fichier',
  'app.menu.addCounter': 'Ajouter un &compteur',
  'app.menu.addNotes': 'Ajouter des &notes',
  'app.menu.reset': '&Réinitialiser la disposition…',
  'app.menu.check': '&Vérifier',
  'app.menu.checkFrench': 'Vérifier les dictionnaires &français',
  'app.menu.help': '&Aide',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Compteur',
```

`app.menu.about` is left out on purpose: Help › About this tutorial stays English in French. The texts after it are in the file; the counter, for example, says `{ one: '{count} clic', other: '{count} clics' }`. French uses `one` for 0 as well, so the counter starts at _0 clic_.

### Step 3: the library in French

`src/app/i18n/fr-library.ts` has all the texts of the library in French, under the keys of `GRD_LIB_EN`, the English dictionary of the library:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the library in French. Every key of `GRD_LIB_EN` (the English texts of the library,
 * the template) is here, with the same `{placeholders}`, the same `&` before the access key of a
 * menu item, and the plural forms `one` and `other` where English has them (in French `one` is
 * also used for 0). The spaces before `:`, `;`, `!`, `?` and inside `« »` are no-break spaces, as
 * French typography wants them: a line never starts with the sign.
 */
export const GRD_LIB_FR: GrdDictionary = {
  'grd.menuBar.label': 'Menu principal',
  'grd.menuBar.more': 'Autres menus',
  'grd.statusBar.label': 'Barre d’état',
  'grd.statusBar.more': 'Autres éléments',
  'grd.toolbar.label': 'Barre d’outils',
  'grd.toolbar.more': 'Autres outils',
  'grd.ribbon.search': 'Rechercher une commande…',
  'grd.ribbon.quickAccess': 'Barre d’outils Accès rapide',
  'grd.ribbon.tabs': 'Onglets du ruban',
  'grd.ribbon.pin': 'Épingler le ruban',
```

That is how such a file is made:

1. Print the English texts of the library. `GRD_LIB_EN` is exported by `@gridify/studio`, so `console.log(JSON.stringify(GRD_LIB_EN, null, 2))` in any component prints all of them, a little over 800.
2. Translate every value and keep everything else: the key, the `{placeholders}` (the library fills them, as in `'{label} – options'`), the `&` before the access key of a menu item (`'&Fermer'`; letters that do not repeat in one menu), and the plural forms where English has them (`{ one: …, other: … }`).
3. French typography wants a space before `:`, `;`, `!` and `?` and inside `« »`. The file has no-break spaces there, so a line never starts with the sign.
4. Check it (step 7): the check reports a missing key, a missing plural form and a placeholder that differs from English.

### Step 4: registering the dictionaries

`src/app/app.config.ts`:

```ts
import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { APP_EN } from './i18n/app-en';
import { APP_FR } from './i18n/app-fr';
import { APP_FR_CA } from './i18n/app-fr-ca';
import { GRD_LIB_FR } from './i18n/fr-library';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under this key.
    provideGrdLanguage({ storageKey: 'tutorial-132-language' }),
    // The dictionaries, before the first screen: French is then known when a remembered French
    // is applied, and the application starts in it.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('en', APP_EN);
      // French: the texts of the library and the texts of the application (the two merge).
      i18n.register('fr', GRD_LIB_FR);
      i18n.register('fr', APP_FR);
      // Canadian French: the few texts that differ, the rest comes from French.
      i18n.register('fr-CA', APP_FR_CA);
    }),
  ],
};
```

- `register('fr', …)` twice merges the two dictionaries of French into one. A language is offered as soon as it has a dictionary: the select of the header lists it under its own name (`languageName('fr')` is _français_).
- The dictionaries are registered in an environment initializer, before the first screen. When French is the remembered language, it is applied the moment its dictionary is registered, so the application starts in French and never shows English first.
- `provideGrdLanguage` comes first: it sets the key the language is remembered under, and the dictionaries come after it.

### Step 5: the application reads its texts

The menus are a `computed`, so they follow the language. In `src/app/app.ts`:

```ts
  /** The menus read their texts in a `computed`, so they follow the language. */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const text = (key: string) => this.i18n.keyed(key);
    return [
      {
        id: 'file',
        label: text('app.menu.file'),
        items: [
          { label: text('app.menu.addCounter'), run: () => this.addCounter() },
          { label: text('app.menu.addNotes'), run: () => this.addNotes() },
          { separator: true },
          { label: text('app.menu.reset'), run: () => this.reset() },
        ],
      },
      {
        id: 'check',
        label: text('app.menu.check'),
        items: [{ label: text('app.menu.checkFrench'), run: () => this.showCheck() }],
      },
      {
        id: 'help',
        label: text('app.menu.help'),
        // No French for this one (`app-fr.ts` leaves it out): it stays in English.
        items: [{ label: text('app.menu.about'), run: () => this.about() }],
      },
    ];
  });
```

The tabs of the default layout have signals for their titles and for the HTML of the notes. The engine rewrites them in place when the language changes:

```ts
      tabs: [
        {
          tag: 'notes',
          role: 'document',
          title: tk('app.tab.notes'),
          content: tk('app.notes.html'),
        },
        { tag: 'counter', role: 'document', title: tk('app.tab.counter'), componentKey: 'counter' },
      ],
```

The status bar says which language is in use, with the name of the language in its own language:

```ts
  /** The status bar: the language in use and a line that Canadian French says in its own way. */
  protected readonly status = computed<GrdStatusItem[]>(() => {
    const code = this.i18n.language();
    const name = this.i18n.languageName(code);
    return [
      { id: 'language', text: this.i18n.keyed('app.status.language', { name, code }) },
      { id: 'contact', text: this.i18n.keyed('app.status.contact'), align: 'end' },
    ];
  });
```

The counter (`src/app/counter.ts`) reads its texts the same way, with `count` for the plural form:

```ts
  template: `
    <p>{{ i18n.keyed('app.counter.intro') }}</p>
    <grd-button
      [label]="i18n.keyed('app.counter.clicked', { count: clicks() })"
      (pressed)="clicks.set(clicks() + 1)"
    />
```

### Step 6: Canadian French

A regional language needs only what differs. `src/app/i18n/app-fr-ca.ts`:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * Canadian French: only what differs from French. Every other text comes from `fr` (the language
 * chain is `fr-CA`, `fr`, `en`).
 */
export const APP_FR_CA: GrdDictionary = {
  'app.status.contact': 'Courriel : help@example.com',
};
```

A text is looked up along a chain: `fr-CA`, then `fr`, then `en`. So Canadian French has the menus, the tabs and the whole library from French, and only the contact line of the status bar is its own. `register('fr-CA', APP_FR_CA)` in step 4 makes it a language of the select (_français canadien_).

### Step 7: checking the dictionaries

`grdCheckDictionaries` compares every dictionary with English and returns what is wrong: a key that a language lacks, an empty text, a plural form that a language needs, a placeholder that differs. The tool on the right, `src/app/french-check.ts`, shows what it finds for French in a `grd-problem-list`:

```ts
  protected readonly problems = computed<GrdProblem[]>(() => {
    this.runs();
    // `revision` changes with every dictionary and language: a dictionary registered later is checked as well.
    this.i18n.revision();
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    return issues
      .filter((issue) => issue.language === 'fr' || issue.language.startsWith('fr-'))
      .map((issue) => ({
        id: `${issue.language} ${issue.key} ${issue.type}`,
        severity: 'warning',
        // The columns: the language, the key of the text, and what is wrong in the tooltip of the row.
        code: issue.language,
        message: issue.key,
        title: issue.type === 'missing' ? this.i18n.keyed('app.check.missing') : issue.detail,
      }));
  });
```

Only French and Canadian French are shown: the application has no texts of its own in German or Japanese, so those two would list every text of the application. In dev mode (`ng serve`) the same check is in the console of the browser: `grdDev.checkLang()` prints a table per language.

### Step 8: run it

```
npm run tutorial 132
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** Everything is English: the menus **File**, **Check** and **Help**, the tabs _Notes_, _Counter_ and _French check_, and the status bar _Language: English (en)_. The language select of the header offers _English_, _Deutsch_, _日本語_, _français_ and _français canadien_.
2. **Choose _français_.** The menus are **Fichier**, **Vérifier** and **Aide**, the tabs _Notes_, _Compteur_ and _Vérification du français_, and the status bar _Langue : français (fr)_. Click the button of the counter: _0 clic_, _1 clic_, _2 clics_.
3. **The library in French.** Right-click the tab _Compteur_: the menu of the tab has _Fermer_, _Fermer les autres_, _Fermer les onglets à gauche_ … _Détacher dans une fenêtre flottante_. Choose **Fichier › Réinitialiser la disposition…**: the question is the application's, the buttons _Annuler_ and _OK_ are the library's. Choose _Annuler_. Close both documents: the empty area says _Aucun document ouvert_ and _Ouvrez un document ou faites glisser un onglet ici_. Hover the cross of a tab: _Fermer_.
4. **The text with no French.** Open **Aide**: its only item is _About this tutorial_, in English, because `app-fr.ts` leaves it out. The box it opens is French (_À propos de ce tutoriel_). The tool on the right lists the key `app.menu.about` twice: for `fr` and for `fr-CA`, which takes its texts from French.
5. **Canadian French.** Choose _français canadien_. Everything stays French, except the end of the status bar: _Courriel : help@example.com_ instead of _E-mail : help@example.com_.
6. **Press F5.** The language is back (`tutorial-132-language` keeps `fr-CA`). Choose **Fichier › Ajouter un compteur**, press F5 again and choose _English_: the titles of the tabs follow the language, the new counter too.
7. **German.** Choose _Deutsch_: the library speaks German (the menu of a tab, _Probleme: 2_ in the tool), and the application stays English, because it has no German texts.
8. **In the console** (with `ng serve`): `grdDev.checkLang()` prints a group for each language. French and Canadian French have the one missing text; German and Japanese have every text of the application, which this application does not translate. While French is on, the console also warns once: `[grd-i18n] Missing translation (fr): "app.menu.about"`.

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
  tk,
} from '@gridify/studio';
import { Counter } from './counter';
import { FrenchCheck } from './french-check';

/**
 * The default layout. The titles and the HTML are signals of keys (`tk`), so the engine rewrites
 * them in place when the language changes; their tags link the tabs of a saved layout to the
 * signals again after a reload.
 */
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
        {
          tag: 'notes',
          role: 'document',
          title: tk('app.tab.notes'),
          content: tk('app.notes.html'),
        },
        { tag: 'counter', role: 'document', title: tk('app.tab.counter'), componentKey: 'counter' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [
        { tag: 'check', role: 'tool', title: tk('app.tab.check'), componentKey: 'french-check' },
      ],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <!-- the language select lists every language that has a dictionary: French too -->
    <grd-app-header productName="Own language" preferences="theme language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-132-layout" [defaultLayout]="layout" />
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
  private readonly i18n = inject(GrdI18n);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the keys must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('french-check', FrenchCheck);
  }

  /** The menus read their texts in a `computed`, so they follow the language. */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const text = (key: string) => this.i18n.keyed(key);
    return [
      {
        id: 'file',
        label: text('app.menu.file'),
        items: [
          { label: text('app.menu.addCounter'), run: () => this.addCounter() },
          { label: text('app.menu.addNotes'), run: () => this.addNotes() },
          { separator: true },
          { label: text('app.menu.reset'), run: () => this.reset() },
        ],
      },
      {
        id: 'check',
        label: text('app.menu.check'),
        items: [{ label: text('app.menu.checkFrench'), run: () => this.showCheck() }],
      },
      {
        id: 'help',
        label: text('app.menu.help'),
        // No French for this one (`app-fr.ts` leaves it out): it stays in English.
        items: [{ label: text('app.menu.about'), run: () => this.about() }],
      },
    ];
  });

  /** The status bar: the language in use and a line that Canadian French says in its own way. */
  protected readonly status = computed<GrdStatusItem[]>(() => {
    const code = this.i18n.language();
    const name = this.i18n.languageName(code);
    return [
      { id: 'language', text: this.i18n.keyed('app.status.language', { name, code }) },
      { id: 'contact', text: this.i18n.keyed('app.status.contact'), align: 'end' },
    ];
  });

  /** A new tab with a signal title; its tag links it to that signal again after a reload. */
  private addCounter(): void {
    this.engine().openComponentTab({
      tag: 'counter',
      title: tk('app.tab.counter'),
      componentKey: 'counter',
    });
  }

  private addNotes(): void {
    this.engine().openHtmlTab({
      tag: 'notes',
      title: tk('app.tab.notes'),
      content: tk('app.notes.html'),
    });
  }

  /** The texts of the question are the application's, the buttons (OK, Cancel) the library's. */
  private async reset(): Promise<void> {
    const sure = await this.messages.confirm(this.i18n.keyed('app.reset.message'), {
      title: this.i18n.keyed('app.reset.title'),
    });
    if (sure) this.engine().resetLayout();
  }

  /** Shows the check (a tool of the layout); it was closed, it is opened again. */
  private showCheck(): void {
    const api = this.engine().api;
    const open = api.getByTag('check').find((node) => api.isTab(node));
    if (open) api.activateTab(open.id);
    else {
      this.engine().openComponentTab({
        tag: 'check',
        role: 'tool',
        title: tk('app.tab.check'),
        componentKey: 'french-check',
      });
    }
  }

  private about(): void {
    this.messages.info(this.i18n.keyed('app.about.message'), {
      title: this.i18n.keyed('app.about.title'),
    });
  }
}
```

`src/app/french-check.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  GRD_I18N,
  GrdI18n,
  GrdProblem,
  GrdProblemList,
  GrdProblemTool,
  grdCheckDictionaries,
} from '@gridify/studio';

/**
 * A tool of the engine that lists what French lacks: `grdCheckDictionaries` compares every
 * dictionary with English. Only French and Canadian French are shown; the application has no
 * texts of its own in German or Japanese, so those two would list every text of the application.
 */
@Component({
  selector: 'app-french-check',
  imports: [GrdProblemList],
  template: `
    <p>{{ i18n.keyed('app.check.intro') }}</p>
    <grd-problem-list
      [problems]="problems()"
      [columns]="['severity', 'code', 'message']"
      [columnTitles]="{
        code: i18n.keyed('app.check.language'),
        message: i18n.keyed('app.check.key'),
      }"
      [tools]="tools()"
      [emptyText]="i18n.keyed('app.check.ok')"
      (toolUsed)="runs.set(runs() + 1)"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    p {
      margin: 0;
      padding: 8px 10px;
      font-size: var(--grd-font-size-base);
      line-height: 1.45;
    }
    grd-problem-list {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class FrenchCheck {
  protected readonly i18n = inject(GrdI18n);
  /** Check again: in dev mode the texts looked up so far are checked too, and more are looked up as the user works. */
  protected readonly runs = signal(0);

  protected readonly problems = computed<GrdProblem[]>(() => {
    this.runs();
    // `revision` changes with every dictionary and language: a dictionary registered later is checked as well.
    this.i18n.revision();
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    return issues
      .filter((issue) => issue.language === 'fr' || issue.language.startsWith('fr-'))
      .map((issue) => ({
        id: `${issue.language} ${issue.key} ${issue.type}`,
        severity: 'warning',
        // The columns: the language, the key of the text, and what is wrong in the tooltip of the row.
        code: issue.language,
        message: issue.key,
        title: issue.type === 'missing' ? this.i18n.keyed('app.check.missing') : issue.detail,
      }));
  });

  protected readonly tools = computed<GrdProblemTool[]>(() => [
    { type: 'count' },
    { type: 'spacer' },
    { type: 'button', id: 'again', label: this.i18n.keyed('app.check.again') },
  ]);
}
```

`src/app/counter.ts`:

```ts
import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n } from '@gridify/studio';

/** A real Angular component in a tab, with its texts under keys: they follow the language. */
@Component({
  selector: 'app-counter',
  imports: [GrdButton],
  template: `
    <p>{{ i18n.keyed('app.counter.intro') }}</p>
    <grd-button
      [label]="i18n.keyed('app.counter.clicked', { count: clicks() })"
      (pressed)="clicks.set(clicks() + 1)"
    />
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
  `,
})
export class Counter {
  protected readonly i18n = inject(GrdI18n);
  protected readonly clicks = signal(0);
}
```

`src/app/app.config.ts` is in step 4, `src/app/i18n/app-fr-ca.ts` in step 6. `src/app/i18n/app-en.ts`, `app-fr.ts` and `fr-library.ts` are dictionaries: the keys and their texts. `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### Keys or English texts

A text of the application can be looked up in two ways. `t('Save')` uses the English text as its key: nothing is needed for English, and a language only maps the English text to its own. `tk('app.menu.file')` uses a key, and English is a dictionary like any other. This tutorial uses keys, the way the library does, because English then lists every text of the application: the check finds a text that French lacks from the dictionaries alone, also in a production build. With `t()` the check knows a text only after it has been looked up, and only in dev mode (`usedLookups()`).

### The chain of languages

A text is looked up in the chosen language, then in its base language, then in English: `fr-CA`, `fr`, `en`. A text that no language of the chain has is shown in English (a key with no text anywhere shows the key itself). An empty text counts as missing, which is how translation tools export a text that is not translated yet. So a dictionary may be incomplete: the screen stays readable, and the check says what is left.

### What follows the language

- **Templates and `computed`s** that read a text (`keyed`, `text`, `t()`, `tk()`) are read again on every switch, because the texts are signals.
- **The library** draws its own texts the same way, and the engine rewrites the texts it put into the page itself (the empty area, the tooltips of the tabs).
- **Tab titles and HTML** follow a signal (`title: tk('app.tab.notes')`). A saved layout keeps only the last text, so after a reload a tab is linked to the signal of the default layout again by its `tag`. That is why **Ajouter un compteur** opens the counter with `tag: 'counter'`, the tag of the counter of the default layout. A tab opened without such a tag keeps, after a reload, the title it was saved with, in the language of that moment.
- **`<html lang>`** is the language, so a screen reader reads French with French rules.

### A new version of the library

A new version of the library may add texts. Their keys come in `GRD_LIB_EN`, and the check lists them for French (`grd.…` keys in the tool) until they are translated; meanwhile they show in English. Run the check after every update of the library, or in a unit test: `grdCheckDictionaries(GRD_I18N.dictionariesSnapshot(), 'en')` returns an empty list when nothing is missing.

### The size of the first load

The French dictionary of the library is about 40 kB of the first load, and with the header, the status bar, the message boxes and the list of problems the first load is a little over 1 MB. That is why `angular.json` of this tutorial has an `initial` budget of `maximumWarning: 1.5MB` (`maximumError: 2MB`). Tutorial 134 loads the dictionary only when French is chosen.

## What you get without writing any of it

- **A new language in the select** of the header, under its own name, as soon as it has a dictionary.
- **The fallback**: a missing text shows the base language or English, never nothing.
- **The library in your language**: menus, the menu of a tab, the empty area, the boxes and their buttons, the lists, the tooltips and the names for screen readers, all from one dictionary.
- **Plural forms** by the rules of each language (`Intl.PluralRules`), and numbers in texts formatted for it.
- **The check** of the dictionaries: missing texts, missing plural forms, placeholders that differ.
- **`<html lang>`**, and the language remembered under a key of your own.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 132 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new own-language --style=scss --ssr=false --skip-tests
   cd own-language
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library and a dictionary).

4. Write `src/styles.scss` as in 015.

5. Write the dictionaries into `src/app/i18n/`: `app-en.ts`, `app-fr.ts`, `app-fr-ca.ts` and `fr-library.ts` (step 3 says how).

6. Replace `src/app/app.config.ts` and `src/app/app.ts` with the code above, and add `src/app/counter.ts` and `src/app/french-check.ts`. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

7. Run it:

   ```
   ng serve
   ```
