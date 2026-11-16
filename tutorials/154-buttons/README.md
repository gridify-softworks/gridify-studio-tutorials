# 154 – Buttons

This tutorial shows how to make the buttons of a form and of a toolbar: in colors, with icons, as toggles, busy while they work, and with a menu. You will learn how to:

- react to a press (`grd-button`, `(pressed)`) and choose the color and the look (`variant`, `appearance="flat"`, `disabled`);
- give a button an icon, draw only the icon with a tooltip, or put the icon above the text (`icon`, `iconOnly`, `tooltip`, `layout="column"`);
- keep a button pressed (`toggle`, `[(checked)]`) and choose one of a row of buttons (`grd-toggle-group`);
- show that a button works and take no more clicks meanwhile (`busy`);
- add a menu to a button (`grd-split-button`, `grd-dropdown-button`, `GrdMenuItem`).

The icons of the application are registered when it starts, as in 060. The tutorial is from the series about form controls (150–159); it is the application of 150 with another page.

```
npm run tutorial 154
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30154 and press the buttons one after another.

## Step by step

The application of 150 (or one made by `npm run tutorial:eject 150 path/to/new-folder` in the root of the repository): the same `src/styles.scss`, a new `src/app/app.ts`, and two new files for the icons.

### Step 1: a press and a color

`(pressed)` comes on a click, and on Enter or Space while the button has the focus; a disabled button sends nothing. `variant` is the color (`default`, `primary`, `success`, `warning`, `danger`), `appearance="flat"` a button without a box until the pointer is over it:

```html
<grd-button label="Primary" variant="primary" (pressed)="log('Primary')" />
<grd-button label="Danger" variant="danger" (pressed)="log('Danger')" />
<grd-button label="Flat" appearance="flat" (pressed)="log('Flat')" />
<grd-button label="Disabled" disabled />
```

### Step 2: icons

An icon is a key of the icon registry (`grd:plus` is one of the library), a text or an emoji. The application registers its own icons when it starts, in `app.config.ts`:

```ts
provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
```

`iconOnly` draws only the icon; the label is then the name of the button for a screen reader and its tooltip, and `tooltip` says more when the label is not enough. `layout="column"` puts the icon above the text, the large button of a ribbon:

```html
<grd-button label="Add" icon="grd:plus" iconOnly (pressed)="log('Add')" />
<grd-button
  label="Remove"
  icon="grd:minus"
  iconOnly
  tooltip="Remove the last line (Del)"
  (pressed)="log('Remove')"
/>
```

### Step 3: a busy button

A button that waits for its work is `busy`: a turning ring stands in the place of the icon, the button keeps its width, and it takes no clicks until the work is done:

```html
<grd-button
  label="Upload a file"
  icon="app:upload"
  layout="column"
  [busy]="uploading()"
  (pressed)="upload()"
/>
```

```ts
protected async upload(): Promise<void> {
  this.uploading.set(true);
  this.log('Upload started');
  await new Promise((done) => setTimeout(done, 1500));
  this.uploading.set(false);
```

### Step 4: toggles

A `toggle` stays pressed after a click, and `[(checked)]` holds whether it is. A toggle group is a row of such buttons of which one is pressed, and its `[(value)]` is the value of that one:

<!-- prettier-ignore -->
```html
<grd-button label="Bold" icon="app:bold" iconOnly toggle [(checked)]="bold" />
<grd-toggle-group
  ariaLabel="Alignment"
  iconOnly
  [options]="alignments"
  [(value)]="alignment"
/>
```

```ts
{ value: 'center', label: 'Center', icon: 'app:align-center' },
```

The text under the buttons follows the signals.

### Step 5: a menu on a button

A split button has two parts: the main part does the usual thing (`(pressed)`), the arrow opens a menu. A dropdown button is one button that opens its menu. The items are `GrdMenuItem`s: an item with `run` runs it, and `(itemInvoked)` tells which item was chosen:

```html
<grd-split-button
  label="Save"
  icon="app:save"
  variant="primary"
  [items]="saveItems"
  (pressed)="log('Save')"
/>
<grd-dropdown-button
  label="New"
  icon="grd:plus"
  [items]="newItems"
  (itemInvoked)="create($event)"
/>
```

```ts
protected readonly saveItems: GrdMenuItem[] = [
  { label: 'Save as…', run: () => this.log('Save as…') },
  { label: 'Save a copy', run: () => this.log('Save a copy') },
  { separator: true },
  { label: 'Export as PDF', run: () => this.log('Export as PDF') },
];
```

## Try it

1. **Press the buttons of Variants.** Every press is a line at the bottom. **Disabled** cannot be pressed and cannot be reached with Tab.
2. **Reach a button with Tab and press Space or Enter.** It works like a click.
3. **Point at + and −.** The tooltip of **+** is its label, the one of **−** says more.
4. **Press Upload a file.** For a second and a half it turns a ring and takes no clicks.
5. **Press B, I and the alignment buttons.** The text under them follows. B stays pressed until it is pressed again; of the three alignment buttons one is always pressed. With the focus in the group, the arrow keys move between its buttons.
6. **Open the arrow of Save** and choose **Save a copy**. Press the main part: just **Save**.
7. **Reach New with Tab and press Enter.** The menu opens with the first item highlighted; Down and Enter choose **Spreadsheet**.

## The code

`src/app/app.ts`:

```ts
import { Component, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdDropdownButton,
  GrdGroupBox,
  type GrdMenuItem,
  GrdSplitButton,
  GrdToggleGroup,
  type GrdToggleOption,
} from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdDropdownButton,
    GrdGroupBox,
    GrdSplitButton,
    GrdToggleGroup,
  ],
  template: `
    <grd-app-header
      productName="Buttons"
      subtitle="variants, icons, toggles, busy, split and dropdown buttons"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          Press the buttons with the mouse, or reach them with Tab and press Enter or Space. The box
          at the bottom tells what the code was told.
        </p>

        <div class="boxes">
          <grd-group-box heading="Variants" icon="grd:component" gap="12px">
            <div class="actions">
              <grd-button label="Default" (pressed)="log('Default')" />
              <grd-button label="Primary" variant="primary" (pressed)="log('Primary')" />
              <grd-button label="Success" variant="success" (pressed)="log('Success')" />
              <grd-button label="Warning" variant="warning" (pressed)="log('Warning')" />
              <grd-button label="Danger" variant="danger" (pressed)="log('Danger')" />
            </div>
            <div class="actions">
              <grd-button label="Flat" appearance="flat" (pressed)="log('Flat')" />
              <grd-button
                label="Flat primary"
                appearance="flat"
                variant="primary"
                (pressed)="log('Flat primary')"
              />
              <grd-button label="Disabled" disabled />
            </div>
          </grd-group-box>

          <grd-group-box heading="Icons" icon="grd:document" gap="12px">
            <div class="actions">
              <grd-button label="Save" icon="app:save" variant="primary" (pressed)="log('Save')" />
              <grd-button
                label="Delete"
                icon="app:trash"
                variant="danger"
                (pressed)="log('Delete')"
              />
              <grd-button label="Add" icon="grd:plus" iconOnly (pressed)="log('Add')" />
              <grd-button
                label="Remove"
                icon="grd:minus"
                iconOnly
                tooltip="Remove the last line (Del)"
                (pressed)="log('Remove')"
              />
            </div>
            <div class="actions">
              <grd-button
                label="Upload a file"
                icon="app:upload"
                layout="column"
                [busy]="uploading()"
                (pressed)="upload()"
              />
            </div>
          </grd-group-box>

          <grd-group-box heading="Toggles" icon="grd:tool" gap="12px">
            <div class="actions">
              <grd-button label="Bold" icon="app:bold" iconOnly toggle [(checked)]="bold" />
              <grd-button label="Italic" icon="app:italic" iconOnly toggle [(checked)]="italic" />
              <grd-toggle-group
                ariaLabel="Alignment"
                iconOnly
                [options]="alignments"
                [(value)]="alignment"
              />
            </div>
            <p
              class="sample"
              [style.text-align]="alignment()"
              [style.font-weight]="bold() ? 'bold' : null"
              [style.font-style]="italic() ? 'italic' : null"
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </grd-group-box>

          <grd-group-box heading="Menus" icon="grd:chevrons">
            <div class="actions">
              <grd-split-button
                label="Save"
                icon="app:save"
                variant="primary"
                [items]="saveItems"
                (pressed)="log('Save')"
              />
              <grd-dropdown-button
                label="New"
                icon="grd:plus"
                [items]="newItems"
                (itemInvoked)="create($event)"
              />
            </div>
          </grd-group-box>
        </div>

        <grd-group-box heading="What the code was told">
          <div class="log">
            @for (entry of entries(); track $index) {
              <div>{{ entry }}</div>
            } @empty {
              Nothing yet.
            }
          </div>
        </grd-group-box>
      </div>
    </main>
  `,
  styles: `
    .log {
      font-family: var(--grd-font-mono);
    }
    .sample {
      margin: 0;
      padding: 8px 10px;
      border: 1px dashed var(--grd-border-color);
      border-radius: 6px;
    }
  `,
})
export class App {
  protected readonly entries = signal<string[]>([]);

  // A toggle button keeps its state in [(checked)]; a toggle group in [(value)].
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly alignment = signal<string | null>('left');
  protected readonly alignments: GrdToggleOption<string>[] = [
    { value: 'left', label: 'Align left', icon: 'app:align-left' },
    { value: 'center', label: 'Center', icon: 'app:align-center' },
    { value: 'right', label: 'Align right', icon: 'app:align-right' },
  ];

  /** The menu of the split button: each item runs its own command. */
  protected readonly saveItems: GrdMenuItem[] = [
    { label: 'Save as…', run: () => this.log('Save as…') },
    { label: 'Save a copy', run: () => this.log('Save a copy') },
    { separator: true },
    { label: 'Export as PDF', run: () => this.log('Export as PDF') },
  ];

  /** The menu of the dropdown button: the items have no run, the button tells which one was chosen (itemInvoked). */
  protected readonly newItems: GrdMenuItem[] = [
    { id: 'document', label: 'Document' },
    { id: 'sheet', label: 'Spreadsheet' },
    { id: 'slides', label: 'Presentation' },
  ];

  protected create(item: GrdMenuItem): void {
    this.log(`New ${item.label}`);
  }

  /** A button that waits for its work is busy: it shows a ring and takes no clicks. */
  protected readonly uploading = signal(false);

  protected async upload(): Promise<void> {
    this.uploading.set(true);
    this.log('Upload started');
    await new Promise((done) => setTimeout(done, 1500));
    this.uploading.set(false);
    this.log('Upload finished');
  }

  /** The newest line first, at most six. */
  protected log(text: string): void {
    const time = new Date().toLocaleTimeString();
    this.entries.update((lines) => [`${time}  ${text}`, ...lines].slice(0, 6));
  }
}
```

`src/app/app-icons.ts`:

```ts
// The icons of the buttons that the library does not have: SVG texts in a 16 x 16 viewBox, drawn in currentColor
// (so they take the color of the button), registered under names of their own in app.config.ts.

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';

const icon = (paths: string) => `<svg viewBox="0 0 16 16" aria-hidden="true">${paths}</svg>`;

export const APP_ICONS: Record<string, string> = {
  'app:save': icon(
    `<path ${LINE} d="M3 2.75h7.75l2.25 2.25v8.25H3z"/><path ${LINE} d="M5.5 2.75v3h4.5v-3M5.25 13.25v-4h5.5v4"/>`,
  ),
  'app:trash': icon(
    `<path ${LINE} d="M2.75 4.25h10.5M6.25 4.25v-1.5h3.5v1.5M4.25 4.25l.75 9h6l.75-9M6.75 6.75v4M9.25 6.75v4"/>`,
  ),
  'app:upload': icon(`<path ${LINE} d="M8 10.25v-7.5M5 5.75l3-3 3 3M2.75 10.5v2.75h10.5V10.5"/>`),
  'app:bold': icon(
    `<path ${LINE} d="M4.5 2.75h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.75h4.75a2.75 2.75 0 0 1 0 5.5H4.5z"/>`,
  ),
  'app:italic': icon(`<path ${LINE} d="M7 2.75h5M4 13.25h5M10 2.75 6.5 13.25"/>`),
  'app:align-left': icon(`<path ${LINE} d="M2.75 4h10.5M2.75 7h7M2.75 10h10.5M2.75 13h7"/>`),
  'app:align-center': icon(`<path ${LINE} d="M2.75 4h10.5M4.5 7h7M2.75 10h10.5M4.5 13h7"/>`),
  'app:align-right': icon(`<path ${LINE} d="M2.75 4h10.5M6.25 7h7M2.75 10h10.5M6.25 13h7"/>`),
};
```

`src/app/app.config.ts`:

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
    // The icons of the application are in the registry before the first button is drawn (see 060).
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
```

`src/styles.scss` and `src/main.ts` are the ones of 150.

## How it fits together

- **A native button inside.** Every button of the library is a `<button>` with the look of the theme, so the focus, Tab, Enter and Space are those of the browser. `type` is `button` by default, so a button inside a form does not send it; `type="submit"` does (155).
- **The size comes from the density.** A button is as tall as a field of the same density, so a row of fields and buttons lines up. `reserveLabelSpace` keeps the room of a label above a button that stands beside a field with a label.
- **Variants on a toggle.** A pressed toggle keeps its color: a neutral one is tinted with the accent of the theme.
- **One menu for all.** The menus of the split and the dropdown button are the popup menu of the library, the same as the menus of the menu bar (100): submenus, check marks, shortcuts, headings and the keys work the same. `items` can also be a function, called when the menu opens, for a menu that shows the state of that moment.
- **A gap for rows of buttons.** A group box puts no gap between fields that keep room for their message under them (`gap` is `auto`, 150), but a button keeps no such room, so the boxes that hold two rows of buttons set one themselves: `gap="12px"`.
- **Busy instead of disabled.** A busy button keeps the focus and its width and says `aria-busy`, so a screen reader knows it works; a disabled one would lose the focus in the middle of the work.

## What you get without writing any of it

- **The keys**: Enter and Space on a button; Enter, Space and Down open a menu, and from the keyboard its first item is highlighted; Esc closes it and the focus goes back to the button.
- **The tooltips**: the label of a button that draws only its icon.
- **The menu as one shape** with its button, in the color of the variant.
- **Accessibility**: `aria-pressed` on a toggle, `aria-busy` while busy, `aria-haspopup` and `aria-expanded` on a button with a menu, and the name "Save – options" of the arrow of the split button.
- **The theme and the density**, as in 150.

## Build it from 150

The quick way: `npm run tutorial:eject 154 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand:

1. Make the application of 150 (see [Build it yourself from scratch](../150-text-fields/README.md#build-it-yourself-from-scratch)), or eject 150.
2. Add `src/app/app-icons.ts`, replace `src/app/app.config.ts` and `src/app/app.ts` with the code above.
3. Run it:

   ```
   ng serve
   ```
