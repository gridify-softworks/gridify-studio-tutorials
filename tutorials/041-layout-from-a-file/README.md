# 041 – Layout from a file

This tutorial shows how to keep the default layout of the engine in a file that the **Layout editor** made, instead of writing it in TypeScript as 040 does. You will learn how to:

- make the file in the Layout editor and take the code that loads it (the output **Loader**);
- read the file with `grdLoadLayout`, which gives every tab of a component the class of its `componentKey`, and give the layout to `[defaultLayout]`;
- replace the layout while the application runs by a file that it fetches from the server (`setDefaultLayout`), after the loader has checked that the application has every component the file needs.

The layout is the frame of 040 made in the editor: a bar of the shell on the left (Explorer, 220 px, the user can make it wider), and the dockable core beside it, with the documents Welcome and Notes above the tool Output.

```
npm run tutorial 041
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30041. The panels come from `src/app/layout.json`. Choose **Layout › The layout from the server**: the application fetches `public/layouts/compact.json` and the engine shows that layout instead (the documents above, the tools Explorer and Output in one panel below). **Layout › The layout of the build** brings the first one back, **Layout › A file of another application** names a component that this application does not have (the loader reports it, and the layout stays), and **Layout › A file that is not there** shows what happens when a file cannot be loaded. The tool **Output** lists what the application did.

## The file of the editor

Open the Layout editor (in the root of the repository `npm run designer`, http://localhost:4202, then **Layout editor** in the header), build the layout in the Outline, the Preview and the Inspector, and take the file with **File › Download the file** (or copy the output **File**). It holds the docking mode the layout is made for, the keys of the components its tabs name, and the layout:

```json
{
  "options": { "dockingMode": "roles" },
  "components": ["explorer", "welcome", "output"],
  "layout": {
    "type": "row",
    "size": 100,
    "children": [
      {
        "type": "panel",
        "tag": "explorer",
        "role": "tool",
        "size": "220px",
        "resizable": true,
        "shell": true,
        "activeTab": 0,
        "collapsed": false,
        "tabs": [{ "role": "tool", "title": "Explorer", "componentKey": "explorer" }]
      },
      { "type": "column", "size": 100, "children": ["…the documents and the tool Output…"] }
    ]
  }
}
```

JSON cannot hold a class, so a tab of a component names it by a key (`"componentKey": "explorer"`), and the application gives a class for every key when it loads the file. A tab of HTML (Notes) carries its `content` and needs nothing. The file opens in the editor again (**File › Open file…**), so the layout is changed there and downloaded again, not edited by hand.

## The loader

The output **Loader** of the editor is the code that loads the file: `src/app/layout-loader.ts` is that output as the editor wrote it, formatted like the code of the tutorials and with one line added at the top:

```ts
import { inject } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdEngineSettings,
  grdLoadLayout,
} from '@gridify/studio';
import { ExplorerComponent } from './explorer.component';
import { WelcomeComponent } from './welcome.component';
import { OutputComponent } from './output.component';
// the file is imported as JSON ("resolveJsonModule": true in tsconfig.json)
import file from './layout.json';

/** The layout of the file for [defaultLayout]. It calls inject(), so call it in a component: readonly layout = loadLayout(); */
export function loadLayout(): GrdDockContainerNodeInput {
  const registry = inject(GrdContentRegistry);
  // a tab finds its component by the "componentKey": the loader gives it the class, and registers every component of the file
  const loaded = grdLoadLayout(file, {
    components: { explorer: ExplorerComponent, welcome: WelcomeComponent, output: OutputComponent },
    registry,
  });
  // the docking mode the layout is made for
  inject(GrdEngineSettings).setDockingMode(loaded.dockingMode);
  return loaded.layout;
}
```

The file is imported, so it is part of the build: the layout is there at once, and the build fails when the file is missing. The workspace of the tutorials has `"module": "preserve"`, which reads JSON as it is; an application with another module setting turns on `"resolveJsonModule": true`. The editor names a class after its key (`explorer` → `ExplorerComponent` in `./explorer.component`): rename the imports to your files, or keep the names.

`grdLoadLayout` of the library reads the file. It gives every tab of a component the class of its key (`componentType`), registers the classes in `GrdContentRegistry` (so a layout that the user saved, with a tab that the file does not show, finds its class too), and returns:

- `layout`: the layout for `[defaultLayout]` (a copy: the imported JSON stays as it is);
- `dockingMode`: the docking mode the layout is made for, which `loadLayout()` gives to `GrdEngineSettings` (a setting of the whole page);
- `components`: the keys of the components the layout needs;
- `problems`: what cannot be used, for example a key that the application does not have, or a value that is not valid. Every problem is also written to the console (`onProblem` does something else with it).

What the loader writes depends on the file: a tab whose content comes from a callback gets its `registry.registerHtml(...)` before the file is read, and a custom element a note that its tag is defined. A file that holds code of the application (`{"$expr": ...}`) is loaded without it (the loader reports every place): such a layout is taken from the output **TypeScript** instead, which writes the code as code.

## The application

`src/app/app.ts` calls the loader once, where `inject()` is allowed, and gives the layout to the engine:

```ts
@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <grd-docking-engine [defaultLayout]="layout" [layoutStorageKey]="null" />
  `,
})
export class App {
  /** The layout of `layout.json`. The engine reads `[defaultLayout]` once, when it starts. */
  protected readonly layout = loadLayout();
  // ...
}
```

`[layoutStorageKey]="null"` saves nothing, so the layout comes from the file at every start. Saving works with a file as with a layout in TypeScript (see 015): the saved layout of the user comes back instead of the default one, and **Reset layout** returns to the file.

## A layout from the server

A file in `public/` is not in the build: the application fetches it while it runs, so the layout can be replaced without building the application again. The engine takes a new default layout with `setDefaultLayout`, and shows it at once:

```ts
private async useServer(url: string): Promise<void> {
  let json: unknown;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    json = await response.json();
  } catch (error) {
    this.log.write(`${url} could not be loaded (${String(error)}); the layout stays.`);
    console.error(`Layout ${url}:`, error);
    return;
  }
  const loaded = grdLoadLayout(json, {
    registry: this.registry,
    onProblem: (problem) => this.log.write(`${url}: ${problem.message}`),
  });
  if (loaded.problems.length > 0) {
    this.log.write(`${url} is not shown; the layout stays.`);
    return;
  }
  this.settings.setDockingMode(loaded.dockingMode);
  this.engine().setDefaultLayout(loaded.layout);
  this.log.write(`The default layout is ${url}, fetched from the server.`);
}
```

A file that comes from the server can name only the components that the application has: the classes are in the build. So the application reads it with `grdLoadLayout` and the registry only (`loadLayout()` has registered all three components there): a key that the registry does not have is a problem (`layouts/foreign.json` names a `terminal`), the problems go to the tool Output, and a file with problems is not shown. The docking mode of the file is a setting of the whole page (`GrdEngineSettings`), not of one engine.

## The components

`explorer.component.ts`, `welcome.component.ts` and `output.component.ts` are the components of the three keys. The tool Output shows the lines of `layout-log.ts`, a service: a tab is made again when another layout replaces the tabs, so what it shows lives outside of it.
