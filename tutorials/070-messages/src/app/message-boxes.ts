import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdMessageBox, GrdMessageBoxRef } from '@gridify/studio';

/** The message boxes: the four kinds, confirm, buttons of your own, a queue and a box that is not modal. */
@Component({
  selector: 'app-message-boxes',
  imports: [GrdButton],
  host: { class: 'demo' },
  template: `
    <h2>1. Message boxes</h2>
    <p>
      A message box is a small dialog. It blocks the page until it is answered, Esc closes it, and
      the focus goes back to the button that opened it. Every box gives a promise of its answer: the
      id of the button that was pressed, or true and false for confirm.
    </p>
    <div class="row">
      <span class="row-name">Kind</span>
      <grd-button label="Info" (pressed)="info()" />
      <grd-button label="Warning" (pressed)="warning()" />
      <grd-button label="Error" (pressed)="error()" />
      <grd-button label="Question" (pressed)="question()" />
    </div>
    <div class="row">
      <span class="row-name">Confirm</span>
      <grd-button label="Send the invoice" (pressed)="confirm()" />
      <grd-button label="Delete the files" variant="danger" (pressed)="confirmDanger()" />
    </div>
    <div class="row">
      <span class="row-name">More</span>
      <grd-button label="Own buttons" (pressed)="ownButtons()" />
      <grd-button label="Three in a queue" (pressed)="queue()" />
      <grd-button label="Not modal" (pressed)="notModal()" />
    </div>
    <output class="answer">Answer: {{ answer() }}</output>
  `,
})
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
