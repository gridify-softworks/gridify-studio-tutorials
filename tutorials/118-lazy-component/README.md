# 118 – A component loaded lazily

This tutorial shows how to keep the component of a tab out of the first load of the application, and load it the first time a tab needs it, also when a saved tab comes back after a reload. You will learn how to:

- register a component by a function that imports it (`registerComponent(key, () => import(…))`), so that the build makes a file of its own (a chunk) from it;
- see the loader that a tab shows while its chunk loads;
- see that a tab that is not shown loads nothing;
- handle a chunk that does not come (**Reload the page** instead of **Try again**).

In 015 every component of the tabs is in the main bundle, and the browser loads all of them when the application starts. It is the application of 015 with a few lines more, from the series about saving (110–125).

```
npm run tutorial 118
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30118 and the developer tools of the browser on **Network**. Add a report (**File › Add report (lazy)**), watch its chunk come, and reload the page.

Every tutorial runs on an address of its own (this one on http://localhost:30118), so it has a `localStorage` of its own. It still keeps its layout under a key of its own (here `tutorial-118-layout`), as an application should: everything that runs on one address shares one `localStorage`.

## Step by step

Start from the application of 015 (or one made by `npm run tutorial:eject 015 path/to/new-folder` in the root of the repository).

### Step 1: a key of its own

In the template of `App`, the engine gets the key of this tutorial:

```html
<!-- a key of its own: everything that runs on one address shares one localStorage -->
<grd-docking-engine layoutStorageKey="tutorial-118-layout" />
```

### Step 2: the component that comes later

Add `src/app/report.ts` (the whole file is in [The code](#the-code)): a heading, a bar chart in SVG and the time the component was made.

```ts
export class Report {
  protected readonly months = MONTHS;
  protected readonly createdAt = new Date().toLocaleTimeString();
}
```

Nothing in it is special. What makes it lazy is that no other file imports it with a static `import ... from './report'`: one such line anywhere, and the report is in the main bundle again.

### Step 3: register a function instead of the class

The constructor of `App` registers the counter of 015 by its class, as before, and the report by a function that loads the class:

```ts
constructor() {
  inject(GrdEngineSettings).setAutoSaveLayout(true);
  const registry = inject(GrdContentRegistry);
  // A class: the counter is in the main bundle and is there at once, as in 015.
  registry.registerComponent('counter', Counter);
  // A function that loads the class: the report is a chunk of its own, loaded the first time a tab needs it.
  registry.registerComponent('report', async () => {
    await slowNetwork(1000);
    const { Report } = await import('./report');
    return Report;
  });
}
```

`import('./report')` is the dynamic import of JavaScript: it gives a promise of the module, and the builder of Angular makes a chunk of every module that is reached only this way. The function returns the class from the module.

On localhost the chunk comes in a few milliseconds, and you would not see the loader. So the function waits a second first, with a helper above `App`:

```ts
/** Stands in for a slow network: on localhost the chunk arrives in a few milliseconds, and the loader of the tab would not be seen. */
const slowNetwork = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
```

In an application, leave the pause out. The usual form is one line: `registry.registerComponent('report', () => import('./report').then((m) => m.Report));`.

### Step 4: a command that opens a report

A new item of the menu **File**, under **Add component**:

```ts
{
  label: 'Add &report (lazy)',
  run: () => this.engine().openComponentTab({ title: 'Report', componentKey: 'report' }),
},
```

The tab is opened by its key, like the counter in 015. It has no `componentType`: that would need the class, and the class is what the main bundle must not have.

## Try it

1. **Open the developer tools on Network** (the filter **JS** helps) and reload. The page loads `main.js` and the code it shares with the chunks, but no script of the report.
2. **File › Add report (lazy).** The tab shows the loader for a second, then the chart. A new script came in Network: the chunk of the report. (`ng build` lists it under _Lazy chunk files_, with the name `report`.)
3. **File › Add report (lazy)** once more. The second report is there at once, without the loader and without a new request: the class is loaded, and the registry keeps it.
4. **File › Add component.** The counter is in the main bundle: it is there at once, as in 015.
5. **Press F5** while the counter is the active tab. The three tabs are back, and Network shows no script of the report: a tab that is not shown does not need its component yet. Click a **Report** tab: the loader, then the chart, and the chunk comes now.
6. **Close a report while it loads** (open one and click its cross within the second). Nothing appears later, and the console stays clean.
7. **A chunk that does not come.** Press F5 with the counter active, set Network to **Offline**, and click a **Report** tab. After the second the tab says _The code of the content did not load: Failed to fetch dynamically imported module: …_, with a **Reload the page** button, and the console has a warning. There is no **Try again** here: the browser remembers a module that failed to load for the life of the page, and a second `import()` would get the same error without asking the server. Set Network back to **No throttling** and press **Reload the page**: the page loads again, the tab comes back from the saved layout, and the report loads.
8. **File › Reset layout** empties the area.

## The code

`src/app/app.ts`:

```ts
import { Component, inject, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdMenu,
  GrdMenuBar,
} from '@gridify/studio';
import { Counter } from './counter';

/** Stands in for a slow network: on localhost the chunk arrives in a few milliseconds, and the loader of the tab would not be seen. */
const slowNetwork = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- a key of its own: everything that runs on one address shares one localStorage -->
    <grd-docking-engine layoutStorageKey="tutorial-118-layout" />
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

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    // A class: the counter is in the main bundle and is there at once, as in 015.
    registry.registerComponent('counter', Counter);
    // A function that loads the class: the report is a chunk of its own, loaded the first time a tab needs it.
    registry.registerComponent('report', async () => {
      await slowNetwork(1000);
      const { Report } = await import('./report');
      return Report;
    });
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
          label: 'Add &report (lazy)',
          run: () => this.engine().openComponentTab({ title: 'Report', componentKey: 'report' }),
        },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine().resetLayout() },
      ],
    },
  ];
}
```

`src/app/report.ts`:

```ts
import { Component } from '@angular/core';

/** The sales of one month. */
interface Month {
  name: string;
  sales: number;
}

const MONTHS: Month[] = [
  { name: 'Jan', sales: 42 },
  { name: 'Feb', sales: 55 },
  { name: 'Mar', sales: 61 },
  { name: 'Apr', sales: 48 },
  { name: 'May', sales: 73 },
  { name: 'Jun', sales: 80 },
];

/**
 * A component that only some users open: its code is not in the main bundle. `app.ts` registers it with a function that
 * imports this file, so the build makes a chunk of it, and the browser loads the chunk the first time a tab needs it.
 */
@Component({
  selector: 'app-report',
  template: `
    <h2>Sales, first half of the year</h2>
    <svg viewBox="0 0 360 160" role="img" aria-label="Sales by month">
      @for (month of months; track month.name; let i = $index) {
        <rect
          [attr.x]="20 + i * 56"
          [attr.y]="140 - month.sales"
          width="36"
          [attr.height]="month.sales"
        />
        <text [attr.x]="38 + i * 56" y="156">{{ month.name }}</text>
        <text [attr.x]="38 + i * 56" [attr.y]="134 - month.sales">{{ month.sales }}</text>
      }
    </svg>
    <p class="note">Created at {{ createdAt }}. Its code came in a chunk of its own.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 0 16px;
    }
    h2 {
      font-size: 1.1rem;
    }
    svg {
      width: 100%;
      max-width: 480px;
    }
    rect {
      fill: var(--grd-accent);
    }
    text {
      fill: currentColor;
      font-size: 11px;
      text-anchor: middle;
    }
    .note {
      opacity: 0.88;
    }
  `,
})
export class Report {
  protected readonly months = MONTHS;
  protected readonly createdAt = new Date().toLocaleTimeString();
}
```

`src/app/counter.ts` and `src/styles.scss` are the ones of 015.

## How it fits together

- **A class or a function.** `registerComponent(key, source)` takes either the class of a component or a function that gives one (`() => Type | Promise<Type>`). The registry tells them apart by the metadata that Angular puts on a component class: a class is used as it is, anything else is called.
- **The function is called once.** The first tab that needs the key calls it. Tabs that need the key while the promise runs wait for the same promise. When it resolves, the registry keeps the class, and every later tab gets it at once. A promise that fails is not kept: the next tab that needs the key, or **Try again**, calls the function again. That helps a function that failed for a reason of its own; an `import()` whose chunk did not come is different (below).
- **`import()` makes the chunk.** The builder of Angular (esbuild) puts a module that is reached only by a dynamic `import()` into a file of its own, and the main bundle carries only the function. Code that both share (Angular itself, the library) stays in the main bundle or in a shared chunk, so the chunk of the report is small.
- **A saved tab has only the key.** In the saved layout the tab is `"componentKey": "report"`, without a class, as in 015. After a reload the engine looks the key up in the registry when it makes the body of the tab, which is when the tab is shown: the active tab of each panel at once, the others when they are clicked.
- **The loader.** The body of a tab whose content has to be waited for starts as an empty box. The loader appears in it after 150 ms, so content that comes fast does not flicker (`GrdEngineSettings.setLoaderDelay(ms)` changes the wait; a `placeholder` on the tab shows a text of your own at once instead). When the class comes, the engine creates the component and puts it in place of the loader. A tab closed while it loads is forgotten: the component is not made.
- **When the chunk does not come.** The network is down, or a new version of the application was deployed and the old chunk is gone from the server. The browser answers a second `import()` of a module that failed with the same error, without asking the server, so calling the function again cannot help; only a reload of the page can. The engine knows the errors of a failed module load (Chrome, Firefox, Safari, and the `ChunkLoadError` of webpack): the tab says _The code of the content did not load_ and offers **Reload the page** instead of **Try again**, and the console has a warning with the title of the tab. After the reload the saved layout brings the tab back.
- **Register at the start.** As in 015, the key must be in the registry before the saved layout comes back, so it is registered in the constructor of `App`. Only the function is registered there; nothing is loaded until a tab needs it.

## What you get without writing any of it

- **The loader** in the tab while the code comes, shown only when the wait is longer than 150 ms, in the colors of the theme.
- **One load for many tabs**: the registry shares the promise while it runs and keeps the class afterwards.
- **Nothing loaded for a tab that is not shown**, also after a reload.
- **The error box** with the message and **Try again**, or **Reload the page** for a chunk that did not come, and a warning in the console that names the tab.
- **A tab closed while it loads** leaves nothing behind.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 118 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new lazy-component --style=scss --ssr=false --skip-tests
   cd lazy-component
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as in 015 (`@use '@gridify/studio/styles';` and a full height for `html` and `body`).

5. Add `src/app/counter.ts` of 015 and `src/app/report.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
