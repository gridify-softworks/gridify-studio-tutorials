# 115 – HTML from a callback

This tutorial shows how to save only a key and a few parameters of an HTML tab, and get its HTML from the backend again after every reload. You will learn how to:

- save a tab as a key and parameters instead of its HTML (`serialize: 'callback'`);
- register the function that gets the HTML for the key (`GrdContentRegistry.registerHtml`), at startup;
- show a spinner or a text of your own while the HTML loads;
- show an error box with **Try again** while the backend is down;
- stop a request when its tab is closed (`AbortSignal`).

The backend is a pretend one that answers after two seconds and can be switched off. It is the application of 015 with a few lines more, from the series about saving (110–125); the dialog of 114 shows what is saved.

```
npm run tutorial 115
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30115, open a report (**File › Open report 1**), wait for it, and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30115), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-115-layout`), as an application should: everything that runs on one address shares one `localStorage`. The pretend backend of this one keeps its switch under `tutorial-115-backend-down`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository). The counter of 015 is not needed here.

### Step 1: a key of its own

As in 114: a constant, a field of `App` and a binding in the template.

```ts
/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-115-layout';
```

```html
<grd-docking-engine [layoutStorageKey]="layoutKey" />
```

### Step 2: a slow backend

`src/app/backend.ts` is a service that stands for a server. Its method `report` gives the HTML of a report two seconds later. It fails when the backend is down, and it stops when the signal it is given is aborted:

```ts
report(id: number, signal: AbortSignal): Promise<string> {
  this.write(`report ${id}: asked for`, 'info');
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      this.write(`report ${id}: cancelled, the tab was closed`, 'warning');
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel);
      if (this.down()) {
        this.write(`report ${id}: failed, the backend is down`, 'error');
        reject(new Error('The backend is down (503).'));
        return;
      }
      this.write(`report ${id}: sent`, 'ok');
      const report = REPORTS[id] ?? { title: 'Unknown report', text: 'There is no such report.' };
      resolve(
        `<h3>Report ${id}: ${report.title}</h3><p>${report.text}</p><p><i>Loaded from the backend at ${now()}.</i></p>`,
      );
    }, DELAY_MS);
    signal.addEventListener('abort', cancel, { once: true });
  });
}
```

With a real server the method would be ``fetch(`/api/reports/${id}`, { signal }).then((response) => response.text())``: `fetch` stops by itself when the signal is aborted. Every request goes into the signal `log` (shown under the engine, step 5), and the switch `down` is kept in `localStorage`, because a real server stays down when you reload your page, too.

### Step 3: register the callback, at startup

```ts
constructor() {
  inject(GrdEngineSettings).setAutoSaveLayout(true);
  // The callback is known by its key before the saved layout comes back: a saved tab names it by the key, with its parameters.
  inject(GrdContentRegistry).registerHtml('report', ({ params, signal }) =>
    this.backend.report(Number(params['id']), signal),
  );
}
```

`App` gets the backend as a field, `protected readonly backend = inject(Backend);`. `registerHtml(key, callback)` puts a function into the registry under a key. The function gets the id of the tab (`tabId`), the saved parameters (`params`) and the `signal`, and returns the HTML, or a `Promise` of it.

### Step 4: a tab whose HTML comes from the callback

```ts
/**
 * A report tab. It has no HTML of its own: `serialize: 'callback'` names the callback `report` of the registry, with the parameters it needs. Only the key
 * and the parameters are saved; after a reload the callback runs again and the HTML comes from the backend again.
 */
private openReport(id: number, placeholder?: string): void {
  this.engine().openHtmlTab({
    title: `Report ${id}`,
    serialize: 'callback',
    callback: { key: 'report', params: { id } },
    placeholder,
  });
}
```

The tab has no `content`. **File › Open report 1** opens it without a placeholder (the engine shows a spinner while the HTML loads), **File › Open report 2 (with a placeholder)** with a text that shows instead of the spinner:

```ts
{ label: 'Open report &1', run: () => this.openReport(1) },
{
  label: 'Open report &2 (with a placeholder)',
  run: () => this.openReport(2, 'Loading report 2 from the backend…'),
},
```

### Step 5: the switch and the log

A menu **Backend** with a check item. The menus are a `computed` now, so the check mark follows the signal `down`; the template binds them as `[menus]="menus()"`:

```ts
{
  id: 'backend',
  label: '&Backend',
  items: [
    {
      label: 'The backend is &down',
      checked: this.backend.down(),
      run: () => this.backend.setDown(!this.backend.down()),
    },
  ],
},
```

Under the engine, the log of the backend, the newest line first:

```html
<section class="log" aria-label="Backend log">
  @for (line of backend.log(); track $index) {
  <div [class]="line.kind">{{ line.time }} {{ line.text }}</div>
  } @empty {
  <div>The log of the backend: every request for a report is written here.</div>
  }
</section>
```

### Step 6: show what is saved

**File › Show what is saved** is the dialog of 114 (its step 4, with the rule `.saved` in `src/styles.scss`).

## Try it

1. **File › Open report 1.** For a moment the tab is empty, then a spinner shows (only after 150 ms, so a quick answer does not flash it), and two seconds later the report: _Loaded from the backend at 10:41:07_. The log under the engine says _report 1: asked for_ and _report 1: sent_.
2. **File › Open report 2 (with a placeholder).** Instead of the spinner, _Loading report 2 from the backend…_ shows at once; then the report.
3. **Press F5.** Both tabs are back. Report 2, the tab that is shown, shows its placeholder again and the log says _report 2: asked for_: the HTML is asked for again. Report 1 is not asked for yet. **Click Report 1**: now it is, and it says a new time. The HTML was not saved; the key and the parameters were.
4. **File › Show what is saved.** The tabs have `"serialize": "callback"` and `"callback": { "key": "report", "params": { "id": 1 } }`, and report 2 has its `"placeholder"`. Neither has `content`.
5. **Backend › The backend is down, then F5.** The check mark is still there after the reload. Two seconds later the tab that is shown says _Failed to load content: The backend is down (503)._ and has a **Try again** button. The log says _failed, the backend is down_, and the console has a warning: `[grd-docking-engine] Failed to load the content of tab "Report 1": Error: The backend is down (503).`
6. **Backend › The backend is down** again (the check mark goes), **then Try again.** The spinner, and the report.
7. **File › Reset layout, File › Open report 1, and close the tab (×) before two seconds pass.** The log says _report 1: cancelled, the tab was closed_, and never _sent_: the engine aborted the signal, so the backend stopped. No error box and nothing in the console: a request stopped by its signal is no error.
8. **F5**: the area is empty.

## The code

`src/app/app.ts`:

```ts
import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDialog,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Backend } from './backend';

/** A key of its own: everything that runs on one address shares one localStorage. */
const LAYOUT_KEY = 'tutorial-115-layout';

/** A text as HTML that shows it as it is (`<` stays `<`). */
const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus()" />
    <grd-docking-engine [layoutStorageKey]="layoutKey" />
    <section class="log" aria-label="Backend log">
      @for (line of backend.log(); track $index) {
        <div [class]="line.kind">{{ line.time }} {{ line.text }}</div>
      } @empty {
        <div>The log of the backend: every request for a report is written here.</div>
      }
    </section>
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
    .log {
      height: 6.5em;
      overflow: auto;
      padding: 4px 12px;
      border-top: 1px solid var(--grd-border-color);
      background: var(--grd-bg-main);
      color: var(--grd-text-main);
      font-family: var(--grd-font-mono);
      font-size: 12px;
      line-height: 1.5;
    }
    .ok {
      color: var(--grd-success-text);
    }
    .warning {
      color: var(--grd-warning-text);
    }
    .error {
      color: var(--grd-danger-text);
    }
  `,
})
export class App {
  protected readonly layoutKey = LAYOUT_KEY;
  protected readonly backend = inject(Backend);
  private readonly engine = viewChild.required(GrdDockingEngine);
  private readonly dialogs = inject(GrdDialog);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The callback is known by its key before the saved layout comes back: a saved tab names it by the key, with its parameters.
    inject(GrdContentRegistry).registerHtml('report', ({ params, signal }) =>
      this.backend.report(Number(params['id']), signal),
    );
  }

  /** The menus: a `computed`, so the check mark of Backend › The backend is down follows the switch. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Open report &1', run: () => this.openReport(1) },
        {
          label: 'Open report &2 (with a placeholder)',
          run: () => this.openReport(2, 'Loading report 2 from the backend…'),
        },
        { separator: true },
        { label: 'Show what is &saved', run: () => this.showSaved() },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
    {
      id: 'backend',
      label: '&Backend',
      items: [
        {
          label: 'The backend is &down',
          checked: this.backend.down(),
          run: () => this.backend.setDown(!this.backend.down()),
        },
      ],
    },
  ]);

  /**
   * A report tab. It has no HTML of its own: `serialize: 'callback'` names the callback `report` of the registry, with the parameters it needs. Only the key
   * and the parameters are saved; after a reload the callback runs again and the HTML comes from the backend again.
   */
  private openReport(id: number, placeholder?: string): void {
    this.engine().openHtmlTab({
      title: `Report ${id}`,
      serialize: 'callback',
      callback: { key: 'report', params: { id } },
      placeholder,
    });
  }

  /** What the engine wrote into localStorage under the key, in a dialog: the saved layout as JSON. */
  private showSaved(): void {
    const saved = localStorage.getItem(LAYOUT_KEY);
    const text = saved ? JSON.stringify(JSON.parse(saved), null, 2) : 'Nothing is saved yet.';
    this.dialogs.open({
      title: `localStorage["${LAYOUT_KEY}"]`,
      html: `<pre class="saved">${escapeHtml(text)}</pre>`,
      width: 720,
      height: 520,
      resizable: true,
      buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
    });
  }
}
```

`src/app/backend.ts`:

```ts
import { Injectable, signal } from '@angular/core';

/** A line of the log of the backend, shown under the engine. */
export interface LogLine {
  time: string;
  text: string;
  kind: 'info' | 'ok' | 'warning' | 'error';
}

/** The switch of the backend is kept here: a real server stays down when you reload your page, too. */
const DOWN_KEY = 'tutorial-115-backend-down';

/** The backend answers after this long, so the loading can be seen (and a tab closed while it loads). */
const DELAY_MS = 2000;

const REPORTS: Record<number, { title: string; text: string }> = {
  1: { title: 'Sales of the week', text: '128 orders, 14,920 EUR.' },
  2: { title: 'Open support tickets', text: '17 open, 3 of them urgent.' },
};

/** The time of the day, `10:41:07`. */
const now = (): string => new Date().toLocaleTimeString('en-GB');

/**
 * A pretend server. It answers after two seconds, it can be down, and it writes every request into a log. A real application would call its server here
 * (`HttpClient`, `fetch`) and pass it the same `AbortSignal`.
 */
@Injectable({ providedIn: 'root' })
export class Backend {
  /** The switch Backend › The backend is down. */
  readonly down = signal(localStorage.getItem(DOWN_KEY) === 'yes');
  /** The requests, the newest first. */
  readonly log = signal<LogLine[]>([]);

  setDown(down: boolean): void {
    this.down.set(down);
    localStorage.setItem(DOWN_KEY, down ? 'yes' : 'no');
  }

  /**
   * The HTML of a report, two seconds later. When `signal` is aborted first (the engine does that when the tab is closed while it loads), the request stops
   * and the promise is rejected, the way `fetch(url, { signal })` does it.
   */
  report(id: number, signal: AbortSignal): Promise<string> {
    this.write(`report ${id}: asked for`, 'info');
    return new Promise((resolve, reject) => {
      const cancel = () => {
        clearTimeout(timer);
        this.write(`report ${id}: cancelled, the tab was closed`, 'warning');
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener('abort', cancel);
        if (this.down()) {
          this.write(`report ${id}: failed, the backend is down`, 'error');
          reject(new Error('The backend is down (503).'));
          return;
        }
        this.write(`report ${id}: sent`, 'ok');
        const report = REPORTS[id] ?? { title: 'Unknown report', text: 'There is no such report.' };
        resolve(
          `<h3>Report ${id}: ${report.title}</h3><p>${report.text}</p><p><i>Loaded from the backend at ${now()}.</i></p>`,
        );
      }, DELAY_MS);
      signal.addEventListener('abort', cancel, { once: true });
    });
  }

  private write(text: string, kind: LogLine['kind']): void {
    this.log.update((lines) => [{ time: now(), text, kind }, ...lines].slice(0, 50));
  }
}
```

`src/styles.scss` is the one of 114 (the one of 015 with the rule `.saved`).

## How it fits together

- **`serialize: 'callback'` saves a reference, not the HTML.** The tab is saved with `callback` (the key and the parameters) and its `placeholder`. `content` is never saved: the HTML that came is only in the page. On a load the engine finds the key in `GrdContentRegistry` and calls the callback with the saved `params`.
- **The registry knows functions by their keys.** A function cannot go into JSON, its key can. So every key that can be in a saved layout is registered when the application starts (the constructor of `App` is a good place), before the engine shows the tabs of the saved layout. A key that is not registered gives the error box, _Failed to load content: Callback "report" is not registered in GrdContentRegistry._
- **The parameters are JSON.** They are saved with the layout, so they are what `JSON.stringify` keeps: numbers, strings, arrays, plain objects. Keep them small (an id, not the data) and fetch the rest in the callback.
- **A tab loads when it is shown.** After a reload only the tab that is shown calls its callback. The others call it when they are shown the first time (step 3: report 1 waited for its click). Ten saved reports are one request at the start, not ten.
- **The loader.** While the promise is pending, the tab shows a spinner, but only after 150 ms (`GrdEngineSettings.setLoaderDelay(ms)` changes the wait for all the tabs; `0` shows the spinner at once). A `placeholder` is shown at once instead. A loaded tab keeps its HTML while it is moved, docked elsewhere or hidden behind another tab; the callback runs again only after a reload or after **Try again**.
- **Errors.** A rejected promise (or an error thrown by the callback) gives the error box with the `message` of the error and **Try again**, which calls the callback again with the same parameters. The engine reports the error in the console as a warning.
- **The signal.** It is aborted when the tab is closed before its content came. Pass it on to `fetch` or to your server code. What the callback returns after that is thrown away, and a rejection after the abort is no error.
- **`inject()` works in the callback**, before its first `await`: it runs in the injection context of the application. This one does not need it, it uses `this.backend`.
- **The HTML of such a tab belongs to the callback.** `api.setTabHtml` (tutorial 114) refuses the tab: it returns `false` and says so in the console.

## What you get without writing any of it

- **The loading state**: a spinner after 150 ms, or your placeholder at once, in the middle of the tab, in the colors of the theme.
- **The error box** with the message and **Try again**; its texts are translated (English, German, Japanese) and follow a change of the language while the box is shown.
- **Requests only for the tabs that are shown.**
- **Stopping**: one `AbortController` for every load, aborted when the tab is closed for good. The result of a stopped load never reaches the page.
- **The global sanitizer**: when one is set (`GrdEngineSettings`), the HTML from a callback goes through it like any other HTML of a tab.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 115 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new html-callback --style=scss --ssr=false --skip-tests
   cd html-callback
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 114 (`@use '@gridify/studio/styles';`, a full height for `html` and `body`, and the rule `.saved`).

5. Add `src/app/backend.ts` and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
