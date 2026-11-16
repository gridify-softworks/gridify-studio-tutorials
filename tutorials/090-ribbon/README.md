# 090 – Ribbon

This tutorial shows how to build a ribbon over a docking engine, like the one of a small word processor, and how to connect its controls to the document the user is in. You will learn how to:

- make the tabs, the sections and the buttons of a ribbon: large and small buttons, a split button, toggles, shortcuts and KeyTips;
- use the controls of a ribbon: a combobox, a spinner, color pickers, a toggle group, a menu button, a gallery, a check box and radios, a select, a table picker and a progress bar;
- let the sections shrink and collapse in an order you choose when the window gets narrower (`collapsePriority`, `collapsible: false`);
- run one command from the ribbon, the quick access toolbar and a shortcut (**New document**, Alt+N);
- make the ribbon show the state of the active document.

The docking engine below the ribbon holds the documents and a Guide. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 090
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30090. Press **New document** and its arrow (Letter, Report), type into a document, and press **Bold** (or Ctrl+B in the text). Click another document tab: Bold, Italic and Underline show that document. On **Controls** change the font, the size, the colors, the alignment, the line spacing and the style, give the page a frame, a width, a color of paper and a table, and watch the words count towards the goal. On **Collapsing** make the browser window narrower and watch the sections shrink and then collapse into buttons, one after another. Press Alt for the KeyTips and Alt+Q to search a command. Switch the theme and the density in the header.

## The code

`src/app/app.ts` puts the header, the ribbon and the engine in a column. The ribbon gets its tabs, the quick access toolbar, `collapsible` (shrinking) and `search` (Alt+Q); its active tab is a signal of the `Editor`, so the Guide knows it. The engine tells the `Editor` which document is active and which tab was closed:

```html
<grd-app-header
  productName="Ribbon"
  subtitle="three tabs, many controls, collapsing sections, a docking engine"
  icon="grd:logo"
  preferences="theme density"
/>
<grd-ribbon
  [tabs]="tabs"
  [(activeTab)]="editor.ribbonTab"
  [quickAccess]="quickAccess"
  [collapsible]="true"
  [search]="true"
  (action)="onAction($event)"
/>
<grd-docking-engine
  [layoutStorageKey]="null"
  [defaultLayout]="layout"
  (tabActiveChanged)="editor.activeId.set($event.document?.tabId ?? null)"
  (tabClosed)="editor.remove($event.tabId)"
/>
```

The layout of the engine has an empty document panel and the Guide; `layoutStorageKey` is `null`, so nothing is saved and a reload starts again from here:

```ts
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    { type: 'panel', role: 'document', size: 74, activeTab: 0, collapsed: false, tabs: [] },
    {
      type: 'panel',
      role: 'tool',
      size: 26,
      activeTab: 0,
      collapsed: false,
      tabs: [{ role: 'tool', title: 'Guide', componentType: GuideTool }],
    },
  ],
};
```

Every command of the ribbon comes to one method, whatever started it: a click, a shortcut, a KeyTip, the command search or the quick access toolbar. `item.action` says which command it is and `value` what was chosen:

```ts
protected onAction({ item, value }: GrdRibbonActionEvent): void {
  const editor = this.editor;
  switch (item.action) {
    // Basics
    case 'new':
      return this.newDocument((value as Template | undefined) ?? 'blank');
    case 'close':
      return this.close(editor.activeId());
    case 'close-all':
      return editor.documents().forEach((doc) => this.close(doc.id));
    case 'duplicate':
      return this.open(editor.create('blank', editor.active() ?? undefined));
    case 'bold':
    case 'italic':
    case 'underline':
      return editor.patch({ [item.action]: value === true });
    case 'clear':
      return editor.patch({
        ...STYLES['normal'],
        underline: false,
        highlight: 'none',
        style: 'normal',
      });
    case 'reset-layout':
      this.engine().resetLayout();
      return;
    // Controls
    case 'font':
      return editor.patch({ font: String(value) });
    case 'size':
      return editor.patch({ size: Number(value) });
    case 'color':
    case 'highlight':
    case 'spacing':
    case 'paper':
      return editor.patch({ [item.action]: String(value) });
    case 'align':
      return editor.patch({ align: value as DocFormat['align'] });
    case 'style':
      return editor.patch({ ...STYLES[String(value)], style: String(value) });
    case 'frame':
      return editor.patch({ frame: value === true });
    case 'wide':
    case 'narrow':
      return editor.patch({ width: item.action });
    case 'table':
      return editor.patch({ table: tableOf(value) });
    // Collapsing
    case 'insert':
      return editor.insert(`[${grdRead(item.label)}]`);
    case 'symbol':
      return editor.insert(String(value ?? '§'));
  }
}
```

**New document** is a document of the `Editor` and a component tab of the engine. The tab gets the id of the document, so the events of the engine name it, and the document as the input of its component:

```ts
/** A new document: the editor makes it, the engine opens its tab. */
private newDocument(template: Template): void {
  this.open(this.editor.create(template));
}

private open(doc: Doc): void {
  this.engine().openComponentTab({
    id: doc.id,
    title: doc.title,
    role: 'document',
    icon: 'app:page',
    componentType: DocumentPage,
    inputs: { doc },
  });
}
```

`src/app/editor.ts` holds the documents. A document is its text and its format, both signals; the `Editor` knows the active one, and the ribbon reads the format of that one:

```ts
readonly documents = signal<readonly Doc[]>([]);
/** The tab id of the document the user works in (the engine tells it: `tabActiveChanged` in `App`). */
readonly activeId = signal<string | null>(null);
readonly active = computed(
  () => this.documents().find((doc) => doc.id === this.activeId()) ?? null,
);
readonly format = computed(() => this.active()?.format() ?? null);
readonly noDocument = computed(() => this.active() === null);
readonly words = computed(() => countWords(this.active()?.text() ?? ''));

/** The tab of the ribbon that is shown (the Guide follows it). */
readonly ribbonTab = signal<string | undefined>('basics');
/** Shows the word count under every document (the toggle Word count, two-way). */
readonly showCount = signal(true);
/** How many words the documents should have (the spinner Goal). */
readonly goal = signal(50);
```

`src/app/ribbon-tabs.ts` is the ribbon: plain data, made once by a function that gets the `Editor`. Two helpers make the items short: `field` reads a field of the format of the active document, and `needsDocument` turns a control off while no document is open, with the reason as its tooltip:

```ts
// A field of the format of the active document, for the controls that show it.
const field = <K extends keyof DocFormat>(key: K, empty: DocFormat[K]) =>
  computed(() => editor.format()?.[key] ?? empty);
// The controls that change a document are off while no document is open, and say why.
const needsDocument = {
  disabled: editor.noDocument,
  disabledReason: 'Open a document first (New document, Alt+N).',
};
// A command of the tab Collapsing: it writes its name at the end of the document.
const insert = (item: GrdRibbonItem): GrdRibbonItem => ({
  action: 'insert',
  ...needsDocument,
  ...item,
});
```

**Basics.** New document is a large split button: a press on the button opens a blank document, the arrow a menu of the other kinds. It has a shortcut (`Alt+N`), its own KeyTip (`N`) and a rich tooltip (`description`):

```ts
{
  type: 'split-button',
  inputs: { size: 'large' },
  col: 1,
  icon: 'app:doc-new',
  label: 'New document',
  action: 'new',
  shortcut: 'Alt+N',
  keytip: 'N',
  description:
    'Opens a new document in the engine below. The arrow chooses what is in it.',
  choices: [
    { label: 'Blank document', value: 'blank', icon: 'app:page' },
    { label: 'Letter', value: 'letter', icon: 'app:note' },
    { label: 'Report', value: 'report', icon: 'app:chart' },
  ],
},
```

Bold is a toggle button whose state is the bold of the active document (a `computed`, so the ribbon only shows it and `onAction` changes it), with the shortcut Ctrl+B:

```ts
{
  type: 'toggle-button',
  col: 1,
  row: 1,
  icon: 'app:bold',
  label: 'Bold',
  action: 'bold',
  shortcut: 'Ctrl+B',
  checked: field('bold', false),
  ...needsDocument,
},
```

Word count is a toggle given a writable signal instead: the ribbon sets it itself, and the documents read it.

```ts
{
  type: 'toggle-button',
  inputs: { size: 'large' },
  col: 1,
  icon: 'app:count',
  label: 'Word count',
  checked: editor.showCount,
},
```

**Controls.** Each control reads a field of the format and sends a change to `onAction`. The Font section has a combobox (type or choose), a spinner and two color pickers:

```ts
{
  id: 'font',
  title: 'Font',
  columns: '84px 84px',
  items: [
    {
      type: 'combobox',
      col: 1,
      row: 1,
      colSpan: 2,
      choices: FONTS,
      value: field('font', ''),
      tooltip: 'Font',
      action: 'font',
      ...needsDocument,
    },
    {
      type: 'spinner',
      col: 1,
      row: 2,
      colSpan: 2,
      label: 'Size',
      value: field('size', 16),
      inputs: { min: 8, max: 72, unit: 'px' },
      action: 'size',
      ...needsDocument,
    },
    {
      type: 'color-picker',
      col: 1,
      row: 3,
      icon: 'app:font',
      label: 'Font color',
      value: field('color', 'auto'),
      inputs: { automatic: '#000000', moreColors: true },
      action: 'color',
      ...needsDocument,
    },
    {
      type: 'color-picker',
      col: 2,
      row: 3,
      icon: 'app:highlighter',
      label: 'Highlight',
      value: field('highlight', 'none'),
      inputs: { allowNone: true },
      action: 'highlight',
      ...needsDocument,
    },
  ],
},
```

The alignment is a toggle group of four buttons, one of them on (`exclusive`); the line spacing a menu button that marks its value:

```ts
{
  type: 'toggle-group',
  row: 1,
  inputs: { exclusive: true },
  label: 'Alignment',
  action: 'align',
  choices: ALIGNMENTS.map(({ value, label }) => ({
    value,
    label,
    icon: `app:align-${value}`,
    checked: computed(() => editor.format()?.align === value),
  })),
  ...needsDocument,
},
{
  type: 'dropdown-button',
  row: 2,
  icon: 'app:spacing',
  label: 'Line spacing',
  action: 'spacing',
  value: field('spacing', '1.5'),
  choices: [
    { label: '1.0', value: '1' },
    { label: '1.15', value: '1.15' },
    { label: '1.5', value: '1.5' },
    { label: '2.0', value: '2' },
  ],
  ...needsDocument,
},
```

The goal shows a progress bar and a spinner. The progress bar only shows a value (it never changes it), and its text is a function of yours; the spinner gets the writable signal of the goal:

```ts
{
  id: 'goal',
  title: 'Goal',
  columns: '150px',
  items: [
    {
      type: 'progress-bar',
      row: 1,
      label: 'Words',
      value: computed(() => Math.min(100, (editor.words() / editor.goal()) * 100)),
      inputs: { showValue: true, valueText: () => `${editor.words()} / ${editor.goal()}` },
    },
    {
      type: 'spinner',
      row: 2,
      icon: 'app:goal',
      label: 'Goal',
      value: editor.goal,
      inputs: { min: 10, max: 1000, step: 10 },
    },
  ],
},
```

The gallery, the check box, the radios, the select and the table picker of the Page section are written the same way (see the file).

**Collapsing.** A section with `compact` items (or `compactColumns`) can shrink: here a large button becomes a small one in a single column. `collapsePriority` says when (lower first), and `collapsible: false` keeps a section from collapsing into a button:

```ts
{
  // Shrinks last (3), and never collapses into a button.
  id: 'pages',
  title: 'Pages',
  collapsePriority: 3,
  collapsible: false,
  columns: 3,
  compactColumns: 1,
  items: [
    insert({
      type: 'large-button',
      col: 1,
      icon: 'app:cover',
      label: 'Cover page',
      compact: { type: 'button', col: 1, row: 1 },
    }),
    insert({
      type: 'large-button',
      col: 2,
      icon: 'app:page',
      label: 'Blank page',
      compact: { type: 'button', col: 1, row: 2 },
    }),
    insert({
      type: 'large-button',
      col: 3,
      icon: 'app:page-break',
      label: 'Page break',
      compact: { type: 'button', col: 1, row: 3 },
    }),
  ],
},
```

`src/app/document-page.ts` is the component of a document: a sheet of paper with a `textarea` in the format of the document, the table and the word count under it. A new document takes the focus, so the user types into it at once:

```ts
constructor() {
  // A new document takes the focus, so the user types into it at once (and the shortcuts of the ribbon work there).
  afterNextRender(() => this.area().nativeElement.focus());
}
```

`src/app/guide-tool.ts` is the tool on the right: it shows what to try on the tab of the ribbon that is open (`Editor.ribbonTab`). `src/app/app-icons.ts` has the icons of the ribbon (SVG in `currentColor`, so they take the color of the ribbon in every theme), and `src/app/app.config.ts` registers them:

```ts
// The icons of the ribbon are in the registry before the first component is drawn.
provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
```

`src/styles.scss`:

```scss
/* The themes, the density of the controls and the text styles of Gridify. */
@use '@gridify/studio/styles';

/* The page is the header, the ribbon and the engine in a column: the body takes the background and the text color of the theme. */
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

### The ribbon and the documents

The ribbon owns no state of the documents. Its items read signals, and what the user does comes back as an `action`:

| In the item                       | What the ribbon does                                | Here                                         |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `computed()` (`value`, `checked`) | shows it, and only sends the change to `(action)`   | every control that shows the active document |
| a writable `signal()`             | shows it, sets it itself and sends the action       | Word count, Goal                             |
| `disabled` / `disabledReason`     | turns the item off (its shortcut too) and shows why | the controls while no document is open       |

So the ribbon always shows the active document: when the user clicks another document tab, the engine emits `tabActiveChanged`, the `Editor` gets the new `activeId`, and every `computed` of the ribbon follows. `$event.document` is the last document that had the focus, so a click into the Guide (a tool) does not change what the ribbon shows.

The format here is of the whole text (it is a tutorial, not a word processor), so a document is a `textarea` with styles bound to the format.

### Basics

- **Buttons**: `large-button` and `button` (small), `styled-button` in a color of the theme (Reset layout), `split-button` (a button and a menu), `toggle-button` (on and off, `aria-pressed`). A section is a grid: `columns`, and `col` and `row` of each item.
- **Shortcuts**: `shortcut` of an item (`Alt+N`, `Ctrl+B`) is registered with `GrdShortcuts` and runs the item exactly like a click, also from the text of a document (only the keys that type or edit text stay with the text field). A disabled item does not take its shortcut.
- **KeyTips**: press and release Alt, and every tab and item gets a letter (`keytip` fixes one: B, C and L for the tabs, N for New document).
- **Quick access toolbar** (`quickAccess`): the items at the left of the tab bar, on every tab.
- **Command search** (`search`, Alt+Q): it finds every command of every tab by its label, also the choices of the menus.
- **Hiding the ribbon**: a double click on a tab hides the body, a click on a tab shows it over the documents.

### Controls

What each control sends to `onAction` as `value`:

| Control                         | `value`                                    | Here                   |
| ------------------------------- | ------------------------------------------ | ---------------------- |
| `combobox`                      | the text (or the choice) that is confirmed | Font                   |
| `spinner`                       | a number, within `min` and `max`           | Size, Goal             |
| `color-picker`                  | a color, `'auto'` or `'none'`              | Font color, Highlight  |
| `toggle-group` with `exclusive` | the value of the button that is on         | Alignment              |
| `dropdown-button`               | the value of the chosen entry              | Line spacing           |
| `gallery`                       | the value of the chosen tile               | Styles                 |
| `checkbox`, `radio`             | `true` / `false` (a radio `true`)          | Frame, Wide and Narrow |
| `select`                        | the value of the chosen option             | Paper                  |
| `table-picker`                  | `'4x3'` (columns × rows), or a choice      | Table                  |
| `progress-bar`                  | nothing: it only shows a value             | Words                  |

The radios Wide and Narrow are one group (`inputs: { group: 'width' }`); each has a `checked` of its own from the format, and `onAction` sets the width. The gallery shows the style that is set; a tile sets the whole style (font, size, bold, italic, color) at once.

### Collapsing

With `[collapsible]="true"` the ribbon fits its sections into the width it has, in two rounds: first the sections that have a compact form **shrink** (the `compact` of their items, `compactColumns`), one after another, then they **collapse** into a button that opens the whole section. The order is `collapsePriority` (lower first, `0` when it is not given), and between equal priorities from right to left. `collapsible: false` leaves a section out of the second round. Here:

| Section       | `collapsePriority` | Compact form                | Shrinks | Collapses |
| ------------- | ------------------ | --------------------------- | ------- | --------- |
| Symbols       | `-1`               | a small split button        | 1st     | 1st       |
| Text          | `0`                | small buttons in one column | 2nd     | 2nd       |
| Comments      | `0`                | none                        | –       | 3rd       |
| Links         | `1`                | icons only                  | 3rd     | no gain   |
| Illustrations | `1`                | small buttons in one column | 4th     | 4th       |
| Pages         | `3`                | small buttons in one column | 5th     | never     |

Comments has no compact form, so it does not shrink and goes straight to the second round; Text comes before it, being further to the right with the same priority. Links in its compact form is three icons, narrower than a collapsed section would be, so the ribbon skips it in the second round without being told: it takes only a step that makes a section narrower, and collapsing Links would hide its commands and gain no room. Pages says it with `collapsible: false`: it never collapses, whatever its width. The order comes from the data; the widths of the sections decide when each step happens (and whether it gains anything), and the ribbon measures them itself (again after a change of the density or the language). The body is not drawn while it measures, so the sections never jump.

### The documents in the engine

`openComponentTab` opens the document as a component tab of the role `document`, into the document panel. The tab gets the id of the document (`id`), and the component gets the document (`inputs: { doc }`). Close and Close all close the tabs through the API of the engine (`api.closeTab(id)`), and the engine tells the `Editor` with `tabClosed`, so a tab closed by its cross goes away from the `Editor` the same way. Reset layout needs nothing more: the engine closes the tabs of the layout it throws away with `tabClosed` too (`reason: 'layout'`).

### The size of the first load

The library is one file in its package, and the ribbon and the docking engine together are a little over 1 MB of the first load. That is why `angular.json` of this tutorial has an `initial` budget of `maximumWarning: 1.5MB` (`maximumError: 2MB`); with the 1 MB of the tutorials before, `ng build` would warn.

## What you get without writing any of it

- **The layout of the sections**: a grid of rows of the same height on every tab, the titles under the sections, and the sections measured and fitted to the width.
- **The keyboard**: the arrows move between the tabs and the controls, Tab goes through them, Enter and Space press, ↓ opens a menu, the KeyTips and the command search.
- **The menus, lists and panels** of the controls (the split button, the menu button, the palette, the gallery, the table picker, a collapsed section) are the popups of the library: they stay in the window, close with Esc and give the focus back.
- **Tooltips**: the label and the shortcut, the rich tooltip of New document, and the reason of a control that is off.
- **The theme and the density**: the ribbon, its controls and its icons follow the selects in the header, in light and dark; the documents stay paper.
- **Accessibility**: the tabs are a `tablist`, the sections named groups, the toggles `aria-pressed`, the menus and lists announced by their controls.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 090 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new ribbon --style=scss --ssr=false --skip-tests
   cd ribbon
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1.5MB`, `maximumError: 2MB`), see _The size of the first load_.

4. Write `src/styles.scss` as above.

5. Add `src/app/app-icons.ts`, `editor.ts`, `ribbon-tabs.ts`, `document-page.ts` and `guide-tool.ts`, write `src/app/app.config.ts` as above (keep `provideBrowserGlobalErrorListeners()`, the routes can go), and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go, and so can `app.routes.ts`.

6. Run it:

   ```
   ng serve
   ```
