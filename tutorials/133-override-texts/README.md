# 133 – Your own wording for the texts of the library

This tutorial shows how to change a few texts of the library to the words of your company ("reports" instead of "documents", "Go back" instead of "Cancel") without translating everything. You will learn how to:

- find the key of a text you see on the screen;
- change a few texts of the library in English and in German (`extend`), at the start;
- keep what a text needs: its placeholders, its plural forms and its access key;
- know which entry wins when several dictionaries give the same key.

The other texts stay the library's, in every language. The tutorial is from the series about languages (130–135).

```
npm run tutorial 133
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30133, open a report with **File › New report**, and switch the language in the header.

Every tutorial runs on an address of its own (this one on http://localhost:30133), so it has a `localStorage` of its own. It still keeps its language under `tutorial-133-language` and its layout under `tutorial-133-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with the header of 125 (only the language select), a report in place of the counter, and a tool that finds texts.

### Step 1: the language select

Add `GrdAppHeader` to the imports of `App` and put the header above the menu bar:

```html
<grd-app-header productName="Reports" preferences="language" />
```

`preferences="language"` draws only the language select. It offers the languages that have a dictionary (English, Deutsch, 日本語) and switches by itself. `src/app/app.config.ts` gives the choice a key of this tutorial, `provideGrdLanguage({ storageKey: 'tutorial-133-language' })`, as 125 does.

### Step 2: find the key of a text

The library does not look its texts up by their English words, but by keys under `grd.*` (`grd.dock.emptyTitle` is "No open documents"). To change a text you need its key. Three ways to find it:

- **The dictionary.** `GRD_LIB_EN`, `GRD_LIB_DE` and `GRD_LIB_JA` are exported from `@gridify/studio`. Search them for the text you see, in the language you see it in.
- **A tool that searches them.** The tutorial has one, **Find a text** on the right (`src/app/text-finder.ts`, step 5). Type a piece of a text you see and it lists the keys whose text has it, in the language of the screen. A text the company changed is marked _company_, with the text of the library under it.
- **The developer tools.** The engine draws its tabs, buttons and windows itself, and every text it puts there carries its key: the cross of a tab has `data-grd-i18n="title:grd.tab.close;aria-label:grd.tab.close"`. Inspect the element and read the key.

Two texts that look alike can have two keys. "Detach to a floating window" is `grd.dock.undock` (a tooltip) and `grd.tabMenu.float` (the entry of the menu of a tab, with an `&`); change the one you see.

### Step 3: the wording of the company

A dictionary per language, with only the keys that change. `src/app/company-texts.ts`:

```ts
export const COMPANY_EN: GrdDictionary = {
  // The empty document area of the engine.
  'grd.dock.emptyTitle': 'No reports open',
  'grd.dock.emptyHint': 'Open one with File › New report, or drag a tab here',
  // The cross on a tab: its tooltip and its name for a screen reader.
  'grd.tab.close': 'Close the report',
  // The menu of a tab. The & marks the access key: keep one, and each letter only once in the menu.
  'grd.tabMenu.closeOthers': 'Close &other reports',
  'grd.tabMenu.closeAll': 'Close &all reports',
  'grd.tabMenu.dock': 'Put &back in place',
  // The button in the header of a floating window says the same.
  'grd.dock.dockBack': 'Put back in place',
  // The buttons and the title of a question. The title is only changed in English.
  'grd.messageBox.cancel': 'Go back',
  'grd.messageBox.title.question': 'Please confirm',
  // A text with a parameter: {size} stays, the library fills it in.
  'grd.fileUpload.hintSize': 'Each at most {size}',
  // Plural forms: English has `one` and `other`.
  'grd.fileUpload.hintCount': {
    one: 'One attachment at most',
    other: 'At most {count} attachments',
  },
  'grd.fileUpload.chooseMany': 'Add attachments',
};
```

Keep what the text of the library has besides its words:

- **Parameters** in braces (`{size}`, `{count}`): the library fills them in, a number in the format of the language (`2.5 MB`, `2,5 MB`).
- **Plural forms**: where the library has an object (`{ one, other }`), give one too, with the forms your language needs. German has the same forms as English, `one` (1) and `other`:

```ts
  'grd.fileUpload.hintCount': {
    one: 'Höchstens ein Anhang',
    other: 'Höchstens {count} Anhänge',
  },
```

- **The access key** of an entry of a menu: `&` before the letter that is underlined and pressed with the menu open. Keep one, and no two entries of one menu with the same letter.

`COMPANY_DE` has the same keys in German, except the title of a question: that one is changed only in English, so German keeps the text of the library.

### Step 4: merge it at the start

`extend(language, entries)` of `GrdI18n` merges entries into the dictionary of a language; the entry given last wins. In the same file:

```ts
/** Merges the wording into the dictionaries of the library when the application starts. */
export function provideCompanyTexts(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(GrdI18n);
    i18n.extend('en', COMPANY_EN);
    i18n.extend('de', COMPANY_DE);
  });
}
```

and in `src/app/app.config.ts`:

```ts
    // The wording of the company over the texts of the library.
    provideCompanyTexts(),
```

The library has registered its own dictionaries by then (when `@gridify/studio` was loaded), so the company's entries come after them and win.

### Step 5: a report, a tool and a question

The rest of the application is there to show the texts:

- **A report** (`src/app/report.ts`): a component with an upload of attachments, `<grd-file-upload multiple [maxFiles]="allowed() ?? 1" maxSize="2.5MB" />`, and a spinner that changes `maxFiles`, so the plural forms of the hint can be seen. **File › New report** opens one.
- **Find a text** (`src/app/text-finder.ts`): the tool of step 2, in the default layout of the engine on the right.
- **File › Reset layout** asks first with `GrdMessageBox.confirm`, a question whose title and Cancel button come from the library.
- `settings.setShowDockButton(true)`: a floating window gets the button that puts it back, whose tooltip is `grd.dock.dockBack`.

### Step 6: run it

```
npm run tutorial 133
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** The empty area of the engine says _No reports open_ and _Open one with File › New report, or drag a tab here_: the company's words. The library says _No open documents_.
2. **A report.** Choose **File › New report**. The upload says _Add attachments or drag them here_ and _Each at most 2.5 MB · At most 3 attachments_. Set **Attachments allowed** to 1: _One attachment at most_ (the form `one`). Set it to 5: _At most 5 attachments_.
3. **The tab.** Point at the cross of the tab: _Close the report_. Open a second report and right-click a tab. Two entries are the company's (_Close other reports_, _Close all reports_), the others are the library's (_Close_, _Close tabs to the left_, _Close tabs to the right_, _Detach to a floating window_, _Maximize_). The underlined letters (o, a) still work.
4. **A floating window.** Choose **Detach to a floating window**. The button in its header says _Put back in place_, and so does its menu (**…**). Choose it: the report goes back.
5. **Find a text.** Type `report` in **Find a text**: five keys, all marked _company_, each with the text of the library under it. Type `Detach`: `grd.dock.undock` and `grd.tabMenu.float`, not marked.
6. **The question.** Choose **File › Reset layout**. The box is titled _Please confirm_ and has the buttons _Go back_ and _OK_. Press **Go back**: nothing is reset.
7. **German.** Choose _Deutsch_ in the header. The upload says _Anhänge hinzufügen_ and _Jeweils höchstens 2,5 MB · Höchstens 5 Anhänge_. Set 2: _Höchstens 2 Anhänge_; set 1: _Höchstens ein Anhang_. The menu of a tab has _Andere Berichte schließen_ and _Alle Berichte schließen_. **File › Reset layout**: the title is _Frage_, the library's, because the company changed it only in English; the button is _Zurück_. Press **OK**: the empty area says _Keine Berichte geöffnet_. The menus of the application (**File**, **New report**) stay English: they are the application's own texts, which 131 translates.
8. **Press F5.** German, and the company's words, are back.
9. **Japanese.** Choose _日本語_. Every text of the library is the library's (_開いているドキュメントはありません_): the company has no wording for Japanese. **Find a text** marks nothing.
10. **See it.** In the developer tools, _Application › Local storage › http://localhost:30133_ has `tutorial-133-language` and `tutorial-133-layout`; the dictionaries are not stored, they come from the code at every start. In _Elements_, the cross of a tab has `data-grd-i18n` with its key.

## The code

`src/app/company-texts.ts`:

```ts
import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { GrdDictionary, GrdI18n } from '@gridify/studio';

/**
 * The wording of the company in English: a few texts of the library, found by their keys in `GRD_LIB_EN`.
 * Every other text stays the library's.
 */
export const COMPANY_EN: GrdDictionary = {
  // The empty document area of the engine.
  'grd.dock.emptyTitle': 'No reports open',
  'grd.dock.emptyHint': 'Open one with File › New report, or drag a tab here',
  // The cross on a tab: its tooltip and its name for a screen reader.
  'grd.tab.close': 'Close the report',
  // The menu of a tab. The & marks the access key: keep one, and each letter only once in the menu.
  'grd.tabMenu.closeOthers': 'Close &other reports',
  'grd.tabMenu.closeAll': 'Close &all reports',
  'grd.tabMenu.dock': 'Put &back in place',
  // The button in the header of a floating window says the same.
  'grd.dock.dockBack': 'Put back in place',
  // The buttons and the title of a question. The title is only changed in English.
  'grd.messageBox.cancel': 'Go back',
  'grd.messageBox.title.question': 'Please confirm',
  // A text with a parameter: {size} stays, the library fills it in.
  'grd.fileUpload.hintSize': 'Each at most {size}',
  // Plural forms: English has `one` and `other`.
  'grd.fileUpload.hintCount': {
    one: 'One attachment at most',
    other: 'At most {count} attachments',
  },
  'grd.fileUpload.chooseMany': 'Add attachments',
};

/** The same wording in German, without the title of a question: in German that one stays the library's. */
export const COMPANY_DE: GrdDictionary = {
  'grd.dock.emptyTitle': 'Keine Berichte geöffnet',
  'grd.dock.emptyHint':
    'Öffnen Sie einen Bericht mit File › New report oder ziehen Sie einen Tab hierher',
  'grd.tab.close': 'Bericht schließen',
  'grd.tabMenu.closeOthers': '&Andere Berichte schließen',
  'grd.tabMenu.closeAll': 'Alle &Berichte schließen',
  'grd.tabMenu.dock': 'Zurück an seinen &Platz',
  'grd.dock.dockBack': 'Zurück an seinen Platz',
  'grd.messageBox.cancel': 'Zurück',
  'grd.fileUpload.hintSize': 'Jeweils höchstens {size}',
  // German has the same forms as English: `one` (1) and `other` (0, 2 and more).
  'grd.fileUpload.hintCount': {
    one: 'Höchstens ein Anhang',
    other: 'Höchstens {count} Anhänge',
  },
  'grd.fileUpload.chooseMany': 'Anhänge hinzufügen',
};

/** Merges the wording into the dictionaries of the library when the application starts. */
export function provideCompanyTexts(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(GrdI18n);
    i18n.extend('en', COMPANY_EN);
    i18n.extend('de', COMPANY_DE);
  });
}
```

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';
import { provideCompanyTexts } from './company-texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language chosen in the header is kept under a key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-133-language' }),
    // The wording of the company over the texts of the library.
    provideCompanyTexts(),
  ],
};
```

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
} from '@gridify/studio';
import { Report } from './report';
import { TextFinder } from './text-finder';

/** The documents (empty at the start, so the empty area shows) and the tool that finds texts. */
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
      tabs: [],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'finder', role: 'tool', title: 'Find a text', componentKey: 'finder' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-app-header productName="Reports" preferences="language" />
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine layoutStorageKey="tutorial-133-layout" [defaultLayout]="layout" />
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
  protected readonly layout = LAYOUT;

  constructor() {
    const settings = inject(GrdEngineSettings);
    settings.setAutoSaveLayout(true);
    // A floating window gets the button that puts it back: its tooltip is one of the company's texts.
    settings.setShowDockButton(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('report', Report);
    registry.registerComponent('finder', TextFinder);
  }

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: '&New report',
          run: () =>
            this.engine().openComponentTab({
              title: `Report ${this.engine().documents().length + 1}`,
              role: 'document',
              componentKey: 'report',
            }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => void this.reset() },
      ],
    },
  ];

  /** Asks first: the question has the title and the Cancel button of the company. */
  private async reset(): Promise<void> {
    if (await this.messages.confirm('Reset the layout? The open reports are closed.')) {
      this.engine().resetLayout();
    }
  }
}
```

`src/app/report.ts`:

```ts
import { Component, signal } from '@angular/core';
import { GrdFileUpload, GrdSpinner } from '@gridify/studio';

/** A report with attachments: the upload shows texts of the library, three of them in the company's wording. */
@Component({
  selector: 'app-report',
  imports: [GrdFileUpload, GrdSpinner],
  template: `
    <p>A report of the company. Its attachments:</p>
    <grd-spinner label="Attachments allowed" [(value)]="allowed" [min]="1" [max]="10" />
    <grd-file-upload multiple [maxFiles]="allowed() ?? 1" maxSize="2.5MB" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 420px;
      padding: 0 16px 16px;
    }
  `,
})
export class Report {
  protected readonly allowed = signal<number | null>(3);
}
```

`src/app/text-finder.ts`:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  GRD_I18N,
  GRD_LIB_DE,
  GRD_LIB_EN,
  GRD_LIB_JA,
  GrdDictionary,
  GrdEntry,
  GrdI18n,
  GrdInput,
} from '@gridify/studio';

/** The dictionaries as the library ships them: what a text was before the company changed it. */
const SHIPPED: Record<string, GrdDictionary> = {
  en: GRD_LIB_EN,
  de: GRD_LIB_DE,
  ja: GRD_LIB_JA,
};

/** What an entry says: the text, or the `other` form of plural forms. */
const textOf = (entry: GrdEntry | undefined): string =>
  entry === undefined ? '' : typeof entry === 'string' ? entry : entry.other;

/** A tool that finds the key of a text of the library: type a piece of a text you see on the screen. */
@Component({
  selector: 'app-text-finder',
  imports: [GrdInput],
  template: `
    <grd-input label="A text you see" placeholder="close, report…" [(value)]="query" />
    @for (row of found(); track row.key) {
      <div class="row">
        <code>{{ row.key }}</code>
        <span>{{ row.text }}</span>
        @if (row.changed) {
          <span class="changed">company</span>
          <span class="was">the library: {{ row.was }}</span>
        }
      </div>
    } @empty {
      <p>Type two letters or more of a text of the library, in the language of the screen.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      font-size: var(--grd-font-size-base);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 8px;
      padding: 4px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
    code {
      flex-basis: 100%;
      font-family: var(--grd-font-mono);
      opacity: 0.88;
    }
    .changed {
      color: var(--grd-link-color, var(--grd-accent));
      font-weight: 600;
    }
    .was {
      flex-basis: 100%;
      opacity: 0.88;
    }
    p {
      margin: 4px 0;
      opacity: 0.88;
    }
  `,
})
export class TextFinder {
  private readonly i18n = inject(GrdI18n);
  protected readonly query = signal('');

  /** The keys whose text in the language of the screen (or whose key) has what is typed. */
  protected readonly found = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (query.length < 2) return [];
    // A new dictionary or another language: the snapshot is taken again.
    this.i18n.revision();
    const language = this.i18n.language();
    const now = GRD_I18N.dictionariesSnapshot().get(language) ?? {};
    const shipped = SHIPPED[language] ?? {};
    return Object.keys(GRD_LIB_EN)
      .map((key) => ({
        key,
        text: textOf(now[key] ?? GRD_LIB_EN[key]),
        was: textOf(shipped[key]),
        changed: JSON.stringify(now[key]) !== JSON.stringify(shipped[key]),
      }))
      .filter(
        (row) => row.text.toLowerCase().includes(query) || row.key.toLowerCase().includes(query),
      )
      .slice(0, 30);
  });
}
```

`src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### One translator, one dictionary per language

The texts of the library and the texts of an application are looked up by one translator, `GRD_I18N` (the service `GrdI18n` is a view of it). It keeps one dictionary per language, and `register` and `extend` merge entries into it. The library registers `GRD_LIB_EN`, `GRD_LIB_DE` and `GRD_LIB_JA` when it is loaded; every component of the library asks for its texts by key (`tkx('grd.tab.close')`), so an entry under the same key in the same language replaces the text everywhere it is used. There is nothing to configure per component.

A lookup goes along a chain of languages: the language of the screen, its base language (`de` for `de-AT`), then English. So a text the company changed only in English (the title of the question) stays the library's in German, because German has its own entry under that key; in a language that has no entry at all, the English one is shown, the company's English included.

### Which entry wins

Entries are merged in the order they come; the one that comes last wins:

| What                                  | When it comes                                     |
| ------------------------------------- | ------------------------------------------------- |
| The dictionaries of the library       | when `@gridify/studio` is loaded, before anything |
| `extend(language, entries)`           | at once, when it is called                        |
| `register(language, dictionary)`      | at once, when it is called                        |
| `register(language, () => import(…))` | when the dictionary has loaded (on `setLanguage`) |

So an `extend` at the start always wins over the library. A lazy dictionary is the exception: it is merged when it loads, which is after the `extend` of the start. If the lazy dictionary of a language has a key the company changed (a full translation of the library, as in 132, loaded lazily as in 134), its entry wins and the company's text is lost. Then put the company's entries into the loader itself, `register('fr', async () => ({ ...(await import('./fr')).default, ...COMPANY_FR }))`, or call `extend` after `setLanguage` has resolved.

A change shows at once, whenever it comes: every text of the library is a signal of the translator, and the engine writes the texts it drew itself (the `data-grd-i18n` ones) again when a dictionary changes.

### What to keep

- **Placeholders** (`{size}`, `{count}`, `{name}`): the library puts its values there. A placeholder left out is simply not shown; one the library does not know stays as it is written (`{sise}`), which is easy to spot.
- **Plural forms**: an object of forms is chosen by the number in `count`, with the rules of the language (`Intl.PluralRules`). Give the forms your language has: English and German `one` and `other`, Japanese only `other`. A form that is missing falls back to `other`. 135 shows more of it.
- **The access key** (`&`) of an entry of a menu. The menu underlines the letter after it and opens the entry by it.

### Checking the result

In development (`ng serve`) the translator warns once in the console about a text that is missing in the language of the screen. `grdDev.checkLang()` in the console of the browser compares all the languages and lists the keys that one has and another lacks, the plural forms a language needs and the placeholders that differ, the company's entries included.

## What you get without writing any of it

- **A few texts changed by key** wherever the library uses them: the engine, its menus, its floating windows, the message box and the upload.
- **Plural forms and parameters** of the changed texts, with the rules and the number format of the language.
- **The switch of the language** shown at once, also in the parts the engine drew itself, and the choice kept after F5.
- **Every other text** in the words of the library, in English, German and Japanese.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 133 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new override-texts --style=scss --ssr=false --skip-tests
   cd override-texts
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library and its dictionaries).

4. Write `src/styles.scss` as in 015.

5. Write `src/app/company-texts.ts`, `src/app/report.ts`, `src/app/text-finder.ts`, and replace `src/app/app.config.ts` and `src/app/app.ts`, with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
