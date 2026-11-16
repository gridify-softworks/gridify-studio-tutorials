import { inject } from '@angular/core';
import { type GrdCanLeave, GrdMessageBox, GrdToast } from '@gridify/studio';

// What the Back button of the browser does when it would leave the application. Each one is a
// `canLeave`: true leaves, false stays, a promise is waited for. They run in the injection context
// of the application, so they can inject() what they need.

/** Back stays in the application, however often it is pressed, and nothing happens. */
export const STAY: GrdCanLeave = () => false;

/** Back stays, and a toast says why. Its id makes Back pressed again replace it, not stack it. */
export const TELL: GrdCanLeave = () => {
  inject(GrdToast).info('The Back button stays in the application. To leave it, close the tab.', {
    id: 'back',
  });
  return false;
};

/**
 * Back asks. confirm() answers true for the button that agrees (Leave) and false for the other one,
 * Esc and the cross (Stay). While the question is open, Back pressed once more leaves.
 */
export const ASK: GrdCanLeave = () =>
  inject(GrdMessageBox).confirm('The open invoices are kept: they come back with the address.', {
    id: 'leave',
    title: 'Leave the invoices?',
    confirmLabel: 'Leave',
    cancelLabel: 'Stay',
    // Enter presses the button that stays: a Back out of habit, then Enter, still stays.
    defaultAnswer: 'cancel',
  });
