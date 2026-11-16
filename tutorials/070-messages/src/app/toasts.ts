import { Component, inject, signal } from '@angular/core';
import { GRD_TOAST_POSITIONS, GrdButton, GrdToast, GrdToastPosition } from '@gridify/studio';

/** The toasts: the severities, the positions, the time, the content, actions, and one toast that changes. */
@Component({
  selector: 'app-toasts',
  imports: [GrdButton],
  host: { class: 'demo' },
  template: `
    <h2>2. Toasts</h2>
    <p>
      A toast is a short message in a corner of the window. It does not take the focus and blocks
      nothing. It goes away after a while (an error stays until it is closed), and it waits while
      the pointer is over it. A corner shows four toasts at once, the others wait for their turn.
    </p>
    <div class="row">
      <span class="row-name">Severity</span>
      <grd-button label="Info" (pressed)="info()" />
      <grd-button label="Success" (pressed)="success()" />
      <grd-button label="Warning" (pressed)="warning()" />
      <grd-button label="Error" (pressed)="error()" />
    </div>
    <div class="row">
      <span class="row-name">Position</span>
      @for (position of positions; track position) {
        <grd-button [label]="position" (pressed)="at(position)" />
      }
    </div>
    <div class="row">
      <span class="row-name">Time</span>
      <grd-button label="2 seconds" (pressed)="short()" />
      <grd-button label="Until closed" (pressed)="untilClosed()" />
      <grd-button label="Without the cross" (pressed)="notClosable()" />
      <grd-button label="Six at once" (pressed)="sixAtOnce()" />
      <grd-button label="Clear all" (pressed)="clearAll()" />
    </div>
    <div class="row">
      <span class="row-name">Content</span>
      <grd-button label="Title and detail" (pressed)="titleAndDetail()" />
      <grd-button label="Own icon" (pressed)="ownIcon()" />
      <grd-button label="Without an icon" (pressed)="noIcon()" />
    </div>
    <div class="row">
      <span class="row-name">Actions</span>
      <grd-button
        [label]="'Delete a message (' + inbox() + ' left)'"
        [disabled]="inbox() === 0"
        (pressed)="deleteMessage()"
      />
      <grd-button label="Wait for the end" (pressed)="waitForTheEnd()" />
    </div>
    <div class="row">
      <span class="row-name">One toast</span>
      <grd-button label="Save" (pressed)="save()" />
      <grd-button label="Download" (pressed)="download()" />
    </div>
    <output class="answer">Answer: {{ answer() }}</output>
  `,
})
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
