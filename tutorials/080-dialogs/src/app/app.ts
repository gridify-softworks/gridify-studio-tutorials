import { Component, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdDialog,
  type GrdDialogRef,
  type GrdStatusItem,
} from '@gridify/studio';
import { CounterDialog } from './counter-dialog';
import { type Customer, CustomerForm } from './customer-form';
import { NoteDialog } from './note-dialog';
import { OrderDialog } from './order-dialog';
import { SizeDialog } from './size-dialog';

/** The sections of the page. Each shows the result of its last dialog. */
type SectionId = 'modal' | 'size' | 'content' | 'result' | 'layers' | 'status';

/** The result of a dialog as the page shows it, and how the dialog was closed. */
interface Outcome {
  value: string;
  reason: string;
}

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton],
  template: `
    <grd-app-header
      productName="Dialogs"
      subtitle="modal and modeless, fixed and resizable, HTML and components, results, layers, a status bar"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <p class="open" aria-live="polite">
        Open dialogs: {{ dialogs.count() }} (modal: {{ dialogs.modalCount() }})
      </p>

      <section>
        <h2>1. Modal and modeless</h2>
        <p>
          A modal dialog blocks the page until it is closed: the page cannot be clicked, and Tab
          stays in the dialog. A modeless dialog floats over the page and the page goes on working:
          open one and click the counter.
        </p>
        <div class="row">
          <grd-button label="Modal" variant="primary" (pressed)="modal()" />
          <grd-button label="Modeless" (pressed)="modeless()" />
          <grd-button
            class="clicks"
            appearance="flat"
            [label]="'Clicks on the page: ' + clicks()"
            (pressed)="clicks.set(clicks() + 1)"
          />
        </div>
        <p class="result">
          Result: <code>{{ outcome('modal') }}</code>
        </p>
      </section>

      <section>
        <h2>2. Fixed size and resizable</h2>
        <p>
          A dialog is as big as its content, or as width and height say. A resizable one has edges
          and a grip in the corner to pull, down to its minimum size and up to the browser window.
        </p>
        <div class="row">
          <grd-button label="Fixed size" (pressed)="fixed()" />
          <grd-button label="Resizable" (pressed)="resizable()" />
        </div>
        <p class="result">
          Result: <code>{{ outcome('size') }}</code>
        </p>
      </section>

      <section>
        <h2>3. HTML and a component</h2>
        <p>
          The body of a dialog is a text, a piece of HTML (sanitized by Angular), or a component of
          yours with inputs. The component can close the dialog itself, with a value.
        </p>
        <div class="row">
          <grd-button label="HTML" (pressed)="html()" />
          <grd-button label="Component" (pressed)="component()" />
        </div>
        <p class="result">
          Result: <code>{{ outcome('content') }}</code>
        </p>
      </section>

      <section>
        <h2>4. The result</h2>
        <p>
          <code>open()</code> gives back a ref, and <code>await ref.closed</code> is the result: the
          result of the button that closed the dialog (or its id), the value the component closed it
          with, or the result of the Cancel button when it was closed by Esc or the cross.
          <code>ref.reason()</code> says which of them it was.
        </p>
        <div class="row">
          <grd-button label="Save the changes?" (pressed)="question()" />
          <grd-button label="New customer…" (pressed)="newCustomer()" />
        </div>
        <p class="result">
          Result: <code>{{ outcome('result') }}</code>
        </p>
      </section>

      <section>
        <h2>5. Layered modal dialogs</h2>
        <p>
          A component in a dialog can open a dialog of its own. The order dialog (the parent) opens
          the list of customers (the child) over itself, gets the customer from it, and then gives
          the order to the page when it is confirmed.
        </p>
        <div class="row">
          <grd-button label="New order…" variant="primary" (pressed)="newOrder()" />
        </div>
        <p class="result">
          Result: <code>{{ outcome('layers') }}</code>
        </p>
      </section>

      <section>
        <h2>6. With a status bar</h2>
        <p>
          A dialog can have a status bar under its buttons (<code>statusBar</code>): a text, or the
          items of a <code>grd-status-bar</code>. The page changes it with
          <code>ref.update()</code> while the dialog is open (the copying), or the component in the
          body keeps it up to date (the note: the caret, the words, and a menu in the bar).
        </p>
        <div class="row">
          <grd-button label="Copy files…" (pressed)="copy()" />
          <grd-button label="Note…" (pressed)="note()" />
        </div>
        <p class="result">
          Result: <code>{{ outcome('status') }}</code>
        </p>
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
    section {
      max-width: 960px;
      margin-top: 16px;
    }
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
    .open,
    .result {
      opacity: 0.88;
    }
  `,
})
export class App {
  protected readonly dialogs = inject(GrdDialog);
  protected readonly clicks = signal(0);
  private readonly outcomes = signal<Partial<Record<SectionId, Outcome>>>({});

  // ---- 1. Modal and modeless ----

  /** A modal dialog (that is the default): the page under it is blocked until it closes. */
  protected modal(): void {
    this.show(
      'modal',
      this.dialogs.open({
        title: 'A modal dialog',
        text: 'The page under this dialog is blocked: try to click it, or to reach it with Tab. Close the dialog with OK, the cross or Esc.',
        buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
      }),
    );
  }

  /** A modeless dialog: the page works under it. It has a name, so the second click finds it open and brings it to the front. */
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
        text: 'The page under this dialog still works: click the counter. Drag the dialog by its title, and close it with Close, the cross, or Esc while it has the focus.',
        modal: false,
        closeOnEscape: true,
        width: 340,
        x: Math.max(16, window.innerWidth - 380),
        y: 96,
        buttons: [{ id: 'close', label: 'Close' }],
      }),
    );
  }

  // ---- 2. Fixed size and resizable ----

  /** A fixed size: no edges to pull (resizable is false by default), but it can still be moved by its title. */
  protected fixed(): void {
    this.show(
      'size',
      this.dialogs.open({
        title: 'A fixed size',
        text: 'This window is 360 × 240 px and stays so: it has no edges to pull. It can still be moved by its title.',
        width: 360,
        height: 240,
        buttons: [{ id: 'ok', label: 'OK', variant: 'primary', default: true }],
      }),
    );
  }

  /** A resizable dialog with a component that fills its body (fill) and says how big it is. It is never bigger than its maxWidth and maxHeight, nor than the browser window. */
  protected resizable(): void {
    this.show(
      'size',
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
      }),
    );
  }

  // ---- 3. HTML and a component ----

  /** A piece of HTML: Angular sanitizes it, so no scripts and no event handlers get through. */
  protected html(): void {
    this.show(
      'content',
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
      }),
    );
  }

  /** A component with inputs. It has no buttons of the dialog: it closes the dialog itself, with the count. */
  protected component(): void {
    this.show(
      'content',
      this.dialogs.open<number>({
        title: 'A component in the body',
        component: CounterDialog,
        inputs: { start: 5 },
      }),
    );
  }

  // ---- 4. The result ----

  /** A question with three answers: the result is the id of the button. Esc and the cross give the answer of the Cancel button. */
  protected question(): void {
    this.show(
      'result',
      this.dialogs.open<'save' | 'discard' | 'cancel'>({
        title: 'Save the changes?',
        text: 'The document has changes that are not saved yet.',
        role: 'alertdialog',
        buttons: [
          { id: 'discard', label: "Don't save", align: 'start' },
          { id: 'cancel', label: 'Cancel', cancel: true },
          { id: 'save', label: 'Save', variant: 'primary', default: true },
        ],
      }),
    );
  }

  /**
   * A form: the component keeps the Save button up to date (disabled without a name, its result the customer), so the dialog closes with the customer. Saving
   * takes a moment: the button is busy and the dialog waits for its run.
   */
  protected newCustomer(): void {
    this.show(
      'result',
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
      }),
    );
  }

  // ---- 5. Layered modal dialogs ----

  /** The parent: a dialog with the order. Its component opens the child dialog; Confirm is enabled (and gets its result) from the component. */
  protected newOrder(): void {
    this.show(
      'layers',
      this.dialogs.open<string>({
        title: 'New order',
        subtitle: 'The first level: a dialog whose component opens another one.',
        icon: 'grd:document',
        component: OrderDialog,
        buttons: [
          { id: 'cancel', label: 'Cancel', cancel: true },
          { id: 'confirm', label: 'Confirm', variant: 'primary', default: true, disabled: true },
        ],
      }),
    );
  }

  // ---- 6. With a status bar ----

  /**
   * The page fills the status bar: a file name that changes and the progress, with `ref.update()` from a timer. Cancel gives the number of the files
   * copied so far; at the end the dialog says so and has an OK button instead (marked `cancel` too, so Esc and the cross give the same).
   */
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

  /** A component that keeps the status bar of its dialog up to date (`statusBar: true` asks for an empty bar, the component fills it). Save gives the note. */
  protected note(): void {
    this.show(
      'status',
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
      }),
    );
  }

  // ---- the results ----

  /** The result of the last dialog of a section, for the page. */
  protected outcome(section: SectionId): string {
    const outcome = this.outcomes()[section];
    return outcome ? `${outcome.value} (reason: ${outcome.reason})` : '–';
  }

  /** Waits until the dialog closes, then shows its result and how it was closed. */
  private async show<T>(section: SectionId, ref: GrdDialogRef<T>): Promise<void> {
    const result = await ref.closed;
    const value = result === undefined ? 'undefined' : JSON.stringify(result);
    this.outcomes.update((all) => ({ ...all, [section]: { value, reason: ref.reason() ?? '' } }));
  }
}
