# 091 – Ribbon from a file

This tutorial shows how to keep a ribbon in a file instead of in TypeScript, and how to load it. The ribbon is a JSON file in the assets of the application; it has many controls (buttons, a split button, toggles, a combobox, a spinner, color pickers, a toggle group, a gallery, a table picker, check boxes, radios, selects, a progress bar and a progress ring), a contextual tab, and sections that collapse. You will learn how to:

- load a plain list of tabs (the JSON of `[tabs]`) with `grdLoadRibbon`, and lay the signals of the application over its items by their `id`;
- load the file of the Ribbon Editor, which says more than the list of tabs: the options of the ribbon (`colWidth`, `search`, `collapsible`...), the functions that the texts and values call (`tr('Home')`, `s.field('fontSize', 11)`, `{"$fn": "percentText"}`) and the signals that properties are bound to (`{"$bind": "noSelection"}`);
- register the functions and the signals the file names, so that `tr` translates the texts when the file is loaded and a signal drives a control;
- see what the loader does with something it cannot use: a list of problems and an error on the console.

The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 091
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30091. The ribbon is the file `public/ribbons/ribbon.json`. Press **Copy**: **Paste** was off (nothing to paste), and now it is on. Switch off **Some text is selected** and Cut, Copy and Format Painter go off, with a reason in their tooltip. Press **Bold**: the state under _The document_ follows. Switch on **A picture is selected** and the contextual tab **Picture Tools** appears. On **View** press **Type 10 words** and the progress bar and the ring move. Choose **Deutsch**: the texts of the ribbon are translated and the ribbon is loaded again. Then choose **tabs.json**: it is the same ribbon as a plain list of tabs, and it works the same where the application connects it.

## The files

Both files are in `public/ribbons`, so the application gets them from its own address (`ribbons/ribbon.json`). The first is the file of the editor: an object with the functions it needs, the options of the ribbon, and the tabs.

```json
{
  "functions": ["s.field:2", "s.flag:2"],
  "options": {
    "defaultRows": 3,
    "colWidth": 24,
    "collapsible": true,
    "search": true,
    "searchPlaceholder": "Find a command"
  },
  "tabs": [
    {
      "id": "home",
      "label": { "$expr": "tr('Home')" },
      "sections": [
        {
          "id": "clipboard",
          "title": { "$expr": "tr('Clipboard')" },
          "items": [
            {
              "type": "button",
              "id": "cut",
              "label": { "$expr": "tr('Cut')" },
              "action": "cut",
              "disabled": { "$bind": "noSelection" }
            }
          ]
        }
      ]
    }
  ]
}
```

JSON cannot hold a function or a signal, so the file names them and the application registers them under those names:

| In the file                              | What the loader puts there                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `{ "$expr": "tr('Home')" }`              | what the registered function `tr` returns for `'Home'`, once, while loading: a text                                      |
| `{ "$expr": "s.field('fontSize', 11)" }` | what `s.field` returns for those arguments: here the signal of the font size, so the spinner follows it and writes to it |
| `{ "$bind": "noSelection" }`             | the signal registered as `noSelection`                                                                                   |
| `{ "$fn": "percentText" }`               | the function registered as `percentText` (the text of the progress bar)                                                  |

Only a call with plain arguments (a text, a number, `true`, `false`, `null`) is run, and only a function that the application registered. Nothing in the file is evaluated as code, so a file from a server can run nothing of its own.

The second file, `tabs.json`, is a plain list of tabs: exactly the value of `[tabs]` as JSON. It is the first file with everything that needs the application taken out: the texts are plain English, the fields are the values they start with, and no property is bound to a signal. Its items have an `id`, so the application can connect them in code.

Both files can be opened in the Ribbon Editor (File › Open file…): the editor shows the same ribbon, with the functions of the file in its Ribbon Options window, and writes it back in the same format.

## The code

`src/app/app.ts` fetches the file and gives it to `grdLoadRibbon`. The result has the tabs, the options that the file carried, and the problems:

```ts
// A file that cannot be fetched or is not JSON is `undefined` here: the loader reports it as a definition that is not a ribbon.
const definition: unknown = await fetch(`ribbons/${file}`)
  .then((response) => (response.ok ? response.json() : undefined))
  .catch(() => undefined);
const result = grdLoadRibbon(definition, {
  ...bindings,
  onProblem: (problem) => {
    problems.push(problem);
    console.error(`Ribbon ${file}: ${problem.message}`);
  },
});
this.loaded.set({ file, tabs: result.tabs, options: result.options, problems });
```

The ribbon is drawn from them. The options of the file are laid over the ones of the application, because a plain list has none: the application says `colWidth` (the cells of the grid in the file are 24 px wide) and `collapsible`, and the file of the editor says its own:

```html
@if (loaded(); as ribbon) {
<grd-ribbon
  [tabs]="ribbon.tabs"
  [colWidth]="options().colWidth"
  [collapsible]="options().collapsible"
  [search]="options().search"
  [searchPlaceholder]="options().searchPlaceholder"
  (action)="onAction($event)"
/>
}
```

Call `grdLoadRibbon` once (here when the file or the language changes), not in the template: it copies the definition, so the controls can write their values into the copy and the file stays as it was.

### The file of the editor

The file names what it needs, so the application registers exactly that: the functions (a call in the file is looked up here by its name) and the signals (`{ "$bind": "name" }`):

```ts
return {
  functions: {
    tr: translator(language),
    's.field': (name: string, fallback: unknown) => s.field(name, fallback),
    's.flag': (name: string, fallback: boolean) => s.flag(name, fallback),
    percentText: (_value: number, percent: number) => `${Math.round(percent)} %`,
  },
  signals: {
    noSelection: s.noSelection,
    noClipboard: s.noClipboard,
    noPicture: s.noPicture,
    bold: s.bold,
    // ...
  },
};
```

`tr` is one of the translations of the library (`t`, `tr`, `tx` and `tk`): a file may call them without the application registering anything, and the loader translates with `GRD_I18N`. This ribbon has texts of its own (`src/app/texts.ts`), so it registers its translator as `tr`, and that one wins. `tr('Home')` is a call, and its result is a text: the label is that text from then on. So a new language needs the file loaded again, which the application does when the language changes. A property that has to change while the application runs is bound to a signal instead (`{ "$bind": "title" }`), or the function returns a signal: `s.field('fontSize', 11)` returns a writable signal that the application keeps, the first time with the value the file gives. The ribbon reads it, and a spinner that the user changes writes into it:

```ts
field<T>(name: string, fallback: T): WritableSignal<T> {
  let found = this.fields.get(name);
  if (!found) this.fields.set(name, (found = signal<unknown>(fallback)));
  return found as WritableSignal<T>;
}
```

A signal that is writable (Bold, the zoom) is written by the control. A computed one (the alignment, the layout) only shows the state, and the application changes it when `(action)` arrives:

```ts
case 'align':
  s.align.set(value as 'left' | 'center' | 'right');
  break;
```

### A plain list of tabs

A list has no functions and no signals, so it needs nothing registered. What the application wants to drive, it lays over the items by their `id` (and over a tab by its `id`, a section by `<tab id>/<section id>`):

```ts
return {
  items: {
    paste: { disabled: s.noClipboard, disabledReason: 'Cut or copy something first.' },
    cut: needsSelection,
    bold: { checked: s.bold },
    fontSize: { value: s.field('fontSize', 11) },
    // ...
  },
  tabs: { pictureTools: { hidden: s.noPicture } },
};
```

The binding by `id` is laid over what the file says, so it wins. The id of an item is the handle of the application: it has to be unique in the whole ribbon.

### What the loader says

Switch off **Register the function percentText**. The progress bar of the _Status_ section writes its value as the library does, a percent in the language of the application, instead of the text of the application (the file refers to a function that is not registered, `{ "$fn": "percentText" }`), the list under _The file_ says `The function "percentText" is not registered.`, and the console has the same as an error. Every problem is in the `problems` of the result, and without `onProblem` the loader writes each of them to the console itself. The kinds are a definition that is not a list of tabs or an option that is not valid (`invalid`), a function that is not registered or that throws (`function`), code that is not a call with plain arguments (`expression`), a signal that is not registered (`signal`), and a binding by `id` for something the file does not have (`binding`). The ribbon is made from the rest.

### The state

`src/app/doc-state.ts` is the state of the document: signals for the selection, the clipboard, the switches (`bold`, `ruler`, `zoom`), the choices (`align`, `layout`) and the words, and the registry of the fields. The ribbon never owns any of it. `src/app/texts.ts` has the German texts, `src/app/app-icons.ts` the icons that the file names (`app:paste`), registered in `app.config.ts`.
