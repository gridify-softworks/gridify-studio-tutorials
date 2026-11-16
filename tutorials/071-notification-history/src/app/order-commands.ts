import { inject, Injectable, signal } from '@angular/core';
import { type GrdCommand, GrdToast } from '@gridify/studio';

/** A pause, as a server takes its time. */
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The commands of the order. Each one tells the user what it did with a toast, and every toast goes
 * into the history of the notifications (app.config.ts turned it on): the commands know nothing of
 * the history. A command is written once; the menu bar and the toolbar are made of it
 * (`grdMenuItemOf`, `grdToolbarItemOf`).
 */
@Injectable({ providedIn: 'root' })
export class OrderCommands {
  private readonly toast = inject(GrdToast);
  /** Is the order being saved? Save waits until it is. */
  private readonly saving = signal(false);
  /** The number of the next order that comes in. */
  private nextOrder = 1043;

  readonly save: GrdCommand = {
    id: 'save',
    label: '&Save',
    icon: 'app:save',
    shortcut: 'Mod+S',
    enabled: () => !this.saving(),
    run: () => void this.saveOrder(),
  };
  readonly importLines: GrdCommand = {
    id: 'import',
    label: '&Import lines',
    icon: 'app:import',
    run: () => this.importFromFile(),
  };
  readonly print: GrdCommand = {
    id: 'print',
    label: '&Print',
    icon: 'app:print',
    run: () => this.printOrder(),
  };
  readonly send: GrdCommand = {
    id: 'send',
    label: 'Se&nd to the customer',
    icon: 'app:send',
    run: () => this.sendOrder(),
  };
  readonly copyLink: GrdCommand = {
    id: 'link',
    label: '&Copy link',
    icon: 'app:link',
    run: () => void this.copy(),
  };
  readonly receive: GrdCommand = {
    id: 'receive',
    label: '&Receive messages',
    icon: 'app:inbox',
    run: () => this.receiveMessages(),
  };

  /**
   * One toast that changes: "Saving…" becomes "Saved.". The history keeps one notification for it,
   * and the change brings it to the top again, unread.
   */
  private async saveOrder(): Promise<void> {
    this.saving.set(true);
    const toast = this.toast.info('Saving order 1042…', { closeAfter: 0, closable: false });
    await wait(1200);
    toast.update({
      text: 'Order 1042 is saved.',
      severity: 'success',
      closeAfter: 4000,
      closable: true,
    });
    this.saving.set(false);
  }

  /** A title and a detail: the history keeps both, the detail under Details as in the toast. */
  private importFromFile(): void {
    this.toast.warning('3 lines imported, 2 left out.', {
      title: 'Import of lines.csv',
      detail: 'Line 4: the product "X-200" is not known.\nLine 7: "-2" is not a quantity.',
    });
  }

  /** An error stays until it is closed; in the history it waits with the others. */
  private printOrder(): void {
    this.toast.error('The printer "Office 2" does not answer.', {
      title: 'Print',
      detail:
        'Printer: Office 2 (192.168.1.40)\nDocument: order-1042.pdf, 2 pages\nNo answer in 30 s.',
    });
  }

  /**
   * The buttons of a toast belong to its moment: the history keeps the text, not Undo (Show again
   * shows the toast without it).
   */
  private sendOrder(): void {
    this.toast.success('Order 1042 was sent to ACME Ltd.', {
      actions: [
        { label: 'Undo', run: () => this.toast.info('The sending of order 1042 is undone.') },
      ],
    });
  }

  /**
   * "Copied" only says what has just happened. It is worth nothing later, so it stays out of the
   * history (`history: false`). A failure is kept: later the user may want to know why the link is
   * not there.
   */
  private async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${location.origin}/orders/1042`);
      this.toast.success('The link is copied.', { history: false, closeAfter: 2000 });
    } catch {
      this.toast.warning('The browser did not let the page copy the link.');
    }
  }

  /**
   * Three at once, as a server sends them. Their toasts go after a few seconds; the history keeps
   * them, and the bell counts them.
   */
  private receiveMessages(): void {
    const order = this.nextOrder++;
    this.toast.info(`New order ${order} from Nordic Tools.`, { title: 'Orders' });
    this.toast.success(`The payment of order ${order - 4} has arrived.`, { title: 'Payments' });
    this.toast.warning('Only 3 desk lamps are left in stock.', { title: 'Stock' });
  }
}
