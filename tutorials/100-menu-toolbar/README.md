# 100 – Menu bar, toolbar and status bar

This tutorial shows how to build the frame of a desktop program around a docking engine: a menu bar, a toolbar, a popup menu and a status bar, all running the same commands. You will learn how to:

- write a command once (`GrdCommand`) and use it in the menu bar, the toolbar, the popup menu and on its shortcut;
- give a menu bar access keys, shortcuts, submenus, check marks and greyed items, and the View and Window blocks of the engine;
- give a toolbar buttons, a toggle, a split button and a select, and let it put what does not fit behind a chevron;
- open a popup menu at the pointer;
- keep a status bar that follows the engine: the active document, its words, how many documents are open.

The application is a small notes program: the header, the menu bar (File, Edit, View, Window, Help), the toolbar, the notes in the middle, two tools docked on the right, and the status bar at the very bottom. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 100
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30100. Add notes with **File › New document**, with **New document** in the toolbar and with **Alt+N**, and watch the tabs, the title in the menu bar and the status bar. Type into a note and save it with **Ctrl+S** (⌘S on a Mac). Open the menus with the mouse, with **Alt+F**, **Alt+E**, **Alt+V** (the arrows go on to the next menu) and with a lone **Alt**. Pick a zoom in the toolbar, in **View › Zoom** or in the status bar, and turn the wrapping of the lines off with the toolbar and on again with the menu. Click **2 documents** in the status bar. Click the panel **Popup menu** on the right (or press the right mouse button there), walk the menu with the arrows, open **Change case** with →, choose an item and read the status bar. Make the window narrow: the toolbar puts what does not fit behind a chevron, the menu bar its menus into a ☰ button. Switch the theme and the density in the header.

## The code

`src/app/app.ts` is the frame. The template is a column, top to bottom:

<!-- prettier-ignore -->
```html
<grd-app-header
  productName="Notes"
  subtitle="a menu bar, a toolbar, a popup menu and a status bar around a docking engine"
  icon="grd:logo"
  preferences="theme density"
/>
<grd-menu-bar [menus]="menus()" [shortcuts]="true">
  <span grdMenuBarTitle>{{ title() }}</span>
</grd-menu-bar>
@if (showToolbar()) {
  <!-- The menu bar runs the shortcuts, the toolbar only shows them in its tooltips. A press on the toolbar
       leaves the focus in the note (keepFocus), so a command acts on the place the user works in. -->
  <grd-toolbar
    [items]="toolbarItems"
    [shortcuts]="false"
    keepFocus
    ariaLabel="Notes"
    (action)="onToolbar($event)"
  />
}
<grd-docking-engine
  [defaultLayout]="layout"
  [layoutStorageKey]="null"
  viewSources
  (tabOpened)="commands.say('Opened ' + $event.title + '.')"
  (tabClosed)="commands.say('Closed ' + $event.title + '.')"
/>
@if (showStatusBar()) {
  <grd-status-bar [items]="statusItems()" />
}
```

The default layout of the engine: the notes in the middle, and on the right a column of two tools, the Properties and the popup menu under them:

```ts
/** The documents in the middle (the dockable core of the roles mode); on the right the Properties, and the popup menu under them. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [noteTab('Welcome', WELCOME)],
    },
    {
      type: 'column',
      size: 25,
      children: [
        {
          type: 'panel',
          role: 'tool',
          size: 60,
          activeTab: 0,
          collapsed: false,
          tabs: [
            { tag: 'properties', role: 'tool', title: 'Properties', componentType: PropertiesTool },
          ],
        },
        {
          type: 'panel',
          role: 'tool',
          size: 40,
          activeTab: 0,
          collapsed: false,
          tabs: [{ tag: 'popup', role: 'tool', title: 'Popup menu', componentType: PopupTool }],
        },
      ],
    },
  ],
};
```

**A command is written once**, as a `GrdCommand` of the library: a name, a text with the access key of a menu, an icon, a shortcut, whether it can run now (`enabled`) or is on (`checked`), and what it does (`run`). `grdMenuItemOf` makes an item of a menu of it and `grdToolbarItemOf` an item of the toolbar, so the text, the icon, the shortcut and the state are the same everywhere, and every place runs the same code. A value may be a signal, or a function that reads signals.

A note is a tab of the engine. Its helper in `src/app/commands.ts` is typed as the configuration of a component tab (`GrdComponentTabConfig`), which is a tab of the default layout as it is, so the same helper makes the Welcome note of the layout and every new note of `openComponentTab`:

```ts
/** A note as a tab of the engine: the configuration of a component tab is a tab of the default layout too, and it opens with `openComponentTab`. */
export const noteTab = (title: string, text: string): GrdComponentTabConfig<NoteDocument> => ({
  role: 'document',
  icon: 'app:note',
  title,
  componentType: NoteDocument,
  inputs: { start: text },
});
```

The commands themselves are in a service of the root, `NoteCommands`, together with what they need: the engine, the active document and its note, the message and the progress of the status bar. The application and a component in a tab of the engine (the popup menu) inject the same service, so they have the same commands:

```ts
/**
 * The commands of the notes, and what they need: the engine (the application gives it with `attach`), the active document and its note, and the message
 * and the progress of the status bar. A service of the root, so the application and a component in a tab of the engine (the popup menu) use the same ones.
 * A command (`GrdCommand` of the library) is written once: the menu bar, the toolbar and the popup menu are made from it (`grdMenuItemOf`, `grdToolbarItemOf`),
 * so they have the same text, icon, shortcut and state, and run the same code.
 */
@Injectable({ providedIn: 'root' })
export class NoteCommands {
  private readonly notes = inject(Notes);
  private readonly engine = signal<GrdDockingEngine | undefined>(undefined);
  private untitled = 0;

  /** The message on the left of the status bar. */
  readonly message = signal('Ready.');
  /** How far the saving is (0 to 1), `null` while nothing is saved. */
  readonly saving = signal<number | null>(null);

  /** The active document: the tab of the document that had the focus last (the engine keeps it). */
  readonly document = computed(() => this.engine()?.activeDocumentTab() ?? null);
  /** Its note, when it is one (About is a page). */
  readonly note = computed(() => this.notes.get(this.document()?.tabId));
  /** How many documents are open: the engine keeps the list of its documents (`documents`, a signal). */
  readonly documentCount = computed(() => this.engine()?.documents().length ?? 0);

  readonly newDocument: GrdCommand = {
    id: 'new',
    label: '&New document',
    icon: 'app:new',
    shortcut: 'Alt+N',
    run: () => this.open(`Untitled ${++this.untitled}`, ''),
  };
  readonly save: GrdCommand = {
    id: 'save',
    label: '&Save',
    icon: 'app:save',
    shortcut: 'Mod+S',
    enabled: () => !!this.note()?.dirty() && this.saving() === null,
    run: () => this.saveNote(),
  };
  // close, insertDate, upperCase, lowerCase and titleCase are written the same way.
  /** A command that is on or off: a check mark in a menu, a toggle button in the toolbar. Its `run` turns the setting; the toolbar never writes it. */
  readonly wrapLines: GrdCommand = {
    id: 'wrap',
    label: '&Wrap lines',
    icon: 'app:wrap',
    checked: this.notes.wrap,
    run: () => this.notes.wrap.update((on) => !on),
  };

  /** The application gives the engine once it is there (the commands open and close its tabs). */
  attach(engine: GrdDockingEngine | undefined): void {
    this.engine.set(engine);
  }
  // say(text), open(title, text), about() and saving: what the commands do.
}
```

The application gives the service its engine once the engine is there:

```ts
constructor() {
  // The commands open and close the tabs of this engine.
  effect(() => this.commands.attach(this.engine()));
}
```

**The menus** are a `computed`: `grdMenuItemOf` reads the state of a command now, so an item is greyed out (`enabled`) or checked (`checked`) by the signals it reads, and the menu that is open changes with them. `{ source: 'grd:tools' }`, `{ source: 'grd:restore-layout' }` and `{ source: 'grd:documents' }` are the blocks of items that the engine gives (`viewSources` in the template):

```ts
/** The menus: a `computed`, so the state of the items (enabled, checked) follows the signals it reads. */
protected readonly menus = computed<GrdMenu[]>(() => {
  const commands = this.commands;
  return [
    {
      id: 'file',
      label: '&File',
      items: [
        grdMenuItemOf(commands.newDocument),
        {
          label: 'Open sa&mple',
          children: Object.keys(SAMPLES).map((title) => ({
            label: title,
            run: () => commands.open(title, SAMPLES[title]),
          })),
        },
        { separator: true },
        grdMenuItemOf(commands.save),
        grdMenuItemOf(commands.close),
      ],
    },
    {
      id: 'edit',
      label: '&Edit',
      items: [
        grdMenuItemOf(commands.insertDate),
        {
          label: 'Change &case',
          icon: 'app:case',
          children: [
            grdMenuItemOf(commands.upperCase),
            grdMenuItemOf(commands.lowerCase),
            grdMenuItemOf(commands.titleCase),
          ],
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        {
          label: '&Toolbar',
          checked: this.showToolbar(),
          run: () => this.showToolbar.update((on) => !on),
        },
        {
          label: 'Status &bar',
          checked: this.showStatusBar(),
          run: () => this.showStatusBar.update((on) => !on),
        },
        { separator: true },
        grdMenuItemOf(commands.wrapLines),
        {
          label: '&Zoom',
          children: ZOOMS.map((zoom) => ({
            label: zoom,
            checked: this.notes.zoom() === zoom,
            run: () => this.notes.zoom.set(zoom),
          })),
        },
        { separator: true },
        // The blocks of the engine (viewSources): its tool panels with a check mark, and Restore layout.
        { source: 'grd:tools' },
        { source: 'grd:restore-layout' },
      ],
    },
    // The open documents, numbered, the active one checked: the block of the engine.
    { id: 'window', label: '&Window', items: [{ source: 'grd:documents' }] },
    { id: 'help', label: '&Help', items: [{ label: '&About', run: () => commands.about() }] },
  ];
});
```

**The toolbar** is made once: the toolbar keeps the state of its controls for the item objects. What changes is in signals. `grdToolbarItemOf` makes `disabled` (and `checked` of **Wrap lines**, a toggle button) signals of the command, and puts the command into the item (`run`): the toolbar runs it itself when the item is pressed. The select gets the writable signal of the zoom (`notes.zoom`), so the toolbar writes it itself and the View menu and the status bar see the change. Only a choice of the split button is left for `(action)`:

```ts
protected readonly toolbarItems: GrdToolbarItem[] = [
  grdToolbarItemOf(this.commands.newDocument, { priority: 10 }),
  { type: 'separator' },
  grdToolbarItemOf(this.commands.save, { inputs: { iconOnly: true }, priority: 9 }),
  grdToolbarItemOf(this.commands.close, { inputs: { iconOnly: true }, priority: 8 }),
  { type: 'separator' },
  grdToolbarItemOf(this.commands.wrapLines, { inputs: { iconOnly: true }, priority: 5 }),
  {
    type: 'split-button',
    action: 'case',
    label: 'UPPER CASE',
    icon: 'app:case',
    disabled: computed(() => !this.commands.note()),
    // The main part runs UPPER CASE; a choice of its menu goes to `onToolbar`.
    run: this.commands.upperCase.run,
    choices: [
      { label: 'UPPER CASE', value: 'upper' },
      { label: 'lower case', value: 'lower' },
      { label: 'Title Case', value: 'title' },
    ],
    priority: 3,
  },
  grdToolbarItemOf(this.commands.insertDate, { inputs: { iconOnly: true }, priority: 4 }),
  { type: 'separator' },
  {
    type: 'select',
    action: 'zoom',
    label: 'Zoom',
    value: this.notes.zoom,
    choices: ZOOMS.map((zoom) => ({ label: zoom })),
    width: 84,
    priority: 6,
  },
];

/**
 * What the toolbar tells. The items of the commands have run their commands already, and the select wrote its signal itself (zoom): only a choice of
 * the split button is left, the case it names.
 */
protected onToolbar(event: GrdRibbonActionEvent): void {
  if (event.item.action === 'case' && event.choice) {
    this.commands.byId.get(String(event.choice.value))?.run();
  }
}
```

**The status bar** is a `computed` of the state of the application and of the engine: the active document and its note, the number of documents and the message are signals of `NoteCommands`. The message comes from the commands and from the events of the engine (`(tabOpened)`, `(tabClosed)` in the template):

```ts
/** The status bar: a `computed` of the state of the application and of the engine. */
protected readonly statusItems = computed<GrdStatusItem[]>(() => {
  const doc = this.commands.document();
  const note = this.commands.note();
  const count = this.commands.documentCount();
  const saving = this.commands.saving();
  const zoom = this.notes.zoom();
  return [
    {
      id: 'message',
      text: this.commands.message(),
      shrink: true,
      live: true,
      busy: saving !== null,
    },
    {
      id: 'saving',
      progress: saving ?? 0,
      tooltip: 'Saving',
      visible: saving !== null,
      align: 'end',
    },
    {
      id: 'document',
      icon: 'grd:document',
      text: doc ? doc.title + (note?.dirty() ? ' *' : '') : 'No document',
      tooltip: 'The active document',
      align: 'end',
      priority: 5,
    },
    {
      id: 'words',
      text: `${note?.words() ?? 0} words`,
      visible: !!note,
      align: 'end',
      priority: 2,
    },
    {
      id: 'count',
      text: count === 1 ? '1 document' : `${count} documents`,
      tooltip: 'The open documents (the Window menu)',
      align: 'end',
      priority: 4,
      run: () => this.menuBar()?.open('window'),
    },
    {
      id: 'zoom',
      icon: 'grd:zoom',
      text: zoom,
      tooltip: 'Zoom',
      align: 'end',
      priority: 3,
      choices: ZOOMS.map((step) => ({
        label: step,
        checked: step === zoom,
        run: () => this.notes.zoom.set(step),
      })),
    },
  ];
});
```

**The popup menu** is `src/app/popup-tool.ts`, the tool under the Properties. The whole panel is one button. A click and the right mouse button open the menu at the pointer (`at: event`); the keys open it in the corner of the panel, which the popup menu sees in the event itself. `closed` gives the item that was chosen, and the status bar says it:

```ts
export class PopupTool {
  private readonly popup = inject(GrdPopupMenu);
  private readonly commands = inject(NoteCommands);

  /**
   * The items: commands of the application (the same ones as in the menu bar and the toolbar), a check mark, a submenu, separators and an item that is
   * greyed out. They are made when the menu opens, so they say the state of that moment. A shortcut is only shown: the menu bar runs it.
   */
  private items(): GrdMenuItem[] {
    const commands = this.commands;
    return [
      { label: 'Notes', header: true },
      grdMenuItemOf(commands.newDocument),
      grdMenuItemOf(commands.save),
      { separator: true },
      grdMenuItemOf(commands.insertDate),
      {
        label: 'Change &case',
        icon: 'app:case',
        children: [
          grdMenuItemOf(commands.upperCase),
          grdMenuItemOf(commands.lowerCase),
          grdMenuItemOf(commands.titleCase),
        ],
      },
      grdMenuItemOf(commands.wrapLines),
      { separator: true },
      // Greyed out: there is no printing in this tutorial. It cannot be highlighted or chosen.
      { label: '&Print…', shortcut: 'Mod+P', enabled: false },
      grdMenuItemOf(commands.close),
    ];
  }

  /**
   * Opens the menu at the event (`at: event`). A press of the mouse opens it at the pointer. Enter and Space on the button and the Menu key or Shift+F10
   * have no pointer: the popup menu sees that in the event and opens as from the keyboard, in the corner of the panel (it is a large element; under a
   * small one) with the first item highlighted. Then the status bar says what was chosen.
   */
  protected async show(event: MouseEvent): Promise<void> {
    event.preventDefault();
    const ref = this.popup.open(this.items(), { at: event, ariaLabel: 'Notes' });
    const chosen = await ref.closed;
    if (chosen?.label) this.commands.say(`Popup menu: ${grdParseAccessKey(chosen.label).text}.`);
  }
}
```

`src/app/notes.ts` keeps what all the notes share (the wrapping and the zoom) and the notes that are open, by the id of their tab, so a command finds the note of the active document:

```ts
/** The steps of the zoom: the toolbar, the View menu and the status bar offer the same ones. */
export const ZOOMS = ['75%', '100%', '125%', '150%', '200%'];

/**
 * What the notes share, and the notes that are open. The wrapping of the lines and the zoom are one setting for all the notes: the menu, the toolbar and the
 * status bar change these signals, and every note reads them. A note tells that it is open by the id of its tab, so a command finds the note of the active tab.
 */
@Injectable({ providedIn: 'root' })
export class Notes {
  readonly wrap = signal(true);
  readonly zoom = signal('100%');
  private readonly open = signal<ReadonlyMap<string, NoteDocument>>(new Map());

  add(tabId: string, note: NoteDocument): void {
    this.open.update((notes) => new Map(notes).set(tabId, note));
  }

  remove(tabId: string): void {
    this.open.update((notes) => {
      const next = new Map(notes);
      next.delete(tabId);
      return next;
    });
  }

  /** The note in a tab; `undefined` for a tab that is no note (About) and for no tab. */
  get(tabId: string | undefined): NoteDocument | undefined {
    return tabId === undefined ? undefined : this.open().get(tabId);
  }
}
```

`src/app/note-document.ts` is the note: a text area that reads the settings, tells the engine that it was changed (the dot on its tab) and has the methods the Edit commands call:

```ts
export class NoteDocument {
  /** The text the note opens with. */
  readonly start = input('');

  readonly text = linkedSignal(() => this.start());
  /** Changed since it was opened or saved. */
  readonly dirty = signal(false);
  readonly words = computed(() => {
    const text = this.text().trim();
    return text ? text.split(/\s+/).length : 0;
  });
  readonly lines = computed(() => this.text().split('\n').length);

  protected readonly notes = inject(Notes);
  protected readonly zoom = computed(() => parseInt(this.notes.zoom(), 10) / 100);
  private readonly tab = inject(GrdTabContext);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');

  constructor() {
    this.notes.add(this.tab.tabId, this);
    inject(DestroyRef).onDestroy(() => this.notes.remove(this.tab.tabId));
    // A new note is typed into at once.
    afterNextRender(() => this.area().nativeElement.focus());
  }

  // insert(text) and changeCase(to) are the commands of the Edit menu.

  /** The note was saved: the mark on its tab goes. */
  saved(): void {
    this.dirty.set(false);
    this.tab.setDirty(false);
  }

  protected edit(value: string): void {
    this.text.set(value);
    this.dirty.set(true);
    this.tab.setDirty(true);
  }
}
```

`src/app/properties-tool.ts` is the tool on the right: the properties of the active document in a property grid (`grd-property-grid`). A component that is not the application reads the active document from `GrdEngineEvents`, the service of the events of every engine. The rows are plain objects (`GrdProperty`): the text of the note is only read (`kind: 'readonly'`), and Wrap lines (a check box) and Zoom (a list) change the view of all the notes:

```ts
const VIEW: GrdProperty[] = [
  {
    id: 'wrap',
    label: 'Wrap lines',
    category: 'View of all the notes',
    kind: 'boolean',
    defaultValue: true,
    description: 'Long lines go on in the next line. The same as View › Wrap lines.',
  },
  {
    id: 'zoom',
    label: 'Zoom',
    category: 'View of all the notes',
    kind: 'select',
    options: ZOOMS.map((zoom) => ({ value: zoom, label: zoom })),
    defaultValue: '100%',
    description: 'The size of the text. The same as the select of the toolbar.',
  },
];
```

The grid gets the values as one object (`values`, by the `id` of the property), computed from the signals of the note, so it follows the note while it is typed into. A change by the user comes as `propertyChanged`, and the tool writes it into the shared settings:

```ts
export class PropertiesTool {
  private readonly notes = inject(Notes);
  /** The tab of the document that had the focus last; it stays while the user clicks into a tool. */
  protected readonly document = inject(GrdEngineEvents).activeDocumentTab();
  private readonly note = computed(() => this.notes.get(this.document()?.tabId));

  protected readonly properties = computed(() => (this.note() ? NOTE : PAGE));

  /** The values of the rows, by the id of the property. They follow the note as it is typed into. */
  protected readonly values = computed<Record<string, unknown>>(() => {
    const note = this.note();
    const view = { wrap: this.notes.wrap(), zoom: this.notes.zoom() };
    const title = this.document()?.title ?? '';
    if (!note) return { title, kind: 'a page, not a note', ...view };
    return {
      title,
      changed: note.dirty() ? 'yes' : 'no',
      words: note.words(),
      characters: note.text().length,
      lines: note.lines(),
      ...view,
    };
  });

  /** The user changed a row: only the view can be changed. */
  protected changed(change: GrdPropertyChange): void {
    if (change.id === 'wrap') this.notes.wrap.set(change.value === true);
    if (change.id === 'zoom') this.notes.zoom.set(String(change.value));
  }
}
```

The grid fills the tool (`:host` is a column as tall as the panel, the grid has `flex: 1`); it has no toolbar here (`[showToolbar]="false"`), and the description of the active row stands under it.

`src/app/app-icons.ts` has the icons of the commands (SVG texts), and `src/app/app.config.ts` puts them into the registry before the first component draws:

```ts
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { GrdIcons } from '@gridify/studio';
import { APP_ICONS } from './app-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The icons of the commands are in the registry before the menu, the toolbar and the status bar draw them.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
```

`src/styles.scss`:

```scss
/* The themes, the density of the controls and the text styles of Gridify. */
@use '@gridify/studio/styles';

/* The application fills the window: a column of the header, the menu bar, the toolbar, the engine and the status bar. */
html,
body {
  height: 100%;
  margin: 0;
  font-family: var(--grd-font-main);
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}
```

## How it fits together

### One column

The header (`grd-app-header`) has the name of the application and the selects of the theme and the density; the menu bar under it has the menus and, in its title slot (`grdMenuBarTitle`), the name of the active document. They are two bars, as in a desktop program (the IDE of the playground has them the same way): the menu bar could take the name and the selects into its slots (`grdMenuBarStart`, `grdMenuBarEnd`), but then the menus share the width with them and fold into the ☰ button sooner.

`App` is a flex column of the height of the window. The bars keep their height, the engine takes the rest (`flex: 1; min-height: 0`). The toolbar has no frame of its own (`--grd-toolbar-border-width` is `0`, it stands under the menu bar), so the line under it is a `border-bottom` of the application. **View › Toolbar** and **View › Status bar** take the bars out of the template with `@if`, and the engine grows into the room.

### One command in three places

`grdMenuItemOf` and `grdToolbarItemOf` turn a `GrdCommand` into the item of each. The menu bar and the popup menu show the text with its access key (`&New document`: N) and the shortcut next to the item; the toolbar shows the same text without the `&` and writes the shortcut into the tooltip (**New document (Alt+N)**). The menu bar has `[shortcuts]="true"`: it registers the shortcuts of its items and runs them while no menu is open, and checks `enabled` on every key press. The toolbar has `[shortcuts]="false"`, so a key is not registered twice; the shortcut still works while the toolbar is hidden.

An item of a command runs the command itself (`run`), and then the toolbar tells `(action)` as for any item, with the name of the command as the `action`. **Wrap lines** is a command that is on or off (`checked`): a check mark in the menus, a toggle button in the toolbar. The toolbar never writes its state, the command's `run` turns it, so one press is one change, and the menu, the popup menu and the toggle follow the same signal. The split button **UPPER CASE** runs UPPER CASE with its main part; a choice of its menu tells `case` with the value of the choice (`lower`, `title`), which `onToolbar` runs. The select has written its signal before `(action)` comes.

**Alt+N** and not Ctrl+N: the browser keeps Ctrl+N (a new window), Ctrl+T and Ctrl+W for itself, and a page never gets them. Ctrl+Alt+N is no good either: on Windows, Ctrl+Alt is AltGr on many keyboards (Czech, German, Polish), and the library leaves a key typed with AltGr alone, because it types a character. **Ctrl+S** (⌘S) is the page's: the menu bar takes it, also in the text area, and the browser does not save the page. On a Mac, Option with a letter types a character in a text field, so there Alt+N works outside the note; the menu and the toolbar work everywhere. `Mod` in a shortcut is Ctrl, and ⌘ on a Mac.

A press on the toolbar does not take the focus (`keepFocus`), so the caret stays in the note and **Insert date and time** puts the date where the caret is. A field of the toolbar (here the select of the zoom) still takes the focus when it is pressed.

### The popup menu

`GrdPopupMenu` is a service: any code that can inject it opens a menu, there is no tag in a template. `open(items, options)` takes the same `GrdMenuItem[]` as the menu bar, so the items of the commands (`grdMenuItemOf(commands.newDocument)`) go into it as they are, with a heading (`header: true`), separators, a check mark (`checked`), a submenu (`children`) and a greyed item (`enabled: false`; **Print…** is there only to show one). The items are made when the menu opens, so they say the state of that moment (Save is greyed out until the note is changed). A shortcut in a popup menu is only written: the menu bar runs it.

Where the menu opens: `at` is a point, or the `MouseEvent` itself; `anchor` would put it under an element (the drop-down of a button). The menu never sticks out of the window: near the bottom of the window it moves up, near the right edge to the left. A click on a button made with Enter or Space has no pointer, and neither has the `contextmenu` of the Menu key or Shift+F10: the popup menu sees that in the event and opens the menu as from the keyboard, with the first item highlighted, at the element of the event: under a small one, and in the top left corner of a large one like this panel (under it, it would open far away). So the panel passes the event as it is, whatever made it. For the context menu of an element there is also the directive `grdContextMenu` of the library (the right mouse button, the Menu key and Shift+F10, placed the same way); the panel here wants the left button as well, so it calls the service itself.

`open` gives back a ref: `closed` is a promise of the chosen item (`null` when the menu was closed without a choice: Esc, a click outside), `close()` closes it from code. Only one popup menu is open at a time; a new one closes the old one. The item runs its `run` itself, the panel only tells the status bar what it was.

The panel is a tool of the engine, so it can be moved, docked elsewhere, closed and opened again from **View** (the block `grd:tools` lists it).

### The active document

The engine keeps the document that had the focus last (`activeDocumentTab()`, a signal): it stays while the user clicks into the Properties, so the Edit commands still act on the note. A note tells `Notes` that it is open (the id of its tab, from `GrdTabContext`), and the commands find it there: `notes.get(document()?.tabId)`. **About** is a page of HTML, not a note, so the Edit commands are greyed out while it is active and the status bar has no words.

The number of documents is the length of `documents()`, a signal of the engine: the open documents in the order of the Window menu (the block `grd:documents`), which changes when a document is opened, closed or renamed, so a `computed` that reads it follows.

### The blocks of the engine

`viewSources` on the engine registers its View menu as named blocks of items. `{ source: 'grd:tools' }` is the tool panels (here Properties and Popup menu) with a check mark while they are open: a press closes it, the next one opens it where it was. `{ source: 'grd:restore-layout' }` is **Restore layout**, `{ source: 'grd:documents' }` the open documents, numbered, the active one checked. The menu says only where they go; the engine fills them when the menu opens.

### Not enough room

- **The menu bar** folds the menus that do not fit into a ☰ button, from the right. `Alt+letter` still opens them.
- **The toolbar** puts what does not fit into a panel behind a chevron at the end, the lowest `priority` first (here the case, then the date, the wrapping, the zoom, Close and Save; **New document** last). A separator never stands at an end.
- **The status bar** drops its items in the order of their `priority` into a "…" list; the message (`shrink`) never goes, it is cut with an ellipsis.

## What you get without writing any of it

- **The keys of the popup menu**: the arrows (skipping the greyed items and the heading), → and ← into and out of a submenu, Enter, a letter by its access key, Esc; a click outside closes the menu, and it never sticks out of the window.
- **The keys of the menu bar**: Alt+letter opens a menu, a lone Alt focuses the bar, the arrows go along the menus and into the submenus, a letter picks an item by its access key, Esc closes; the access keys are underlined while Alt is held.
- **The shortcuts** of the menu items, written for the platform (Ctrl+S, on a Mac ⌘S), registered and run by the menu bar, also inside a collapsed menu.
- **One stop of Tab for the toolbar**, the arrows inside it, the tooltips with the shortcuts, the menus of the split button and the list of the select attached to their buttons.
- **The status bar**: the choices of an item in a list that opens upwards with a check mark, a button for an item with `run`, the spinner of `busy`, the bar of `progress`, a message read by the screen reader (`live`).
- **The engine**: the tabs, the dot of a changed tab (`setDirty`), dragging and docking (the tools on the right too), the menu of a tab, and the View and Window menus from its blocks.
- **The theme and the density**: every bar follows the selects in the header, light and dark.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 100 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new menu-toolbar --style=scss --ssr=false --skip-tests
   cd menu-toolbar
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`). The library is one file in its package, so the engine, the bars and the controls of the toolbar go into the first load (about 1.2 MB before compression).

4. Write `src/styles.scss` as above.

5. Add `src/app/app-icons.ts`, `notes.ts`, `note-document.ts`, `commands.ts`, `properties-tool.ts` and `popup-tool.ts`, write `app.config.ts` as above and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too.

6. Run it:

   ```
   ng serve
   ```
