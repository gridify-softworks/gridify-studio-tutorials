# 045 – Unsaved work

This tutorial makes an application ask before unsaved work would be lost, and only then. The invoices of 044 get a note that the user edits and saves; while a note is not saved, the tab of the invoice has the mark of unsaved changes, and the application knows it in one place (`GrdUnsavedWork`). You will learn how to:

- make the browser ask before the page is closed or reloaded while something is unsaved (`provideGrdUnsavedWork`), and ask nothing when everything is saved;
- make the Back button ask then too, with a ready question (`provideGrdBackButton({canLeave: grdAskWhenUnsaved()})`), and leave as on any page otherwise;
- mark a tab as changed from the component in it (`GrdTabContext.setDirty`), and ask before a changed tab is closed (`tabConfirmClose`).

It starts from the application of 044 (the invoices in the address and the Back button); `app.config.ts`, `app.ts`, `invoice-page.ts` and `invoices.ts` change, `invoice-list.ts` reads the invoices with `allInvoices()` of the new `invoices.ts` (which does not export `INVOICES` any more), and `back-button.ts` is gone (the question comes from the library).

```
npm run tutorial 045
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open a page first (any address, so that there is a page before the application), then http://localhost:30045 in the same tab. Open an invoice, write something into its note and press Back until the question comes; then save the note and press Back again.

## The words first

- **A mark of unsaved changes** belongs to a tab: a dot after its title (`GrdTabContext.setDirty()` in the component of the tab, `GrdApi.setTabDirty()` from elsewhere).
- **`GrdUnsavedWork`** is the unsaved work of the whole application: every docking engine tells it whether one of its tabs has a mark, and any other part can mark itself (`mark(owner)`). Its `dirty()` is a signal.
- **Asking** is up to the application: without the providers below nothing asks, the marks are only known.

## Step by step

### Step 1: ask only while something is unsaved

`src/app/app.config.ts`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdAskWhenUnsaved, provideGrdBackButton, provideGrdUnsavedWork } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // While an invoice is unsaved, the browser asks before the page is closed or reloaded. With
    // everything saved it asks nothing.
    provideGrdUnsavedWork(),
    // The Back button asks too, and only then: with nothing unsaved it leaves as on any page.
    provideGrdBackButton({ canLeave: grdAskWhenUnsaved() }),
  ],
};
```

`provideGrdUnsavedWork()` makes the browser ask before the page goes (`beforeunload`: the question of the browser, its text cannot be set). `grdAskWhenUnsaved()` is a `canLeave` of the Back button: with nothing unsaved it answers `true` (Back leaves), otherwise it asks with a message box. Leave goes, and the browser does not ask a second time while the page goes; Stay (also Esc, the cross, and Enter, which presses Stay) keeps the user where the work is. The texts are those of the library (`grd.unsaved.*`, also in German and Japanese), or `grdAskWhenUnsaved({message, title, leaveLabel, stayLabel})`.

### Step 2: the tab says it is changed

`src/app/invoice-page.ts` has a note under the invoice, with Save and Revert:

```ts
      <grd-textarea label="Note" [rows]="3" [value]="note()" (valueChange)="edit($event)" />
      <p class="actions">
        <grd-button label="Save" [disabled]="!changed()" (pressed)="save()" />
        <grd-button label="Revert" [disabled]="!changed()" (pressed)="revert()" />
        <span class="state">{{ changed() ? 'Unsaved changes' : 'Saved' }}</span>
      </p>
```

and sets the mark of its tab while the note differs from the saved one:

```ts
  /** The saved note, and the note as the user is writing it. */
  private readonly saved = signal('');
  protected readonly note = signal('');
  protected readonly changed = computed(() => this.note() !== this.saved());

  ngOnInit(): void {
    const note = this.invoice()?.note ?? '';
    this.saved.set(note);
    this.note.set(note);
  }

  protected edit(note: string): void {
    this.note.set(note);
    // The mark of unsaved changes of the tab: a dot after its title, and the unsaved work of the
    // application (the browser and the Back button ask while it is there).
    this.tab.setDirty(this.changed());
  }

  protected save(): void {
    saveNote(this.id(), this.note());
    this.saved.set(this.note());
    this.tab.setDirty(false);
  }

  protected revert(): void {
    this.note.set(this.saved());
    this.tab.setDirty(false);
  }
```

`GrdTabContext` is the tab the component is in. The engine shows the dot and tells `GrdUnsavedWork`; a tab that is closed, a layout that is reset and an engine that goes take their marks with them. (`invoices.ts` keeps the notes in memory: `saveNote` is where a real application sends the note to its server.)

### Step 3: what the application shows

`src/app/app.ts` shows the state under the engine:

```html
<!-- The unsaved work of the application: the marks of the tabs, in one place. -->
<p class="status" role="status">
  {{ unsaved.dirty() ? 'Unsaved changes: closing the page, a reload and Back ask first.' :
  'Everything is saved: Back and closing the page leave as on any page.' }}
</p>
```

### Step 4: a changed invoice asks before it is closed

The engine does not ask on its own when a tab closes; `tabConfirmClose` tells whether the tab is changed (`dirty`), and the application decides:

```ts
  /**
   * A changed invoice is about to be closed: the close waits, and the user decides. Close closes it
   * anyway (its note is lost), Keep it open keeps it.
   */
  protected confirmClose(event: GrdEventMap['tabConfirmClose']): void {
    if (!event.dirty) return;
    event.cancel();
    void this.box
      .confirm(`${event.title} has a note that is not saved.`, {
        title: 'Close without saving?',
        confirmLabel: 'Close',
        cancelLabel: 'Keep it open',
        defaultAnswer: 'cancel',
      })
      .then((close) => {
        if (close) this.engine().api.closeTab(event.tabId, { force: true });
      });
  }
```

`event.cancel()` keeps the tab while the user answers; Close closes it with `force`, which asks nothing more.

## Try it

1. Open invoice 1001 and add a few words to its note: the tab gets the dot and the line under the engine says that something is unsaved.
2. Press Back: first through the invoices you opened, then the question "Leave without saving?". Stay keeps you and the note.
3. Close the tab of the invoice with its cross: the question "Close without saving?". Keep it open.
4. Close the browser tab or press F5: the browser asks (its own question).
5. Save the note: the dot goes, Back leaves the application as on any page, and closing the page asks nothing.

## More

- The Back button and what it can do instead of leaving: [044](../044-the-back-button/README.md).
- The mark of unsaved changes of the layout (Save, Load, Reset): [112](../112-unsaved-mark/README.md).
