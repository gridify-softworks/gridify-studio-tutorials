# 080 – Dialogs

This tutorial shows how to open dialogs with `GrdDialog` and get their results back. You will learn how to:

- open a modal and a modeless dialog, one of a fixed size and a resizable one;
- show a piece of HTML, or a component with inputs, in a dialog;
- get the result of a dialog, and how it was closed (a button, the cross, Esc);
- open a modal dialog over another one and get a value back from it;
- give a dialog a status bar, filled by the page or kept up to date by the component.

The page shows the result of every dialog under its section. There is no docking engine: a header and a page. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 080
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30080 and open the dialogs one after the other. Open the modeless one and click **Clicks on the page** under it, then open the modal one and try the same. Pull the edges of the resizable one, type a name into **New customer…**, choose a customer in **New order…**, watch the status bar of **Copy files…** and type into **Note…**. Close the dialogs with their buttons, with the cross and with Esc, and watch the results. Switch the theme and the density in the header.

## The code

One service opens every dialog: `GrdDialog`. `open(spec)` shows the dialog and gives back a ref; `await ref.closed` is its result. `src/app/app.ts` has one method for each button. The result of each dialog goes to `show`, which waits for it:

```ts
export class App {
  protected readonly dialogs = inject(GrdDialog);

  /** A modal dialog (that is the default): the page under it is blocked until it closes. */
  protected modal(): void {
    this.show(
      'modal',
      this.dialogs.open({
        title: 'A modal dialog',
        text: 'The page under this dialog is blocked: …',
        buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
      }),
    );
  }

  /** Waits until the dialog closes, then shows its result and how it was closed. */
  private async show<T>(section: SectionId, ref: GrdDialogRef<T>): Promise<void> {
    const result = await ref.closed;
    const value = result === undefined ? 'undefined' : JSON.stringify(result);
    this.outcomes.update((all) => ({ ...all, [section]: { value, reason: ref.reason() ?? '' } }));
  }
}
```

A modeless dialog has `modal: false`. This one has a name (`id`), so a second click finds it open and brings it to the front instead of opening another one:

```ts
protected modeless(): void {
  const open = this.dialogs.get('modeless');
  if (open) {
    open.bringToFront();
    open.focus();
    return;
  }
  this.show(
    'modal',
    this.dialogs.open({
      id: 'modeless',
      title: 'A modeless dialog',
      text: 'The page under this dialog still works: …',
      modal: false,
      closeOnEscape: true,
      width: 340,
      x: Math.max(16, window.innerWidth - 380),
      y: 96,
      buttons: [{ id: 'close', label: 'Close' }],
    }),
  );
}
```

A fixed size and a resizable dialog. The resizable one has a component as its body that fills it (`fill`):

```ts
this.dialogs.open({
  title: 'A fixed size',
  text: 'This window is 360 × 240 px and stays so: …',
  width: 360,
  height: 240,
  buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
});

this.dialogs.open({
  title: 'A resizable dialog',
  subtitle: 'At least 320 × 260 px, at most 720 × 520 px',
  component: SizeDialog,
  fill: true,
  resizable: true,
  width: 440,
  height: 320,
  minWidth: 320,
  minHeight: 260,
  maxWidth: 720,
  maxHeight: 520,
  buttons: [{ id: 'close', label: 'Close' }],
});
```

A piece of HTML, and a component with inputs:

```ts
this.dialogs.open({
  title: 'HTML in the body',
  html: `
    <p>The body is a piece of <b>HTML</b>, for a text with some form:</p>
    <ul>
      <li><b>bold</b> and <i>italic</i> text, and <code>code</code>,</li>
      <li>lists and paragraphs.</li>
    </ul>
    <p>Angular sanitizes it: scripts and event handlers do not get through.</p>
  `,
  width: 420,
  buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
});

this.dialogs.open<number>({
  title: 'A component in the body',
  component: CounterDialog,
  inputs: { start: 5 },
});
```

`src/app/counter-dialog.ts` is the component. It injects the ref of its dialog and closes it itself, with the count:

```ts
export class CounterDialog {
  /** The first value, from `inputs` of the dialog. */
  readonly start = input(0);
  /** The count starts at `start` and then goes its own way. */
  protected readonly count = linkedSignal(() => this.start());
  /** The dialog this component is the body of: `close(value)` closes it with a result. */
  private readonly ref = injectGrdDialogRef<number>();

  protected done(): void {
    this.ref.close(this.count());
  }
}
```

A question with three answers, and a form whose dialog gives back the customer:

```ts
this.dialogs.open<'save' | 'discard' | 'cancel'>({
  title: 'Save the changes?',
  text: 'The document has changes that are not saved yet.',
  role: 'alertdialog',
  buttons: [
    { id: 'discard', label: "Don't save", align: 'start' },
    { id: 'cancel', label: 'Cancel', cancel: true },
    { id: 'save', label: 'Save', variant: 'primary', default: true },
  ],
});

this.dialogs.open<Customer | null>({
  title: 'New customer',
  icon: 'grd:user',
  component: CustomerForm,
  buttons: [
    { id: 'cancel', label: 'Cancel', cancel: true, result: null },
    {
      id: 'save',
      label: 'Save',
      variant: 'primary',
      default: true,
      disabled: true,
      run: () => new Promise<void>((resolve) => setTimeout(resolve, 600)),
    },
  ],
});
```

`src/app/customer-form.ts` keeps the Save button of its dialog up to date while it is typed in:

```ts
export class CustomerForm {
  readonly name = signal('');
  readonly email = signal('');
  private readonly customer = computed<Customer>(() => ({
    name: this.name().trim(),
    email: this.email().trim(),
  }));

  constructor() {
    const ref = injectGrdDialogRef<Customer | null>();
    effect(() => {
      const customer = this.customer();
      ref.patchButton('save', { disabled: !customer.name, result: customer });
    });
  }
}
```

The layered dialogs. The page opens the order (the parent) with a Confirm button that is disabled at first:

```ts
this.dialogs.open<string>({
  title: 'New order',
  subtitle: 'The first level: a dialog whose component opens another one.',
  icon: 'grd:document',
  component: OrderDialog,
  buttons: [
    { id: 'cancel', label: 'Cancel', cancel: true },
    { id: 'confirm', label: 'Confirm', variant: 'primary', default: true, disabled: true },
  ],
});
```

`src/app/order-dialog.ts` opens the list of customers (the child) over itself, waits for its result and enables Confirm:

```ts
export class OrderDialog {
  readonly number = signal(1042);
  protected readonly customer = signal<string | null>(null);
  private readonly dialogs = inject(GrdDialog);
  private readonly ref = injectGrdDialogRef<string>();

  constructor() {
    // Confirm is disabled until there is a customer; its result is the order as it is now.
    const order = computed(() => `Order ${this.number()} for ${this.customer()}`);
    effect(() => this.ref.patchButton('confirm', { disabled: !this.customer(), result: order() }));
  }

  /** The child dialog: modal over this one, which waits under it, and cascaded from it (parent). Its result comes back here, not to the page. */
  protected async choose(): Promise<void> {
    const child = this.dialogs.open<string | null>({
      title: 'Choose a customer',
      subtitle: 'The second level: the order waits under this dialog.',
      component: CustomerPicker,
      inputs: { current: this.customer() },
      parent: this.ref,
      buttons: [{ id: 'cancel', label: 'Cancel', cancel: true, result: null }],
    });
    const picked = await child.closed;
    if (picked) this.customer.set(picked);
  }
}
```

and `src/app/customer-picker.ts` closes the child with the name that is clicked:

```ts
export class CustomerPicker {
  /** The customer the order has now (shown as chosen). */
  readonly current = input<string | null>(null);
  protected readonly customers = ['Jana Nováková', 'Petr Svoboda', 'Hana Dvořáková', 'Tomáš Černý'];
  private readonly ref = injectGrdDialogRef<string>();

  protected pick(name: string): void {
    this.ref.close(name);
  }
}
```

Two dialogs with a status bar. The page fills the bar of the copying from a timer, with `ref.update()`:

```ts
protected copy(): void {
  const files = 12;
  let done = 0;
  const status = (text: string): GrdStatusItem[] => [
    { id: 'file', text, shrink: true, live: true, busy: done < files },
    { id: 'count', text: `${done} / ${files}`, align: 'end', progress: done / files },
  ];
  const ref = this.dialogs.open<number>({
    title: 'Copying files',
    icon: 'grd:document',
    text: `${files} files go to the backup. The status bar says which one is copied now.`,
    width: 380,
    statusBar: status('file-01.txt'),
    buttons: [{ id: 'cancel', label: 'Cancel', cancel: true, result: 0 }],
  });
  const timer = setInterval(() => {
    done++;
    if (done < files) {
      ref.update({ statusBar: status(`file-${String(done + 1).padStart(2, '0')}.txt`) });
      ref.patchButton('cancel', { result: done });
      return;
    }
    clearInterval(timer);
    ref.update({
      text: `All ${files} files are in the backup.`,
      statusBar: status('Done'),
      buttons: [
      { id: 'ok', label: 'OK', variant: 'primary', default: true, cancel: true, result: files },
    ],
    });
  }, 350);
  void ref.closed.then(() => clearInterval(timer));
  this.show('status', ref);
}
```

The note asks for an empty bar (`statusBar: true`) and its component fills it:

```ts
this.dialogs.open<string | null>({
  title: 'Note',
  component: NoteDialog,
  inputs: { start: 'Buy milk.\nCall the bank about the card.' },
  fill: true,
  resizable: true,
  width: 460,
  height: 320,
  minWidth: 340,
  minHeight: 220,
  statusBar: true,
  buttons: [
    { id: 'cancel', label: 'Cancel', cancel: true, result: null },
    { id: 'save', label: 'Save', variant: 'primary', default: true, disabled: true },
  ],
});
```

`src/app/note-dialog.ts` keeps the bar up to date in an `effect`, as the form keeps its Save button:

```ts
constructor() {
  const ref = injectGrdDialogRef<string | null>();
  effect(() => {
    const edited = this.text() !== this.start();
    const wrap = this.wrap();
    const items: GrdStatusItem[] = [
      {
        id: 'state',
        text: edited ? 'Edited' : 'Not edited',
        variant: edited ? 'warning' : 'neutral',
        live: true,
      },
      { id: 'caret', text: `Ln ${this.line()}, Col ${this.column()}`, align: 'end' },
      { id: 'words', text: `${this.words()} words`, align: 'end' },
      {
        id: 'wrap',
        text: wrap ? 'Wrap' : 'No wrap',
        tooltip: 'The wrapping of the lines',
        align: 'end',
        choices: [
          { label: 'Wrap the lines', checked: wrap, run: () => this.wrap.set(true) },
          { label: 'One line is one line', checked: !wrap, run: () => this.wrap.set(false) },
        ],
      },
    ];
    ref.update({ statusBar: items });
    ref.patchButton('save', { disabled: !edited, result: this.text() });
  });
}
```

`src/app/size-dialog.ts` (the body of the resizable dialog) watches its own size with a `ResizeObserver` and writes it. `src/app/app.config.ts` has nothing of the dialogs in it: `GrdDialog` is a service of the root, ready to be injected.

`src/styles.scss`:

```scss
@use '@gridify/studio/styles';

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

A spec says what the dialog is: a title (and a subtitle and an icon), a body, buttons, and how it behaves. The body is one of three: `text` (a plain text), `html` (a piece of HTML) or `component` (a component of yours, with `inputs`). A spec without a body, a title and buttons is not shown.

### Modal and modeless

`modal` is `true` unless the spec says otherwise. A **modal** dialog lays a backdrop over the page and makes the page `inert`: the pointer does not reach it, Tab does not go there, and the screen reader does not read it. The focus stays in the dialog, the shortcuts of the application are off, and Esc closes it (`closeOnEscape`, on by default). A click on the backdrop does nothing, unless `closeOnBackdrop: true`.

A **modeless** dialog (`modal: false`) has no backdrop and blocks nothing: the page works under it (the counter of the first section counts). A click on it brings it to the front. Esc closes it only when the spec asks for it (`closeOnEscape: true`) and the focus is in it: Esc on the page leaves it open. Where it stands is `x` and `y` (in pixels of the browser window); without them a dialog is in the middle.

A dialog with an `id` is one of a kind: `dialogs.get(id)` finds it while it is open, `dialogs.has(id)` says whether it is, and opening another dialog with the same `id` closes the first one (its reason is `replaced`). `dialogs.count()` and `dialogs.modalCount()` are signals: the line at the top of the page reads them.

### Fixed size and resizable

Without `width` and `height` a dialog is as big as its content. With them it is that big, and the body scrolls when the content does not fit. A number is in pixels; a text can be any CSS length (`'30em'`, `'60vh'`). Every dialog can be moved by its title (`movable`, on by default).

`resizable: true` gives the window its edges and corners to pull, and the grip of six dots in the corner. `minWidth` and `minHeight` keep it from getting too small, `maxWidth` and `maxHeight` from getting too big (720 × 520 px here). The browser window less its margins is a limit too, so on a small screen the window is smaller than `width` or `maxWidth` say. `fill: true` makes the component of the body as big as the body (without it, the component is as high as its content and the body scrolls): the `SizeDialog` follows every pull of the edge.

### HTML and a component

`html` is set as `innerHTML`, so Angular sanitizes it: tags and attributes for text stay, scripts and event handlers are taken out. It is meant for a text of the application with some form, not for the input of a user. The body starts and ends at its padding (the first paragraph and the last one have no outer margin), and `code` is in the monospaced font of the theme.

`component` creates the component in the body, and `inputs` sets its inputs (here `start` of `CounterDialog`). The component injects the ref of its own dialog with `injectGrdDialogRef()`, and through it closes the dialog (`ref.close(value)`), changes its title (`ref.update({ title })`) or its buttons (`ref.patchButton(id, …)`). It is created in the injector of the application, so it injects the services of the root, `GrdDialog` among them; `injector` in the spec gives it another one (the injector of the component that opens it, for its services). When the dialog closes, the component is destroyed: its `DestroyRef` runs, and the `ResizeObserver` of `SizeDialog` ends there.

### The result

`await ref.closed` is the result, and `ref.reason()` says how it came:

| How the dialog was closed                        | `ref.closed`                                                 | `ref.reason()`                |
| ------------------------------------------------ | ------------------------------------------------------------ | ----------------------------- |
| a button                                         | its `result`, or its `id` when it has none                   | `button`                      |
| Esc, the cross, the backdrop                     | the `result` of the button marked `cancel`, else `undefined` | `escape`, `close`, `backdrop` |
| `ref.close(value)` or `dialogs.close(id, value)` | `value`                                                      | `api`                         |
| another dialog with the same `id`                | `undefined`                                                  | `replaced`                    |

The question gives back `'save'`, `'discard'` or `'cancel'`, and Esc gives `'cancel'` too: its Cancel button is marked `cancel`. The first dialog has no Cancel button, so Esc gives `undefined`. `default: true` marks the button that Enter presses (OK of the HTML dialog). `align: 'start'` puts a button at the other end of the row (**Don't save**). `role: 'alertdialog'` tells the screen reader that the dialog asks something.

A form gives its value to a button of the dialog: `ref.patchButton('save', { disabled, result })` in an `effect` keeps Save disabled while there is no name and its result the customer as it is now. The dialog closes with it, so the page gets the customer without reading the component (after the close `ref.instance` is `null`, the component is gone). The `run` of a button may take its time: while its promise runs, the button shows that it is busy and the other buttons, the cross and Esc wait. `run` that returns `false` keeps the dialog open; `closes: false` makes a button that never closes it.

### Layered modal dialogs

A modal dialog opened while another one is open lies over it, and blocks it as it blocks the page: the order dialog is `inert` under the list of customers, darkened by the second backdrop. `parent: this.ref` puts the list cascaded from the order, a step to the right and down (the height of its header), so the title of the order stays in sight; without it the list would stand in the middle, over the order. There is no limit to the layers. Esc and the focus go to the top one: Esc closes the list, the focus goes back to **Choose a customer…**, and a second Esc closes the order.

The result of a dialog goes to whoever waits for it. `OrderDialog` opens the child and waits for `child.closed` itself, so the customer comes back to the order, not to the page. The page waits for the order: it gets **Order 1042 for …** when Confirm closes the parent, and `'cancel'` when the order is cancelled.

### With a status bar

`statusBar` puts a status bar under the buttons: `true` for an empty one, a text for a bar with one message, or the items of a `grd-status-bar` (`GrdStatusItem`: a text, an icon, a badge, a spinner with `busy`, a bar of `progress` from 0 to 1, `align: 'end'` for the right side, `shrink` for the item that takes the rest of the room, `live` for a text that the screen reader tells when it changes). `ref.update({ statusBar })` replaces the items while the dialog is open: the page does it for the copying, and the component of the note does it in an `effect`, so the bar follows the caret and the words. An item with `choices` is a menu that opens upwards (the wrapping of the lines), one with `run` is a button. `ref.update` changes only what it is given: the copying gets new text and an OK button in place of Cancel when it is done, and its Cancel gives the number of the files copied so far. The OK button at the end is marked `cancel` as well, so Esc and the cross give all the files too.

## What you get without writing any of it

- **The focus**: a dialog takes it when it opens (its default button; the first control of the body when the default button is disabled, as in the form; or the window itself; `autoFocus` can name another element), keeps it in a modal dialog when Tab or Shift+Tab come to its end, and gives it back to the button that opened it when it closes. With layers, the child gives it back to the parent.
- **Esc** closes the top modal dialog, or a modeless one that asks for it and has the focus. Enter presses the default button.
- **Moving and resizing** with the pointer, and the window never gets lost over the edge of the browser window.
- **The page under a modal dialog** is `inert` (no pointer, no Tab, nothing for the screen reader) and the shortcuts are off; the toasts stay in reach. All of it comes back with the last modal dialog.
- **The theme and the density**: the windows, their backdrop, the buttons and the fields of the components follow the select in the header, in light and dark.
- **Cleaning up**: when a dialog closes, its component is destroyed, its window leaves the page, and only then does `closed` settle. The dialogs that are still open when the application ends are closed with it.
- **Accessibility**: `role="dialog"` (or `alertdialog`), `aria-modal`, the title as the name of the dialog, the subtitle and a body of text or HTML as its description, and a label for the cross.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 080 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new dialogs --style=scss --ssr=false --skip-tests
   cd dialogs
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as above.

5. Add `src/app/counter-dialog.ts`, `size-dialog.ts`, `customer-form.ts`, `order-dialog.ts`, `customer-picker.ts` and `note-dialog.ts`, and replace `src/app/app.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
