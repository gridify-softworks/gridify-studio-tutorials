# 135 – Plural forms, numbers and dates in every language

This tutorial shows how to write texts with numbers that are right in every language, and how to write numbers, money and dates the way the language of the user writes them. You will learn how to:

- give a text plural forms (`GrdPluralForms`), chosen by the parameter `count`;
- write the forms each language has, and check them (`grdDev.checkLang()`);
- format numbers, money, percent, dates and a relative time with the browser's `Intl`, following the chosen language;
- sort names by the rules of the language.

"1 file, 2 files, 5 files" is easy in English and German (_1 Datei, 2 Dateien, 5 Dateien_) and wrong in most other languages: Czech, which this tutorial does not offer, says _1 soubor, 2 soubory, 5 souborů_, French says _0 fichier_ and _1,5 fichier_, Japanese has one form for every number. French is a fourth language here, for the texts of this application only. The tutorial closes the series about languages (130–135).

```
npm run tutorial 135
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30135, change the numbers on the left, and switch the language in the header.

Every tutorial runs on an address of its own (this one on http://localhost:30135), so it has a `localStorage` of its own. It still keeps its language under `tutorial-135-language` and its layout under `tutorial-135-layout`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 015, with the header of 125 (only the language select) and two tabs in place of the counter: **Plurals** and **Formats**.

### Step 1: plural forms in a dictionary

A text with a number is written in the code with the placeholder `{count}`, in English: `'{count} files'`. Its entry in a dictionary is not a text but an object of forms, one per plural category of the language. `src/app/texts.ts`:

```ts
export const EN: GrdDictionary = {
  '{count} files': { one: '{count} file', other: '{count} files' },
  'Delete {count} files from {folder}?': {
    one: 'Delete {count} file from {folder}?',
    other: 'Delete {count} files from {folder}?',
  },
  '{count} hours': { one: '{count} hour', other: '{count} hours' },
};
```

English needs a dictionary for these three texts only: every other text of the application is English in the code already, and a text without an entry is shown as it is written. A plural is the exception, because the code has only one form of it.

The categories come from the rules of the language (`Intl.PluralRules`), not from the numbers you think of:

| Language | Categories                                                           |
| -------- | -------------------------------------------------------------------- |
| English  | `one` (1), `other` (0, 2, 1.5 …)                                     |
| German   | `one` (1), `other` (0, 2, 1,5 …)                                     |
| French   | `one` (0, 1 and everything below 2, 1,5), `many` (millions), `other` |
| Japanese | `other` only                                                         |

So German has two forms of every such text, like English, and Japanese has one:

```ts
  '{count} files': { one: '{count} Datei', other: '{count} Dateien' },
```

```ts
  '{count} files': { other: '{count}個のファイル' },
```

A form that is missing falls back to `other`, so a German dictionary without `one` writes _1 Dateien_ instead of _1 Datei_; `grdDev.checkLang()` in the console of `ng serve` lists the forms a language needs for whole numbers and lacks. It tries the numbers from 0 to 1000 and a million, so it does not miss a `one` or a `few`, nor the French `many` of the millions.

### Step 2: four languages of the application

`DE`, `JA` and `FR` in the same file translate every text of the application, the plural ones and the plain ones (`'&File': '&Datei'`). They are registered when the application starts:

```ts
/** Registers the texts of the application when it starts: French is a language of this application only. */
export function provideAppTexts(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(GrdI18n);
    i18n.register('en', EN);
    i18n.register('de', DE);
    i18n.register('ja', JA);
    i18n.register('fr', FR);
  });
}
```

and `src/app/app.config.ts` provides it, with a key of this tutorial for the language:

```ts
    // The language chosen in the header is kept under a key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-135-language' }),
    // The texts of the application in English (plural forms), German, Japanese and French.
    provideAppTexts(),
```

A language registered by the application is a language like the others: the select of the header offers _français_, `<html lang>` becomes `fr`, and the choice is kept after F5. The texts of the library (the menu of a tab, the empty area) have no French and stay English; a whole French translation of them is the subject of 132.

### Step 3: the number in `count`

`tx(text, { count })` picks the form by the number in `count` and puts the number into the text, written the way the language writes numbers (`1,000,000` in English, `1.000.000` in German). In `src/app/plurals.ts`:

```ts
  /** `count` picks the form; no files at all get a text of their own. */
  protected readonly filesText = computed(() => {
    const count = this.files() ?? 0;
    return count === 0 ? tx('No files') : tx('{count} files', { count });
  });
```

- **Zero** is a number like the others: English and German say _0 files_, _0 Dateien_ (`other`), French says _0 fichier_ (`one`). A text of its own for nothing at all (_No files_) is a plain condition in the code; the category `zero` of `GrdPluralForms` is only for the languages whose rules have it (Latvian, Arabic, Welsh).
- **More parameters** go next to `count`. Only `count` picks the form; a text such as the name of a folder is put in as it is, and a translation can move it where its language wants it (_Invoicesから5個のファイルを削除しますか？_):

```ts
  /** Two parameters: the number picks the form, the name of the folder is put in as it is. */
  protected readonly question = computed(() =>
    tx('Delete {count} files from {folder}?', { count: this.files() ?? 0, folder: 'Invoices' }),
  );
```

- **`count` must be a number.** A text in `count` (`'5'`) is shown as it is, and the form is always `other`.

### Step 4: texts that follow the language

`tx()` reads the language, so a `computed` that calls it is made again when the language changes, and so is everything that reads the `computed`. `t()` gives such a signal for a fixed text, for a label or the title of a tab:

```ts
  /** Labels: `t()` gives a signal that follows the language. */
  protected readonly filesLabel = t('Number of files');
```

The titles of the two tabs are `t('Plurals')` and `t('Formats')` in the default layout of `src/app/app.ts`; the tabs have tags, so after F5 the engine links the saved tabs to these signals again. The labels of a menu are plain texts, so the menus are a `computed` that `tx()` makes again in the new language:

```ts
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [{ label: tx('&Reset layout'), run: () => this.engine().resetLayout() }],
    },
  ]);
```

### Step 5: numbers, money, dates and names

The browser formats them, with `Intl` and the language of the screen. `src/app/formats.ts` makes the formatters in a `computed` that reads the language, so they are made once per language and not at every change of the screen:

```ts
  /** The formatters are made again only when the language changes: making one is slow, using it is fast. */
  private readonly format = computed(() => {
    const language = this.i18n.language();
    return {
      number: new Intl.NumberFormat(language),
      money: new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }),
      share: new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }),
      date: new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: 'UTC' }),
      time: new Intl.DateTimeFormat(language, { timeStyle: 'short', timeZone: 'UTC' }),
      relative: new Intl.RelativeTimeFormat(language, { numeric: 'auto' }),
      names: new Intl.Collator(language),
      language,
    };
  });
```

- **Money**: the currency is a fact of the data, not of the language. A price in euros is written `€1,234.50` in English and `1.234,50 €` in German, but it stays euros.
- **Dates and times** are shown in UTC here (`timeZone: 'UTC'`), so the tutorial shows the same time everywhere. An application leaves `timeZone` out and shows the time of the user.
- **A relative time** (_yesterday_, _in 3 hours_) is `Intl.RelativeTimeFormat`; the library has no helper of its own for it.
- **A size of a file** is `grdFormatBytes(bytes, language)` of the library, the one the upload uses (`2.5 MB`, `2,5 MB`).
- **Sorting names** by `Intl.Collator`: German, like English, sorts _Č_ as _C_ and _Š_ as _S_ (_Čapek, Chalupa, Cibulka_); Czech, which this tutorial does not offer, puts _Č_ after _C_ and _Ch_ after _H_. `sort()` without a comparison sorts by the codes of the letters and puts _Č_ and _Š_ after _Z_.

### Step 6: run it

```
npm run tutorial 135
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** On the left _5 files_, _Delete 5 files from Invoices?_ and _1.5 hours_, and a table of the same two texts for 0, 1, 2, 5, 21, 22, 25, 1.5 and 1,000,000. On the right the formats in English: _1,234,567.891_, _€1,234.50_, _25.6%_, _Wednesday, October 28, 2026_, _1:05 PM_, _yesterday_, _in 3 hours_, _2.5 MB_, and the names in two orders.
2. **Count.** Set **Number of files** to 1: _1 file_ and _Delete 1 file from Invoices?_. Set 0: _No files_, the text of its own.
3. **German.** Choose _Deutsch_ in the header. Everything of the application is German: the menu **Datei**, the tabs **Pluralformen** and **Formate**. The table: _1 Datei_, and the form `other` for every other number: _0 Dateien_, _2 Dateien_, _21 Dateien_, _1,5 Dateien_, _1.000.000 Dateien_; the hours _1 Stunde_, _2 Stunden_, _1,5 Stunden_. The formats: _1.234.567,891_, _1.234,50 €_, _25,6 %_, _Mittwoch, 28. Oktober 2026_, _13:05_, _gestern_, _in 3 Stunden_, _2,5 MB_. The names by the language: _Čapek, Chalupa, Cibulka, Hájek, Horák, …_ (Č as C).
4. **Japanese.** Choose _日本語_: one form for every number (_1個のファイル_, _5個のファイル_), the folder at the start of the question (_Invoicesから5個のファイルを削除しますか？_), the date _2026年10月28日水曜日_ and _昨日_.
5. **French.** Choose _français_: _0 fichier_ and _1,5 fichier_ (`one`), _2 fichiers_, _1 000 000 de fichiers_ (`many`), _1,5 heure_; _mercredi 28 octobre 2026_, _hier_, _dans 3 heures_. The menu of a tab and other texts of the library are English: the library has no French (132 adds it).
6. **Press F5.** French, the titles of the tabs and the numbers are back (the numbers are not saved: they start at 5 and 1.5 again).
7. **See it.** In the developer tools, _Application › Local storage › http://localhost:30135_ has `tutorial-135-language` and `tutorial-135-layout`. In the console of `ng serve` (not of a production build), French warns once about every text of the library it shows without a translation: that is the list 132 fills.

## The code

`src/app/texts.ts`:

```ts
import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { GrdDictionary, GrdI18n } from '@gridify/studio';

/**
 * English needs entries only for the plural forms: every other text of the application is written in English in the code,
 * and that text is its own translation.
 */
export const EN: GrdDictionary = {
  '{count} files': { one: '{count} file', other: '{count} files' },
  'Delete {count} files from {folder}?': {
    one: 'Delete {count} file from {folder}?',
    other: 'Delete {count} files from {folder}?',
  },
  '{count} hours': { one: '{count} hour', other: '{count} hours' },
};

/** German: `one` (1), `other` (0, 2 and more, and a number with decimals: 1,5). */
export const DE: GrdDictionary = {
  '&File': '&Datei',
  '&Reset layout': '&Layout zurücksetzen',
  Plurals: 'Pluralformen',
  Formats: 'Formate',
  'Number of files': 'Anzahl der Dateien',
  'Hours worked': 'Gearbeitete Stunden',
  'No files': 'Keine Dateien',
  '{count} files': { one: '{count} Datei', other: '{count} Dateien' },
  'Delete {count} files from {folder}?': {
    one: '{count} Datei aus dem Ordner {folder} löschen?',
    other: '{count} Dateien aus dem Ordner {folder} löschen?',
  },
  '{count} hours': { one: '{count} Stunde', other: '{count} Stunden' },
  'The same texts for other numbers': 'Dieselben Texte für andere Zahlen',
  'A large number': 'Eine große Zahl',
  'Money (euros)': 'Geld (Euro)',
  'A share': 'Ein Anteil',
  Date: 'Datum',
  Time: 'Uhrzeit',
  'A day ago': 'Vor einem Tag',
  'In three hours': 'In drei Stunden',
  'File size': 'Dateigröße',
  'Names by the language': 'Namen nach den Regeln der Sprache',
  'Names by the codes of the letters': 'Namen nach den Zeichencodes',
};
```

`JA` and `FR` follow in the file, with the same keys; then `provideAppTexts()` of step 2.

`src/app/plurals.ts`:

```ts
import { Component, computed, signal } from '@angular/core';
import { GrdSpinner, t, tx } from '@gridify/studio';

/** The numbers of the table: each one picks its form by the rules of the language on the screen. */
const NUMBERS = [0, 1, 2, 5, 21, 22, 25, 1.5, 1000000];

/** Plural forms: the text follows the number and the language. */
@Component({
  selector: 'app-plurals',
  imports: [GrdSpinner],
  template: `
    <div class="fields">
      <grd-spinner [label]="filesLabel()" [(value)]="files" [min]="0" [max]="30" />
      <grd-spinner [label]="hoursLabel()" [(value)]="hours" [min]="0" [max]="12" [step]="0.5" />
    </div>
    <p class="line files">{{ filesText() }}</p>
    <p class="line question">{{ question() }}</p>
    <p class="line hours">{{ hoursText() }}</p>
    <h3>{{ tableTitle() }}</h3>
    <table>
      @for (row of table(); track row.number) {
        <tr>
          <td>{{ row.files }}</td>
          <td>{{ row.hours }}</td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 16px 16px;
      font-size: var(--grd-font-size-base);
    }
    .fields {
      display: flex;
      gap: 16px;
      max-width: 420px;
    }
    .line {
      margin: 8px 0;
      font-size: 1.15em;
    }
    h3 {
      margin: 20px 0 6px;
      font-size: 1em;
    }
    td {
      padding: 2px 24px 2px 0;
    }
  `,
})
export class Plurals {
  protected readonly files = signal<number | null>(5);
  protected readonly hours = signal<number | null>(1.5);

  /** Labels: `t()` gives a signal that follows the language. */
  protected readonly filesLabel = t('Number of files');
  protected readonly hoursLabel = t('Hours worked');
  protected readonly tableTitle = t('The same texts for other numbers');

  /** `count` picks the form; no files at all get a text of their own. */
  protected readonly filesText = computed(() => {
    const count = this.files() ?? 0;
    return count === 0 ? tx('No files') : tx('{count} files', { count });
  });

  /** Two parameters: the number picks the form, the name of the folder is put in as it is. */
  protected readonly question = computed(() =>
    tx('Delete {count} files from {folder}?', { count: this.files() ?? 0, folder: 'Invoices' }),
  );

  /** A number with decimals: `1.5` in English, `1,5` in German and French, and the form for it. */
  protected readonly hoursText = computed(() => tx('{count} hours', { count: this.hours() ?? 0 }));

  /** `tx()` reads the language, so every `computed` that calls it is made again when the language changes. */
  protected readonly table = computed(() =>
    NUMBERS.map((count) => ({
      number: count,
      files: tx('{count} files', { count }),
      hours: tx('{count} hours', { count }),
    })),
  );
}
```

`src/app/formats.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { GrdI18n, grdFormatBytes, tx } from '@gridify/studio';

const AMOUNT = 1234567.891;
/** The currency is a fact of the data, not of the language: a price in euros stays in euros in every language. */
const PRICE = 1234.5;
const SHARE = 0.256;
/** 28 October 2026, 13:05 in UTC: shown in UTC, so the tutorial shows the same time everywhere. */
const WHEN = new Date(Date.UTC(2026, 9, 28, 13, 5));
const SIZE = 2.5 * 1024 * 1024;
const NAMES = ['Zelený', 'Šimek', 'Svoboda', 'Chalupa', 'Čapek', 'Cibulka', 'Horák', 'Hájek'];

/** Numbers, money, dates, a relative time, a size and an order of names, written the way the language on the screen writes them. */
@Component({
  selector: 'app-formats',
  template: `
    <table>
      @for (row of rows(); track $index) {
        <tr>
          <th>{{ row.label }}</th>
          <td>{{ row.value }}</td>
        </tr>
      }
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
      font-size: var(--grd-font-size-base);
    }
    th {
      padding: 4px 16px 4px 0;
      font-weight: 600;
      text-align: start;
      vertical-align: top;
      white-space: nowrap;
    }
    td {
      padding: 4px 0;
    }
  `,
})
export class Formats {
  private readonly i18n = inject(GrdI18n);

  /** The formatters are made again only when the language changes: making one is slow, using it is fast. */
  private readonly format = computed(() => {
    const language = this.i18n.language();
    return {
      number: new Intl.NumberFormat(language),
      money: new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR' }),
      share: new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }),
      date: new Intl.DateTimeFormat(language, { dateStyle: 'full', timeZone: 'UTC' }),
      time: new Intl.DateTimeFormat(language, { timeStyle: 'short', timeZone: 'UTC' }),
      relative: new Intl.RelativeTimeFormat(language, { numeric: 'auto' }),
      names: new Intl.Collator(language),
      language,
    };
  });

  protected readonly rows = computed(() => {
    const format = this.format();
    return [
      { label: tx('A large number'), value: format.number.format(AMOUNT) },
      { label: tx('Money (euros)'), value: format.money.format(PRICE) },
      { label: tx('A share'), value: format.share.format(SHARE) },
      { label: tx('Date'), value: format.date.format(WHEN) },
      { label: tx('Time'), value: format.time.format(WHEN) },
      { label: tx('A day ago'), value: format.relative.format(-1, 'day') },
      { label: tx('In three hours'), value: format.relative.format(3, 'hour') },
      { label: tx('File size'), value: grdFormatBytes(SIZE, format.language) },
      {
        label: tx('Names by the language'),
        value: [...NAMES].sort(format.names.compare).join(', '),
      },
      // `sort()` without a comparison puts the codes of the letters in order: Č and Š after Z.
      { label: tx('Names by the codes of the letters'), value: [...NAMES].sort().join(', ') },
    ];
  });
}
```

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
  t,
  tx,
} from '@gridify/studio';
import { Formats } from './formats';
import { Plurals } from './plurals';

/** The plural forms on the left, the formats on the right. The titles are signals of `t()`, found again by their tags after F5. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 55,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'plurals', role: 'document', title: t('Plurals'), componentKey: 'plurals' }],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 45,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'formats', role: 'tool', title: t('Formats'), componentKey: 'formats' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-app-header productName="Plurals and formats" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-135-layout" [defaultLayout]="layout" />
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
  protected readonly layout = LAYOUT;

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('plurals', Plurals);
    registry.registerComponent('formats', Formats);
  }

  /** A menu label is a plain text, so the menus are a `computed` that `tx()` makes again in the new language. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: tx('&File'),
      items: [{ label: tx('&Reset layout'), run: () => this.engine().resetLayout() }],
    },
  ]);
}
```

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';
import { provideAppTexts } from './texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language chosen in the header is kept under a key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-135-language' }),
    // The texts of the application in English (plural forms), German, Japanese and French.
    provideAppTexts(),
  ],
};
```

`src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### How a plural text is looked up

`tx('{count} files', { count: 5 })` looks for the key `{count} files` in the dictionary of the language of the screen, then of its base language (`de` for `de-AT`), then of English, and takes the first entry it finds. When the entry is an object of forms, the category of the number is chosen by the rules of the language **the entry came from** (`Intl.PluralRules`), and the form of that category is taken, or `other` when the entry has none. Then the placeholders are filled; a number in the format of the language **of the screen**, so _1,5_ in French even when the text itself had to fall back to English.

A text without an entry anywhere is the English text of the code, without plural forms: that is why English, the language of the code, needs entries for the plural texts.

### Forms are not numbers

The names of the categories are not "zero, one, two, many" in the everyday sense:

- `one` is not always 1: in French it is 0 and 1 and everything below 2 (_0 fichier_, _1,5 fichier_).
- `few` in Czech (a language this tutorial does not offer) is 2, 3 and 4, but not 22: Czech looks at the whole number, so 21, 22 and 25 are all `other` (_22 souborů_).
- `many` in French is a million and more (_1 000 000 de fichiers_); in Czech it is a number with decimals (_1,5 souboru_).
- Japanese has only `other`, so its entries have one form.

Write the forms each language has, and check them with `grdDev.checkLang()` in the console of `ng serve`: it reports the forms a language needs for whole numbers and lacks (it tries the numbers from 0 to 1000 and a million, so the `many` of the French millions is asked for too), and placeholders that differ from the English text.

### Formats come from the browser

`Intl` knows how every language writes numbers, money, dates and times, and how it sorts. It needs the language (`i18n.language()`) and the options, and gives the text. Making a formatter is slow, so keep one per language and options, as the `computed` of `formats.ts` does; `toLocaleString(language)` on every number of a long list may make one for every call.

The formats of the library itself follow the same language: `grdFormatBytes` (`2.5 MB`, `2,5 MB`) and the number in a spinner (_1,5_ in the field of **Hours worked** in German and French).

### French without the library

The language select offers every language that has a dictionary, so `register('fr', FR)` is enough to add French. The library looks up its own texts in French too, finds none and shows English; in `ng serve` it warns once per text. That is the right result for an application that translates only its own texts, and a reason to translate the library as well: 132 does it, with a whole French dictionary of the library.

## What you get without writing any of it

- **Plural forms** chosen by the rules of each language, with the right form for decimals and large numbers, and a fallback to `other`.
- **Numbers inside texts** written the way the language writes them.
- **Every text a signal**: `t()`, `tx()` in a `computed`, the titles of tabs and the labels of menus follow the language without a reload, and the engine finds the titles of saved tabs again by their tags.
- **A language of the application only** (French) offered by the header, kept after F5 and set on `<html lang>`.
- **A check of the dictionaries** in development (`grdDev.checkLang()`).

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 135 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new plurals-and-formats --style=scss --ssr=false --skip-tests
   cd plurals-and-formats
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015.

5. Write `src/app/texts.ts`, `src/app/plurals.ts`, `src/app/formats.ts`, and replace `src/app/app.config.ts` and `src/app/app.ts`, with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
