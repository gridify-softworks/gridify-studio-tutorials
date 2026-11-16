# 027 – Maximize a panel

This tutorial lets the user give a document the whole area of the panels for a while: the panel is maximized, it fills the dockable core, and the other panels wait behind it with their tabs as they are, until it is restored. You will learn how to:

- choose which panels can (`GrdEngineSettings.setMaximize`): the documents by default (`'documents'`), every panel (`'all'`) or none (`'off'`);
- let a tab say otherwise for itself (`maximizable: true` for a tool that may, `false` for a document that may not);
- maximize and restore from the code (`api.maximizePanel`, `api.restorePanel`, the signal `maximizedPanel`) and follow it (`panelMaximized`, `panelRestored` and its `reason`).

It goes deeper into the roles mode of [025](../025-roles-docking-mode/README.md): files on the left, the documents in the middle, the properties on the right and the output at the bottom, as in an IDE. The first document says what to try.

```
npm run tutorial 027
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30027 and double-click the tab Welcome. The panel of the documents fills the window under the menu bar; double-click it again, or press the button at the right end of its header, and the others come back.

## The words first

- **Maximized** is a state of one panel: it fills the dockable core (the shell around the core, which this application does not have, stays, and so do the floating windows above it). The other panels are not closed and not moved: they wait behind it, their components live on.
- **Restored** is the way back. The user restores the panel, or the engine does it by itself when the work needs the other panels: a drag, a tab of another panel that has to be seen, another layout.
- **Nothing is saved.** It is not a part of the layout: a reload shows the layout as it is, and `layoutChanged` does not come.

## Step by step

### Step 1: the setting

There is nothing to turn on: the library lets a panel be maximized while its active tab is a document (`maximize: 'documents'`), so the tools stay beside the document the user works in. `'all'` lets every panel of the dockable core, `'off'` none. This application switches it from its View menu (`src/app/app.ts`):

```ts
          {
            label: 'Panels that can be ma&ximized',
            children: CHOICES.map((choice) => ({
              label: choice.label,
              checked: maximize === choice.value,
              run: () => this.settings.setMaximize(choice.value),
            })),
          },
```

An application that wants it elsewhere sets it once, in a constructor or in the start of the application: `inject(GrdEngineSettings).setMaximize('all')`. A panel that can be maximized gets a button at the right end of its header (after the collapse arrows), and then:

- a **double-click** on the strip of tabs (a tab, or the room beside the tabs; not a button in it) maximizes it, and on the maximized panel restores it;
- the **button** does the same, and on the maximized panel it is the button that restores it (the collapse arrows are not there: a panel that fills the core has nothing to collapse into);
- **Ctrl+M** on a tab that has the focus maximizes its panel with that tab, and **Esc** on a tab of the maximized panel restores it (the keys of the content are the content's);
- the **menu of a tab** has Maximize (with that tab as the active one) and, on the maximized panel, Restore.

The shell, a collapsed panel, a panel in a collapsed group and the only panel of the core are never maximized.

### Step 2: tabs that say otherwise

`src/app/layout.ts` has a tool that may, and a document that may not:

```ts
            {
              tag: 'notes',
              role: 'document',
              title: 'Pinned notes',
              content: '<p>This document says maximizable: false.</p>',
              // While this tab is the active one, its panel cannot be maximized.
              maximizable: false,
            },
```

```ts
        {
          tag: 'output',
          role: 'tool',
          title: 'Output',
          content: '<pre>Build started…\nBuild finished: 0 errors, 2 warnings.</pre>',
          // A tool that can be maximized although the setting is only for documents.
          maximizable: true,
        },
```

`maximizable` overrides the setting in both directions, and the active tab of the panel counts (as for `collapseFeature`): while Pinned notes is the active tab, the panel of the documents has no button. The Layout editor has the property too (Inspector, Behavior).

### Step 3: from the code

View › Maximize the document maximizes the panel of the active document, or restores the maximized one:

```ts
  private toggleMaximized(): void {
    const engine = this.engine();
    if (!engine) return;
    if (engine.maximizedPanel() !== null) {
      engine.api.restorePanel();
      return;
    }
    const document = engine.activeDocumentTab();
    if (document && !engine.api.maximizePanel(document.tabId)) {
      this.said.set(`${document.title} cannot be maximized now.`);
    }
  }
```

`api.maximizePanel(id)` takes a panel, or a docked tab (its panel, with that tab as the active one), and says `false` when it cannot be now. `api.restorePanel()` says `false` when nothing is maximized. `maximizedPanel` is a signal of the engine (the id of the maximized panel, or `null`), so the check mark of the menu, which is a `computed`, follows it.

### Step 4: what happened

```ts
  protected maximized(event: GrdEventMap['panelMaximized']): void {
    const api = this.engine()?.api;
    const tab = api?.findById(event.tabId);
    this.said.set(`Maximized with ${api?.isTab(tab) ? tab.title : 'its tab'}.`);
  }

  /**
   * The maximized panel went back; `reason` says why (user, api, drag, reveal, layout, gone,
   * setting).
   */
  protected restored(event: GrdEventMap['panelRestored']): void {
    this.said.set(`Restored (${event.reason}).`);
  }
```

The `reason` of `panelRestored`:

| `reason`  | The panel went back because                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| `user`    | the user restored it: the button, a double-click, Restore in the menu of a tab, Ctrl+M or Esc |
| `api`     | `api.restorePanel()`, or `api.maximizePanel` of another panel                                 |
| `drag`    | a tab began to be dragged: the drag needs the places to drop on                               |
| `reveal`  | a tab of another panel was activated, opened or docked (View › Show the properties does it)   |
| `layout`  | another layout came: a load, a reset (View › Reset layout), `setDefaultLayout`                |
| `gone`    | the panel cannot fill the core any more: its last tab was closed or moved, it was collapsed   |
| `setting` | the setting (View › Panels that can be maximized) does not allow it any more                  |

A document that opens while a panel of documents is maximized goes into that panel, the usual place of a new document, and the panel stays maximized.

## Try it

1. Double-click the tab Welcome: the documents fill the window. Switch to report.md and scroll it.
2. Press the button at the right end of the header: the files, the properties and the output are back, as they were.
3. Click the tab report.md, press Ctrl+M, then Esc.
4. Click Pinned notes: the header has no button, and a double-click does nothing.
5. Press the button of the Output panel: a tool fills the window, because its tab says `maximizable: true`.
6. View › Show the properties: the panels come back by themselves (`reveal` in the status bar).
7. Maximize the documents again and drag the tab report.md: the panels are back the moment the drag begins, with every place to drop on (`drag`).
8. Maximize the documents, then View › Panels that can be maximized › Off: they go back (`setting`), and their header has no button any more; Output keeps its own, because its tab says yes.
9. Maximize a panel and press F5: the layout comes back as it was, nothing maximized.

## Build it yourself

`npm run tutorial:eject 027 path/to/new-folder` writes this tutorial as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand: an empty application with the library (steps 1 to 4 of [Build it yourself from scratch](../070-messages/README.md#build-it-yourself-from-scratch) of 070), then `app.ts` and `layout.ts` of this tutorial in `src/app`.

## More

- The roles mode, the documents and the tools: [025](../025-roles-docking-mode/README.md).
- A fixed shell around the dockable core (it stays around a maximized panel): [040](../040-shell/README.md).
- Everything about it: "Maximizing a panel" in the README of the docking engine (`src/app/components/grd-docking-engine/README.md`).
