import { Injectable } from '@angular/core';
import { grdEncodeUrlState, type GrdUrlBridge } from '@gridify/studio';

/** The tag of an invoice: `invoice:1001`, the type and the number. The address is made of tags. */
export function invoiceTag(id: string): string {
  return `invoice:${id}`;
}

/**
 * The links to the invoices. The application puts the bridge here once the engine is ready (see
 * app.ts); the list and the invoices use it to open an invoice and to write a link to it.
 */
@Injectable({ providedIn: 'root' })
export class Links {
  /** The bridge between the engine and the address; `null` until the engine is ready. */
  bridge: GrdUrlBridge | null = null;

  /** The address of an invoice, as a link writes it: `?a=invoice:1001&o=invoice:1001`. */
  href(id: string): string {
    const tag = invoiceTag(id);
    // a = the active document, o = the open documents.
    return '?' + grdEncodeUrlState({ active: tag, open: [tag] });
  }

  /**
   * A click on a link to an invoice. A plain click opens the invoice here, as a tab of the engine
   * (or shows it, when it is open already). A click with Ctrl (Cmd on a Mac) or Shift is left to
   * the browser, which opens the link in a new tab or window.
   */
  open(id: string, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey) return;
    // The browser does not load the page: the bridge opens the invoice and writes the address.
    event.preventDefault();
    this.bridge?.open(invoiceTag(id));
  }
}
