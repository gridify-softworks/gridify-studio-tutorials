# 070 – Messages

This tutorial shows how to tell the user something, or ask, with every kind of message the library has, and how the code gets the answer back. You will learn how to:

- ask with a **message box** and wait for the answer (`GrdMessageBox`): the kinds, a confirmation, buttons of your own, a queue;
- show a **toast** in a corner of the window (`GrdToast`): the severities, the positions, the time, details, Undo;
- show a **message bar** in the page (`grd-message-bar`) and one under the **menu bar**;
- choose which kind to use when.

The line **Answer** under a section shows what the code got back: the button that closed a box, `true` or `false` of a confirmation, why a toast went away, which button of a bar was pressed. There is no docking engine: a header, a menu bar and a page. The application starts from an empty `ng new`, not from the tutorial before.

```
npm run tutorial 070
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30070 and press the buttons. Answer a box with the keyboard (Enter, Esc, Tab), point at a toast and see that it stays, open **Details** in a toast. Switch the theme and the density in the header.

## Which one when

|                       | Message box                                              | Toast                                                      | Message bar                                                 |
| --------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| **Blocks**            | the page, until it is answered (unless `modal: false`)   | nothing, and it does not take the focus                    | nothing                                                     |
| **Where**             | in the middle of the window                              | a corner or an edge of the window                          | where you put it: above a form, a table, under the menu bar |
| **Goes away**         | when it is answered                                      | after a while (an error when it is closed)                 | when it is closed, or when the application takes it away    |
| **What it is for**    | a question, a confirmation, an error the user has to see | the result of something that was done: saved, sent, failed | a state that lasts: offline, read only, an update is ready  |
| **How it is written** | `inject(GrdMessageBox).question(…)`, no tag              | `inject(GrdToast).success(…)`, no tag                      | `<grd-message-bar [(message)]="message" />` in the template |

## The code

`src/app/app.config.ts` has nothing of the library: the services of the messages are provided in root.

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// The message boxes, the toasts and the message bars need no provider: the services are provided in root.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
```

`src/styles.scss` loads the styles of the library, paints the page with the theme, and has the styles of the sections (each section component has the class `demo`):

```scss
/* The themes, the density of the controls and the text styles of Gridify. */
@use '@gridify/studio/styles';

/* Without a docking engine nothing paints the page: the body takes the background and the text color of the theme. */
html,
body {
  height: 100%;
  margin: 0;
  font-family: var(--grd-font-main);
  background: var(--grd-bg-main);
  color: var(--grd-text-main);
}

/* A section of the page (the components in src/app have the class demo): a heading, a text, rows of buttons and the last answer. */
.demo {
  display: block;
  max-width: 960px;
  margin-top: 16px;

  h2 {
    margin: 0 0 4px;
    font-size: 1.05rem;
  }

  p {
    margin: 0 0 8px;
    max-width: 75ch;
    line-height: 1.45;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .row-name {
    width: 88px;
    opacity: 0.88;
  }

  /* What the last message answered: an <output>, so a screen reader says it too. */
  .answer {
    display: block;
    margin: 4px 0 8px;
    opacity: 0.88;
  }
}
```

`src/app/app.ts` is the header, the menu bar with its message, and the page with the sections. The sections 1 to 3 are components of their own (below); section 4 is in `App`, because the menu bar is there:

```ts
import { Component, computed, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBarSpec,
  GrdToast,
} from '@gridify/studio';
import { MessageBars } from './message-bars';
import { MessageBoxes } from './message-boxes';
import { Toasts } from './toasts';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdButton, MessageBoxes, Toasts, MessageBars],
  template: `
    <grd-app-header
      productName="Messages"
      subtitle="message boxes, toasts and message bars"
      icon="grd:logo"
      preferences="theme density"
    />
    <!-- [(messageBar)]: a message under the menu bar, over the whole width of the application. -->
    <grd-menu-bar [menus]="menus()" [(messageBar)]="notice" />
    <main>
      <app-message-boxes />
      <app-toasts />
      <app-message-bars />
      <section class="demo">
        <h2>4. A message under the menu bar</h2>
        <p>
          The menu bar (and the ribbon) has a message bar of its own: [(messageBar)] shows a message
          under it, over the whole width of the application, and moves the page down while it is
          there. The Document menu has the same commands.
        </p>
        <div class="row">
          <grd-button label="Open read-only" (pressed)="readOnly()" />
          <grd-button label="An update is ready" (pressed)="updateReady()" />
        </div>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      padding: 8px 20px 24px;
    }
  `,
})
export class App {
  private readonly toast = inject(GrdToast);

  /** The message under the menu bar, or null for none. */
  protected readonly notice = signal<GrdMessageBarSpec | null>(null);

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'document',
      label: '&Document',
      items: [
        { label: 'Open &read-only', run: () => this.readOnly() },
        { label: 'An &update is ready', run: () => this.updateReady() },
        { separator: true },
        {
          label: '&Hide the message',
          enabled: this.notice() !== null,
          run: () => this.notice.set(null),
        },
      ],
    },
  ]);

  protected readOnly(): void {
    this.notice.set({
      text: 'report.docx is open read-only: another user is editing it.',
      severity: 'warning',
      actions: [
        {
          label: 'Edit a copy',
          run: () =>
            this.notice.set({ text: 'You are editing report (copy).docx.', severity: 'success' }),
        },
      ],
    });
  }

  protected updateReady(): void {
    this.notice.set({
      text: 'Version 2.4 is downloaded and ready to install.',
      actions: [
        {
          label: 'Restart now',
          variant: 'primary',
          run: () => {
            this.notice.set(null);
            this.toast.info('This is a tutorial: nothing restarts.');
          },
        },
        { label: 'Later', run: () => this.notice.set(null) },
      ],
    });
  }
}
```

## 1. Message boxes

`src/app/message-boxes.ts`. The template is a heading, a text and rows of buttons; each button calls a method:

```html
<div class="row">
  <span class="row-name">Kind</span>
  <grd-button label="Info" (pressed)="info()" />
  <grd-button label="Warning" (pressed)="warning()" />
  <grd-button label="Error" (pressed)="error()" />
  <grd-button label="Question" (pressed)="question()" />
</div>
…
<output class="answer">Answer: {{ answer() }}</output>
```

The class:

```ts
export class MessageBoxes {
  private readonly box = inject(GrdMessageBox);

  protected readonly answer = signal('none yet');

  protected info(): void {
    this.report('Info', this.box.info('The report is saved in Documents.', { title: 'Saved' }));
  }

  protected warning(): void {
    this.report('Warning', this.box.warning('The disk is almost full: 2 % of it is free.'));
  }

  /** An error that the code caught: the box shows its message, and with details: true its stack under Details. */
  protected error(): void {
    try {
      JSON.parse('{ theme: dark }');
    } catch (error) {
      const ref = this.box.error(error, { title: 'The settings cannot be read', details: true });
      this.report('Error', ref);
    }
  }

  /** Yes, No and Cancel: closed gives the id of the button, 'yes', 'no' or 'cancel' (also for Esc). */
  protected question(): void {
    const ref = this.box.question('Save the changes to report.txt before it closes?', {
      buttons: 'yesNoCancel',
    });
    this.report('Question', ref);
  }

  /** confirm gives true or false. */
  protected async confirm(): Promise<void> {
    const send = await this.box.confirm('Send the invoice 2026-104 to the customer?', {
      confirmLabel: 'Send',
    });
    this.answer.set(`Send the invoice: confirm gave ${send}`);
  }

  /** danger: the button that agrees is red, and the focus (and Enter) is on the one that does not. */
  protected async confirmDanger(): Promise<void> {
    const remove = await this.box.confirm('Delete 3 files? This cannot be undone.', {
      danger: true,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
    });
    this.answer.set(`Delete the files: confirm gave ${remove}`);
  }

  /** Buttons of your own: their ids are the answers; default is pressed by Enter, cancel by Esc. */
  protected ownButtons(): void {
    const ref = this.box.error('report.docx is locked by another program.', {
      title: 'Cannot save',
      buttons: [
        { id: 'retry', label: 'Retry', variant: 'primary', default: true },
        { id: 'ignore', label: 'Ignore' },
        { id: 'abort', label: 'Abort', cancel: true },
      ],
    });
    this.report('Own buttons', ref);
  }

  /** queue: a box waits until the one before it is answered (without it they stand over each other). */
  protected queue(): void {
    for (const step of [1, 2, 3]) {
      const text = `Step ${step} of 3. The next box waits until this one is answered.`;
      this.report(`Step ${step}`, this.box.info(text, { title: 'A queue', queue: true }));
    }
  }

  /** modal: false: the page under the box still works; Esc does not close such a box. */
  protected notModal(): void {
    const ref = this.box.info('This box does not block the page: scroll it, press its buttons.', {
      title: 'Not modal',
      modal: false,
    });
    this.report('Not modal', ref);
  }

  /** Waits for the box to close and writes what answered it. */
  private async report(name: string, ref: GrdMessageBoxRef): Promise<void> {
    const result = await ref.closed;
    this.answer.set(`${name}: closed gave ${result === undefined ? 'undefined' : `'${result}'`}`);
  }
}
```

- **There is no tag.** `inject(GrdMessageBox)` and a call are all: the service makes the window and takes it away again. `info`, `warning`, `error` and `question` give a reference to the box (`GrdMessageBoxRef`), `confirm` gives a `Promise<boolean>`.
- **The answer is a promise.** `ref.closed` settles with the `id` of the button that closed the box: `'ok'`, `'yes'`, `'no'`, `'cancel'`, `'retry'`, or the id of a button of your own. Esc, the cross and a click on the backdrop answer with the button that cancels (`'cancel'` of Yes/No/Cancel, `'abort'` of the own buttons here). `confirm` turns it into `true` for the button that agrees and `false` for everything else.
- **The kind** gives the icon, the title (when there is no `title`) and the role: `info` is a `dialog`, the others are an `alertdialog`, which a screen reader announces at once.
- **An error** takes anything: a text, an `Error`, whatever was caught. `error(caught, { details: true })` shows its message, and its name, message and stack under **Details**, which the user can open, select and copy. Here it is a real `SyntaxError` of `JSON.parse`.
- **The buttons**: `buttons` is one of the sets `'ok'`, `'okCancel'`, `'yesNo'`, `'yesNoCancel'` and `'retryCancel'`, or your own list. A button of your own has an `id` (the answer), a `label`, and may have a `variant` (`primary`, `danger`, …), an `icon`, `default: true` (Enter presses it and it has the focus when the box opens) and `cancel: true` (Esc, the cross and the backdrop answer with it).
- **`confirm`** has `confirmLabel` and `cancelLabel` for the two buttons. With `danger: true` the button that agrees is red and the box starts on the other one, so Enter does not delete by a slip of the finger.
- **Boxes stand over each other** when there are more of them, each over the one before. With `queue: true` a box waits until the one before it is answered, so three calls in a row show three boxes one after another.
- **`modal: false`** makes a box that blocks nothing: the page under it still works (press a toast button while it is open). Esc does not close a box that is not modal; its buttons and its cross do.
- **More options**: `subtitle`, `width`, `id` (a box with an `id` that is open already is not shown again), `header: false`, `icon: false`, `closable`, `closeOnEscape`, `closeOnBackdrop`, `movable`, `resizable`, `buttonsAlign`. `GrdMessageBox.close(id)` and `closeAll()` take boxes away from the code.

## 2. Toasts

`src/app/toasts.ts`. The buttons of the positions are made from the list of the library, so the page and the library always agree:

```html
<div class="row">
  <span class="row-name">Position</span>
  @for (position of positions; track position) {
  <grd-button [label]="position" (pressed)="at(position)" />
  }
</div>
```

The class:

```ts
export class Toasts {
  private readonly toast = inject(GrdToast);

  protected readonly positions = GRD_TOAST_POSITIONS;
  protected readonly inbox = signal(3);
  protected readonly answer = signal('none yet');
  private downloads = 0;

  protected info(): void {
    this.toast.info('A new version of the price list is available.');
  }

  protected success(): void {
    this.toast.success('report.docx is saved.');
  }

  protected warning(): void {
    this.toast.warning('The connection is slow: the pictures load later.');
  }

  /** An Error: its message is the text, its stack is under Details, Copy copies both. It stays until it is closed. */
  protected error(): void {
    this.toast.error(new Error('The upload failed: report.docx is larger than 10 MB.'));
  }

  protected at(position: GrdToastPosition): void {
    this.toast.info(`A toast at ${position}.`, { position });
  }

  protected short(): void {
    this.toast.info('Gone in 2 seconds.', { closeAfter: 2000 });
  }

  /** closeAfter: 0: no time limit, the toast stays until it is closed. */
  protected untilClosed(): void {
    this.toast.info('This toast stays until you close it.', { closeAfter: 0 });
  }

  /** Without the close cross the toast must go away on its own: it keeps its time (6 seconds). */
  protected notClosable(): void {
    this.toast.info('No close cross: this toast goes away on its own.', { closable: false });
  }

  /** A corner shows four toasts at once (toastMax): the others wait and come as the first ones close. */
  protected sixAtOnce(): void {
    for (let n = 1; n <= 6; n++) {
      this.toast.info(`Toast ${n} of 6.`, { closeAfter: 3000 });
    }
  }

  protected clearAll(): void {
    this.toast.clear();
  }

  /** A title above the text, and a detail that the user opens with Details and copies with Copy. */
  protected titleAndDetail(): void {
    this.toast.warning('The import finished with 2 warnings.', {
      title: 'Import of customers.csv',
      detail: 'Line 12: the e-mail is empty.\nLine 40: the country "XX" is not known.',
    });
  }

  /** An icon is a key of the icon registry, a text or an emoji. */
  protected ownIcon(): void {
    this.toast.success('Version 2.4 is out.', { icon: '🎉' });
  }

  protected noIcon(): void {
    this.toast.info('A toast without an icon.', { icon: false });
  }

  /** A button in the toast: run is called, then the toast closes. */
  protected deleteMessage(): void {
    this.inbox.update((count) => count - 1);
    this.answer.set(`Deleted: ${this.inbox()} left in the inbox`);
    this.toast.info('The message was moved to the trash.', {
      actions: [
        {
          label: 'Undo',
          run: () => {
            this.inbox.update((count) => count + 1);
            this.answer.set(`Undo: ${this.inbox()} in the inbox again`);
          },
        },
      ],
    });
  }

  /** closed settles when the toast is gone, with the reason: closed, timeout, action, dismissed or replaced. */
  protected async waitForTheEnd(): Promise<void> {
    const ref = this.toast.info('Close me with the cross, press OK, or wait 5 seconds.', {
      closeAfter: 5000,
      actions: [{ label: 'OK' }],
    });
    this.answer.set('Waiting for the toast…');
    const reason = await ref.closed;
    this.answer.set(`The toast is gone, closed gave '${reason}'`);
  }

  /** The same toast changes: update gives it a new text, severity and time. */
  protected async save(): Promise<void> {
    const ref = this.toast.info('Saving report.docx…', { closeAfter: 0, closable: false });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ref.update({
      text: 'report.docx is saved.',
      severity: 'success',
      closeAfter: 3000,
      closable: true,
    });
  }

  /** An id: a new toast with the same id takes the place of the old one instead of standing under it. */
  protected download(): void {
    this.downloads++;
    this.toast.info(`Files downloaded: ${this.downloads}.`, { id: 'downloads' });
  }
}
```

- **There is no tag** either. `info`, `success` and `warning` take a text, `error` takes anything (an `Error` gives its message as the text and its stack as the detail), and every one of them takes the options as the second argument. `show({ text, … })` is the same with everything in one object. Each gives a reference to the toast (`GrdToastRef`).
- **The severity** gives the color, the icon and the role: an `error` is `role="alert"` (read at once), the others are `role="status"` (read in a pause).
- **The time**: `info`, `success` and `warning` go after 6 seconds, an error stays until it is closed. `closeAfter` is the time in ms, `0` is until it is closed. The time stands still while the pointer is over the toast, the focus is in it or its detail is open.
- **`closable: false`** takes the cross away. Such a toast should go away on its own, so keep its time.
- **The position** is `top-` or `bottom-` with `start`, `center`, `end` or `stretch` (the whole width); `GRD_TOAST_POSITIONS` lists them. Without `position` a toast stands at `bottom-end`. A place shows four toasts at once, the newest nearest to the edge; the others wait and come as the first ones close (**Six at once**).
- **The content**: `title` above the text, `detail` under a **Details** toggle, a Copy button for a toast with a detail or an error (`copyable` decides otherwise), and `icon`: a name of the icon registry, a text or an emoji, or `false` for none.
- **Buttons**: `actions` are `{ label, run, variant?, icon?, closes? }`. A press calls `run` and closes the toast; `closes: false` keeps it. **Undo** is the usual one.
- **`ref.closed`** settles when the toast is gone, with the reason: `'closed'` (the cross or Esc), `'timeout'`, `'action'` (a button), `'dismissed'` (the code: `ref.close()`, `close(id)`, `clear()`) or `'replaced'`.
- **One toast that changes**: `ref.update({ … })` changes the text, the severity, the time or anything else of the toast on the screen and starts its time again. **Save** shows _Saving…_ for as long as the work takes, then _Saved_.
- **An `id`** names a toast: a new toast with the same `id` takes the place of the old one instead of standing under it (**Download**). That is the way when you do not keep the reference.
- **`clear()`** takes all toasts away, `clear(position)` those of one place.
- **The history**: with `provideGrdToastHistory()` in `app.config.ts` the application keeps what the toasts said, for the user to come back to (a bell with the number of the unread ones, a menu, a list); `history: false` keeps one toast out. It is off without the provider: see [071](../071-notification-history/README.md).

## 3. A message bar

`src/app/message-bars.ts`. The bar stands in a frame with the content it is about:

```html
<div class="frame">
  <grd-message-bar
    [(message)]="message"
    [closable]="closable()"
    [showIcon]="showIcon()"
    (closed)="closed($event)"
    (actionInvoked)="invoked($event)"
  />
  <div class="content">The form, the table or the editor that the message is about.</div>
</div>
```

The class:

```ts
export class MessageBars {
  /** The message of the bar, or null for none. */
  protected readonly message = signal<GrdMessageBarSpec | null>(null);
  /** The inputs of the bar: for the messages that do not say it themselves. */
  protected readonly closable = signal(true);
  protected readonly showIcon = signal(true);
  protected readonly answer = signal('none yet');

  protected show(severity: GrdMessageSeverity): void {
    this.message.set({ text: TEXTS[severity], severity });
  }

  /** Buttons before the cross. A button does not close the bar: its run puts another message in (or null). */
  protected offline(): void {
    this.message.set({
      text: 'You are offline. The changes are kept on this computer until the connection is back.',
      severity: 'warning',
      actions: [
        {
          label: 'Try again',
          variant: 'primary',
          run: () =>
            this.message.set({
              text: 'Connected again. The changes are saved.',
              severity: 'success',
            }),
        },
        { label: 'Work offline', run: () => this.message.set(null) },
      ],
    });
  }

  /** A long text wraps to more lines: the bar grows with it. */
  protected long(): void {
    this.message.set({
      text:
        'The licence for this computer ends on 30 November 2026. After that day the documents can ' +
        'still be opened and printed, but not changed. Ask the administrator of your organization ' +
        'for a new licence key, or enter one in Settings. The text is long on purpose: the bar ' +
        'wraps it to more lines and grows with it.',
      severity: 'info',
    });
  }

  /** closable in the message wins over the input of the bar: this one has no cross whatever the checkbox says. */
  protected notClosable(): void {
    this.message.set({
      text: 'The server restarts at 18:00 for maintenance. Save your work before then.',
      severity: 'warning',
      closable: false,
    });
  }

  /** The cross was pressed: the model is null already, and closed tells which message it was. */
  protected closed(message: GrdMessageBarSpec): void {
    this.answer.set(`closed: "${message.text}"`);
  }

  protected invoked(action: GrdMessageAction): void {
    this.answer.set(`actionInvoked: ${action.label}`);
  }
}
```

- **The message is a model.** `[(message)]="message"` with a signal is all: set a message to show it, `null` to take it away. The close cross sets the model to `null` and tells `(closed)` which message it was. Without a message the bar takes no room.
- **A message** is `{ text, severity?, actions?, closable? }`. The severity gives the color, the icon and the role, as with the toasts.
- **Buttons** (`actions`) stand before the cross. A button calls its `run` and tells `(actionInvoked)`, but it does **not** close the bar: the application decides what comes next. **Try again** puts another message in, **Work offline** puts `null` in.
- **A long text** wraps, and the bar grows with it.
- **The close cross and the icon**: `closable` in the message wins, then the input `[closable]` of the bar, then the setting `messageBarClosable` of the application; the same with `[showIcon]` and `messageBarIcon`. **Without the cross** has `closable: false` in the message, so it has no cross whatever the checkbox says.

## 4. A message under the menu bar

The menu bar (`grd-menu-bar`) and the ribbon (`grd-ribbon`) have a message bar of their own: `[(messageBar)]="notice"` in `App` above. The message stands under the bar, over the whole width of the application, and moves what is under it down while it is there. It is the place for a message about the whole application or the open document: read only, an update, offline. `(messageBarClosed)` and `(messageBarActionInvoked)` tell the same as `(closed)` and `(actionInvoked)` of a bar of your own.

The **Document** menu is built in a `computed`, so **Hide the message** is enabled only while there is a message.

## What you get without writing any of it

- **The keyboard of a message box**: the focus goes to the default button when the box opens, Enter presses it, Esc answers with the button that cancels, Tab stays inside the box, and the focus goes back to the button that opened the box when it closes. The box can be moved by its title.
- **The page under a modal box is blocked**, also for the shortcuts of the application, and the backdrop darkens it.
- **A toast does not take the focus**, so somebody who is typing keeps typing. Its buttons are reached with Tab, and Esc on a toast closes it. Toasts stand in a column in their place, the ones over the limit wait, and a toast leaves with a short animation (none with `prefers-reduced-motion`).
- **Screen readers**: the roles `dialog`/`alertdialog` and `alert`/`status`, the name of the severity in the text ("Error. The upload failed…"), so color and icon are not the only way to tell it, and a region "Notifications" for the toasts.
- **The theme and the density** reach everything: switch to a dark theme in the header and the boxes, the toasts and the bars change their colors with it.
- **The texts of the library** (OK, Cancel, Yes, No, Details, Copy, Close) follow the language of the application.
- **The defaults** are settings of the application, for example `provideGrdControlDefaults({ toastPosition: 'top-center', toastMax: 2 })` in `app.config.ts`: `toastPosition`, `toastMax`, `toastCloseAfter`, `toastCloseAfterError`, `toastClosable`, `toastIcon`, `toastCopy`, `messageBoxQueue`, `messageBoxDetailsOpen`, `messageBarClosable`, `messageBarIcon` and more.

## Build it yourself from scratch

The quick way: `npm run tutorial:eject 070 path/to/new-folder` in the root of the repository writes this tutorial into a new folder as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). The steps below make the same project by hand.

1. Create an Angular application (Angular 21):

   ```
   npx @angular/cli@21 new messages --style=scss --ssr=false --skip-tests
   cd messages
   ```

   Accept the defaults for any other question.

2. Install the library. While Gridify is not on npm, the library is the package `dist/studio-community` of the repository, packed into a file (see step 2 of 010, also about the `.npmrc`):

   ```
   npm pack path/to/gridify/dist/studio-community
   npm i ./gridify-studio-0.0.0.tgz
   ```

3. In `angular.json`, raise the `initial` budget of the production build (`maximumWarning: 1MB`, `maximumError: 2MB`; the starter budget of 500 kB is too small for the library).

4. Write `src/styles.scss` as above.

5. Add `src/app/message-boxes.ts`, `src/app/toasts.ts` and `src/app/message-bars.ts`, and replace `src/app/app.ts` and `src/app/app.config.ts` with the code above. The template of `App` is inline, so `app.html` and `app.scss` can go. This application has no routes: `app.routes.ts` can go too, and so can `provideRouter(routes)` in `app.config.ts`.

6. Run it:

   ```
   ng serve
   ```
