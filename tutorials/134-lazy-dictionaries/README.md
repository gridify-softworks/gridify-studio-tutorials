# 134 – Lazy dictionaries

This tutorial shows how to load a dictionary only when its language is needed, so that the users who never choose it do not download it. You will learn how to:

- register a dictionary as a loader (`register(language, () => import(…))`), so that it becomes a chunk of its own;
- see what the user sees while a dictionary loads;
- handle a dictionary that does not come;
- bring a remembered language back after a reload when its dictionary is a loader;
- check all the dictionaries when some of them have not been loaded yet (`loadAll()`).

In 132 the French dictionary was a part of the first load. Here French (of the library and of the application) and the German of the application are loaders, and a pretend network (the **Network** menu) makes them slow or lets them fail. The tutorial is from the series about languages (130–135).

```
npm run tutorial 134
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30134, open the developer tools on the _Network_ tab, and choose _français_ in the header.

Every tutorial runs on an address of its own (this one on http://localhost:30134), so it has a `localStorage` of its own. It still keeps its language under `tutorial-134-language`, its layout under `tutorial-134-layout` and the pretend network of the Network menu under `tutorial-134-network`, as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

The application of 132 without the tool that checks French: two documents, Notes and Counter, a header with a theme and a language select, a menu bar and a status bar. The French dictionary of the library is the one of 132; the texts of the application are new, because the menus and the status bar are (the whole dictionaries are in The code).

### Step 1: one module per language

`src/app/i18n/fr.ts` has everything French: the texts of the library (`fr-library.ts`, the file of 132) and the texts of the application. It exports the dictionary as its default export:

```ts
import type { GrdDictionary } from '@gridify/studio';
import { GRD_LIB_FR } from './fr-library';

/**
 * Everything French in one module: the texts of the library and the texts of the application.
 * Nothing but `app.config.ts` imports it, and only by `import()`, so it is a chunk of its own.
 */
const FR: GrdDictionary = {
  ...GRD_LIB_FR,
  'app.menu.file': '&Fichier',
  'app.menu.addCounter': 'Ajouter un &compteur',
  'app.menu.reset': '&Réinitialiser la disposition',
```

`src/app/i18n/de.ts` has the German texts of the application (the library has its German built in) and is made the same way:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in German. The library has its German built in; this module adds
 * the application's, and it is loaded by `import()` the first time German is chosen.
 */
const DE: GrdDictionary = {
  'app.menu.file': '&Datei',
  'app.menu.addCounter': '&Zähler hinzufügen',
  'app.menu.reset': '&Layout zurücksetzen',
```

Only English stays a part of the first load: `src/app/i18n/app-en.ts`, a ready dictionary as in 132, with the keys of this application.

### Step 2: a pretend network

To see a dictionary load, the loader can wait or fail. `src/app/network.ts`:

```ts
/**
 * A loader of a dictionary for `register(language, loader)`. The `import()` is real: the bundler
 * makes the module a chunk of its own, and the browser fetches it the first time the loader runs.
 * The pretend network only waits before it (slow) or fails instead of it (offline).
 */
export function overNetwork(
  language: string,
  load: () => Promise<{ default: GrdDictionary }>,
): () => Promise<{ default: GrdDictionary }> {
  return async () => {
    if (network() === 'slow') await new Promise((resolve) => setTimeout(resolve, 3000));
    if (network() === 'offline')
      throw new Error(`No network: the dictionary "${language}" did not come.`);
    const module = await load();
    fetched.update((list) => [...list, language]);
    return module;
  };
}
```

**Network › Slow (3 seconds)** makes it wait before the `import()`, **Network › Offline** makes it fail instead. The choice of the network is kept in `localStorage`, so F5 starts on the same network.

### Step 3: registering loaders

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
import { overNetwork } from './network';

/** The modules of the dictionaries: each `import()` makes the bundler put one in a chunk of its own. */
const french = () => import('./i18n/fr');
const german = () => import('./i18n/de');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under this key.
    provideGrdLanguage({ storageKey: 'tutorial-134-language' }),
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      // English is the language of the start: a ready dictionary.
      i18n.register('en', APP_EN);
      // French and the German of the application: loaders, run when the language is chosen (or at
      // the start, when it is the remembered one).
      i18n.register('fr', overNetwork('fr', french));
      i18n.register('de', overNetwork('de', german));
    }),
  ],
};
```

`register(language, loader)` takes a function that returns a promise of a dictionary, or of a module whose default export is one, as `import()` does. Nothing is loaded by the registration: the loader runs the first time the language is chosen. The language select offers the language at once (it has a dictionary, only not loaded yet).

### Step 4: the blocker while a dictionary loads

```html
<!-- covers the page while a dictionary loads (after 150 ms, so a fast load shows nothing) -->
<grd-language-busy />
```

A switch to a language whose dictionary is not there yet waits for it: the language on the screen stays as it was, so the user never sees half of the screen translated. `<grd-language-busy />` (once, in the root template) covers the page while the dictionary loads, with _Changing the language to français…_ in the language on the screen. It appears only after 150 ms, so a fast load shows nothing. `GrdI18n.loadingLanguage()` says which language is loading; the status bar shows it too:

```ts
      {
        id: 'loading',
        text: this.i18n.keyed('app.status.loading', { name: loading ? name(loading) : '' }),
        busy: true,
        visible: loading !== null,
      },
```

### Step 5: a dictionary that does not come

When the loader fails, `setLanguage` rejects and the language stays. The language select of the library puts its value back and says why with the output `switchFailed`. The header of the application has no such output, so the selects are put into the header by hand: `preferences="false"` draws none of its own, and a `grd-preference-select` goes into its end slot:

<!-- prettier-ignore -->
```html
    <!-- the selects of the theme and the language, put in by hand to hear a switch that failed -->
    <grd-app-header productName="Lazy dictionaries" preferences="false">
      <grd-preference-select
        grdAppHeaderEnd
        kinds="theme language"
        (switchFailed)="failed($event)"
      />
    </grd-app-header>
```

```ts
  /** A switch of the select failed (the dictionary did not come): the select is back on the old language. */
  protected failed(failure: GrdPreferenceFailure): void {
    const name = this.i18n.languageName(failure.value);
    this.toast.warning(this.i18n.keyed('app.failed', { name }), { detail: String(failure.error) });
  }
```

The library keeps the loader of a dictionary that failed, so the next switch to that language tries again.

### Step 6: checking every dictionary

A check of the dictionaries needs all of them. `loadAll()` runs every loader that has not run yet, and fails when one of them fails:

```ts
  /** The check needs every dictionary: `loadAll()` fetches the ones that have not come yet. */
  private async checkAll(): Promise<void> {
    const title = this.i18n.keyed('app.check.title');
    try {
      await this.i18n.loadAll();
    } catch {
      this.messages.warning(this.i18n.keyed('app.check.failed'), { title });
      return;
    }
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    const count = (language: string) =>
      issues.filter((issue) => issue.language === language).length;
    const result = { fr: count('fr'), de: count('de'), ja: count('ja') };
    this.messages.info(this.i18n.keyed('app.check.result', result), { title });
  }
```

`grdDev.checkLang()` of dev mode does the same: it calls `loadAll()` first.

### Step 7: run it

```
npm run tutorial 134
```

Your own application, made by these steps, runs with `ng serve` in its folder, on http://localhost:4200.

## Try it

1. **The start.** In the developer tools, _Network_, filter _JS_ and press F5: `main.js`, and no dictionary. The status bar says _Language: English_ and _No dictionary fetched yet_. The language select offers _English_, _Deutsch_, _日本語_ and _français_.
2. **A slow network.** Choose **Network › Slow (3 seconds)**, then _français_. For 3 seconds the page stays English and is covered by _Changing the language to français…_, and the status bar says _Loading français…_. Then the page is French, and the _Network_ tab has one more file, a `chunk-….js` of about 40 kB (in a production build; the name has a hash): the French dictionary. The status bar says _Chargés : fr_.
3. **Once is enough.** Choose _English_, then _français_ again: both switch at once, and nothing is fetched. English is a part of the first load, and French has come already.
4. **No network.** Choose **Réseau › Hors ligne**, then _Deutsch_. The dictionary does not come: the page stays French, the select is back on _français_, and a toast says _Le dictionnaire de la langue Deutsch n’a pas pu être chargé. La langue reste inchangée._ (_Détails_ has the error).
5. **The network again.** Choose **Réseau › Rapide**, then _Deutsch_: now it comes (one more `chunk-….js`: the German texts of the application), and the application speaks German: **Datei**, **Netzwerk**, **Prüfen**, the tabs _Notizen_ and _Zähler_.
6. **The check.** Choose **Prüfen › Alle Wörterbücher laden und prüfen**: _Probleme: Französisch 0, Deutsch 0, Japanisch 26._ French and German have every text. Japanese has the library, but none of the 26 texts of the application.
7. **F5 on a slow network.** Choose _français_ and **Réseau › Lent**, and press F5. The page starts in English, covered by _Changing the language to français…_, and 3 seconds later it is French: the remembered language needs its dictionary first.
8. **F5 with no network.** Choose **Réseau › Hors ligne** and press F5. The page stays English, and the console says `[grd-i18n] Failed to load the dictionaries of "fr".` French is still the remembered language (`tutorial-134-language` is `fr`). **Check › Load every dictionary and check** says _Not every dictionary could be loaded, so nothing was checked._
9. **Back.** Choose **Network › Fast** and press F5: French again.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GRD_I18N,
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdLanguageBusy,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdPreferenceFailure,
  GrdPreferenceSelect,
  GrdStatusBar,
  GrdStatusItem,
  GrdToast,
  grdCheckDictionaries,
  tk,
} from '@gridify/studio';
import { Counter } from './counter';
import { fetched, network, Network, setNetwork } from './network';

/** Two documents whose titles and HTML are signals of keys: they follow the language. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 100,
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
  ],
};

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdPreferenceSelect,
    GrdMenuBar,
    GrdDockingEngine,
    GrdStatusBar,
    GrdLanguageBusy,
  ],
  template: `
    <!-- the selects of the theme and the language, put in by hand to hear a switch that failed -->
    <grd-app-header productName="Lazy dictionaries" preferences="false">
      <grd-preference-select
        grdAppHeaderEnd
        kinds="theme language"
        (switchFailed)="failed($event)"
      />
    </grd-app-header>
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine layoutStorageKey="tutorial-134-layout" [defaultLayout]="layout" />
    <grd-status-bar [items]="status()" />
    <!-- covers the page while a dictionary loads (after 150 ms, so a fast load shows nothing) -->
    <grd-language-busy />
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
  private readonly toast = inject(GrdToast);
  private readonly messages = inject(GrdMessageBox);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  protected readonly menus = computed<GrdMenu[]>(() => {
    const text = (key: string) => this.i18n.keyed(key);
    const choice = (label: string, value: Network) => ({
      label: text(label),
      checked: network() === value,
      run: () => setNetwork(value),
    });
    return [
      {
        id: 'file',
        label: text('app.menu.file'),
        items: [
          { label: text('app.menu.addCounter'), run: () => this.addCounter() },
          { separator: true },
          { label: text('app.menu.reset'), run: () => this.engine().resetLayout() },
        ],
      },
      {
        id: 'network',
        label: text('app.menu.network'),
        items: [
          choice('app.menu.fast', 'fast'),
          choice('app.menu.slow', 'slow'),
          choice('app.menu.offline', 'offline'),
        ],
      },
      {
        id: 'check',
        label: text('app.menu.check'),
        items: [{ label: text('app.menu.checkAll'), run: () => this.checkAll() }],
      },
    ];
  });

  /** The language, the one that is loading (`loadingLanguage`), what has come, and the network. */
  protected readonly status = computed<GrdStatusItem[]>(() => {
    const name = (code: string) => this.i18n.languageName(code);
    const loading = this.i18n.loadingLanguage();
    const came = fetched();
    return [
      {
        id: 'language',
        text: this.i18n.keyed('app.status.language', { name: name(this.i18n.language()) }),
      },
      {
        id: 'loading',
        text: this.i18n.keyed('app.status.loading', { name: loading ? name(loading) : '' }),
        busy: true,
        visible: loading !== null,
      },
      {
        id: 'fetched',
        align: 'end',
        text: came.length
          ? this.i18n.keyed('app.status.fetched', { languages: came.join(', ') })
          : this.i18n.keyed('app.status.nothingFetched'),
      },
      {
        id: 'network',
        align: 'end',
        text: this.i18n.keyed('app.status.network', {
          network: this.i18n.keyed(`app.network.${network()}`),
        }),
      },
    ];
  });

  /** A switch of the select failed (the dictionary did not come): the select is back on the old language. */
  protected failed(failure: GrdPreferenceFailure): void {
    const name = this.i18n.languageName(failure.value);
    this.toast.warning(this.i18n.keyed('app.failed', { name }), { detail: String(failure.error) });
  }

  private addCounter(): void {
    this.engine().openComponentTab({
      tag: 'counter',
      title: tk('app.tab.counter'),
      componentKey: 'counter',
    });
  }

  /** The check needs every dictionary: `loadAll()` fetches the ones that have not come yet. */
  private async checkAll(): Promise<void> {
    const title = this.i18n.keyed('app.check.title');
    try {
      await this.i18n.loadAll();
    } catch {
      this.messages.warning(this.i18n.keyed('app.check.failed'), { title });
      return;
    }
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    const count = (language: string) =>
      issues.filter((issue) => issue.language === language).length;
    const result = { fr: count('fr'), de: count('de'), ja: count('ja') };
    this.messages.info(this.i18n.keyed('app.check.result', result), { title });
  }
}
```

`src/app/network.ts`:

```ts
import { signal } from '@angular/core';
import type { GrdDictionary } from '@gridify/studio';

/** How the pretend network brings a dictionary: at once, after 3 seconds, or not at all. */
export type Network = 'fast' | 'slow' | 'offline';

/** Where the choice of the network is kept, so that F5 starts on the same network. */
const NETWORK_KEY = 'tutorial-134-network';

/** The network the dictionaries come over now (the Network menu changes it). */
export const network = signal<Network>(readNetwork());

/** The languages whose dictionary has arrived, in the order they came (the status bar shows them). */
export const fetched = signal<readonly string[]>([]);

export function setNetwork(value: Network): void {
  network.set(value);
  try {
    localStorage.setItem(NETWORK_KEY, value);
  } catch {
    // A blocked storage: the network is not remembered.
  }
}

/**
 * A loader of a dictionary for `register(language, loader)`. The `import()` is real: the bundler
 * makes the module a chunk of its own, and the browser fetches it the first time the loader runs.
 * The pretend network only waits before it (slow) or fails instead of it (offline).
 */
export function overNetwork(
  language: string,
  load: () => Promise<{ default: GrdDictionary }>,
): () => Promise<{ default: GrdDictionary }> {
  return async () => {
    if (network() === 'slow') await new Promise((resolve) => setTimeout(resolve, 3000));
    if (network() === 'offline')
      throw new Error(`No network: the dictionary "${language}" did not come.`);
    const module = await load();
    fetched.update((list) => [...list, language]);
    return module;
  };
}

function readNetwork(): Network {
  try {
    const value = localStorage.getItem(NETWORK_KEY);
    return value === 'slow' || value === 'offline' ? value : 'fast';
  } catch {
    return 'fast';
  }
}
```

`src/app/i18n/app-en.ts`:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in English, under keys of its own (`app.*`). English is the
 * language of the start, so it is a part of the first load; the other languages are not.
 */
export const APP_EN: GrdDictionary = {
  'app.menu.file': '&File',
  'app.menu.addCounter': 'Add a &counter',
  'app.menu.reset': '&Reset layout',
  'app.menu.network': '&Network',
  'app.menu.fast': '&Fast',
  'app.menu.slow': '&Slow (3 seconds)',
  'app.menu.offline': '&Offline',
  'app.menu.check': '&Check',
  'app.menu.checkAll': '&Load every dictionary and check',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Counter',
  'app.notes.html':
    '<p>Choose <b>français</b> or <b>Deutsch</b> in the header: the dictionary of the language is fetched now, the first time it is needed.</p>',
  'app.counter.intro': 'An Angular component with a signal.',
  'app.counter.clicked': { one: 'Clicked {count} time', other: 'Clicked {count} times' },
  'app.status.language': 'Language: {name}',
  'app.status.loading': 'Loading {name}…',
  'app.status.fetched': 'Fetched: {languages}',
  'app.status.nothingFetched': 'No dictionary fetched yet',
  'app.status.network': 'Network: {network}',
  'app.network.fast': 'fast',
  'app.network.slow': 'slow',
  'app.network.offline': 'offline',
  'app.failed': 'The dictionary of {name} could not be loaded. The language stays as it was.',
  'app.check.title': 'The dictionaries',
  'app.check.result': 'Problems: French {fr}, German {de}, Japanese {ja}.',
  'app.check.failed': 'Not every dictionary could be loaded, so nothing was checked.',
};
```

`src/app/i18n/fr.ts`:

```ts
import type { GrdDictionary } from '@gridify/studio';
import { GRD_LIB_FR } from './fr-library';

/**
 * Everything French in one module: the texts of the library and the texts of the application.
 * Nothing but `app.config.ts` imports it, and only by `import()`, so it is a chunk of its own.
 */
const FR: GrdDictionary = {
  ...GRD_LIB_FR,
  'app.menu.file': '&Fichier',
  'app.menu.addCounter': 'Ajouter un &compteur',
  'app.menu.reset': '&Réinitialiser la disposition',
  'app.menu.network': '&Réseau',
  'app.menu.fast': '&Rapide',
  'app.menu.slow': '&Lent (3 secondes)',
  'app.menu.offline': '&Hors ligne',
  'app.menu.check': '&Vérifier',
  'app.menu.checkAll': '&Charger tous les dictionnaires et vérifier',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Compteur',
  'app.notes.html':
    '<p>Choisissez <b>English</b> ou <b>Deutsch</b> dans l’en-tête : le dictionnaire de la langue est chargé la première fois qu’il est nécessaire.</p>',
  'app.counter.intro': 'Un composant Angular avec un signal.',
  'app.counter.clicked': { one: '{count} clic', other: '{count} clics' },
  'app.status.language': 'Langue : {name}',
  'app.status.loading': 'Chargement de {name}…',
  'app.status.fetched': 'Chargés : {languages}',
  'app.status.nothingFetched': 'Aucun dictionnaire chargé pour l’instant',
  'app.status.network': 'Réseau : {network}',
  'app.network.fast': 'rapide',
  'app.network.slow': 'lent',
  'app.network.offline': 'hors ligne',
  'app.failed':
    'Le dictionnaire de la langue {name} n’a pas pu être chargé. La langue reste inchangée.',
  'app.check.title': 'Les dictionnaires',
  'app.check.result': 'Problèmes : français {fr}, allemand {de}, japonais {ja}.',
  'app.check.failed':
    'Tous les dictionnaires n’ont pas pu être chargés, rien n’a donc été vérifié.',
};

export default FR;
```

`src/app/i18n/de.ts`:

```ts
import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in German. The library has its German built in; this module adds
 * the application's, and it is loaded by `import()` the first time German is chosen.
 */
const DE: GrdDictionary = {
  'app.menu.file': '&Datei',
  'app.menu.addCounter': '&Zähler hinzufügen',
  'app.menu.reset': '&Layout zurücksetzen',
  'app.menu.network': '&Netzwerk',
  'app.menu.fast': '&Schnell',
  'app.menu.slow': '&Langsam (3 Sekunden)',
  'app.menu.offline': '&Offline',
  'app.menu.check': '&Prüfen',
  'app.menu.checkAll': '&Alle Wörterbücher laden und prüfen',
  'app.tab.notes': 'Notizen',
  'app.tab.counter': 'Zähler',
  'app.notes.html':
    '<p>Wählen Sie in der Kopfzeile <b>English</b> oder <b>français</b>: Das Wörterbuch der Sprache wird erst heruntergeladen, wenn es zum ersten Mal gebraucht wird.</p>',
  'app.counter.intro': 'Eine Angular-Komponente mit einem Signal.',
  'app.counter.clicked': { one: '{count} Klick', other: '{count} Klicks' },
  'app.status.language': 'Sprache: {name}',
  'app.status.loading': '{name} wird geladen…',
  'app.status.fetched': 'Heruntergeladen: {languages}',
  'app.status.nothingFetched': 'Noch kein Wörterbuch heruntergeladen',
  'app.status.network': 'Netzwerk: {network}',
  'app.network.fast': 'schnell',
  'app.network.slow': 'langsam',
  'app.network.offline': 'offline',
  'app.failed':
    'Das Wörterbuch der Sprache {name} konnte nicht geladen werden. Die Sprache bleibt unverändert.',
  'app.check.title': 'Wörterbücher',
  'app.check.result': 'Probleme: Französisch {fr}, Deutsch {de}, Japanisch {ja}.',
  'app.check.failed': 'Nicht alle Wörterbücher konnten geladen werden, daher wurde nichts geprüft.',
};

export default DE;
```

`src/app/app.config.ts` is in step 3. `src/app/i18n/fr-library.ts` is the file of 132, and `src/app/counter.ts` the counter of 132. `src/styles.scss` and `src/main.ts` are the ones of 015.

## How it fits together

### What is in the first load

| Texts                                     | Where                           | Loaded                          |
| ----------------------------------------- | ------------------------------- | ------------------------------- |
| The library in English, German, Japanese  | built into the library          | with the first load             |
| The application in English                | `app-en.ts`, a ready dictionary | with the first load             |
| The library and the application in French | `fr.ts`, a loader               | the first time French is needed |
| The application in German                 | `de.ts`, a loader               | the first time German is needed |

A module that only an `import()` names is a chunk of its own. `fr.ts` imports `fr-library.ts`, so the dictionary of the library goes into the same chunk. A module that the first load imports as well (here `app-en.ts`) would stay in the first load.

### When a loader runs

- **A switch** (`setLanguage`, the select): the loaders of the language and of its base language run first (for `fr-CA` also those of `fr`), and the language changes when they have finished.
- **The start**: the remembered language is applied as soon as a dictionary of it is registered, so its loader runs from the environment initializer, before the first screen. Until it has finished the page is in English.
- **`loadAll()`**: every loader that has not run.

A loader runs once: its dictionary stays. A loader that failed is kept and runs again at the next switch. Two quick switches never mix: the later one wins, and a dictionary that comes for the earlier one is kept for later.

### The start

A remembered language whose dictionary is a loader shows the page in English first, with the blocker over it. An application that would rather show nothing than English can wait for the language before its first screen: an app initializer (`provideAppInitializer`) that reads `loadingLanguage()` and, while a language is loading (the value is not `null`), returns the promise of `setLanguage` for that language (and catches its failure, so that the application starts in English when the dictionary does not come). The load itself is the same.

When the dictionary of the remembered language does not come at the start, the library writes an error into the console and the page stays English; the language stays remembered, and the next start tries again.

### A real network

The pretend network fails before the `import()`, so trying again works. A chunk that really did not come is different: a browser keeps a failed `import()` for the life of the page, and asking again gets the same error without a request. Only a reload of the page fetches it again. A real application that loads its dictionaries lazily should therefore offer to reload the page when a dictionary does not come.

## What you get without writing any of it

- **Loaders run when needed**: at a switch, at the start for the remembered language, and by `loadAll()`; once each, and again after a failure.
- **No half-translated screen**: a switch waits for the dictionaries of the language, of its base language and of English.
- **The blocker**, `<grd-language-busy />`: only for a load that takes longer than 150 ms, it takes the keyboard while it is shown, and it gives up after 30 s.
- **`loadingLanguage()`** for a status of your own.
- **The language select** that goes back to the language in use and tells why (`switchFailed`).

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 134 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new lazy-dictionaries --style=scss --ssr=false --skip-tests
   cd lazy-dictionaries
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library and its dictionaries).

4. Write `src/styles.scss` as in 015, and `src/app/counter.ts` and `src/app/i18n/fr-library.ts` as in 132.

5. Write `src/app/i18n/app-en.ts`, `src/app/i18n/fr.ts`, `src/app/i18n/de.ts` and `src/app/network.ts`, and replace `src/app/app.config.ts` and `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
