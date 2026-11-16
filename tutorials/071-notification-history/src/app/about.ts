import { Component } from '@angular/core';

/** What this tutorial is about: the first thing on the page, there as soon as it starts. */
@Component({
  selector: 'app-about',
  template: `
    <h1>The history of the notifications</h1>
    <p>
      A toast says something for a few seconds and goes away. It is easy to miss: the user looked
      elsewhere, or three came at once. The history keeps what the toasts said, the newest first, so
      the user can come back to it. This page has it in four places:
    </p>
    <ul>
      <li>
        <strong>The bell</strong> at the right end of the toolbar. The number on it is how many
        notifications you have not seen. Press it: the history opens under it, and the notifications
        count as seen when it closes.
      </li>
      <li>
        <strong>View › Notifications</strong> in the menu bar: the newest ten as menu items. A
        choice shows the toast again; Mark all as read and Clear are at the end.
      </li>
      <li>
        <strong>The list</strong> on this page: the same history, with the details, Show again (the
        eye) and Remove (the cross).
      </li>
      <li>
        <strong>The status bar</strong> at the bottom: how many are unread. Press the bell there:
        the newest ten open above the bar, as in the menu.
      </li>
    </ul>

    <h2>Try it</h2>
    <ol>
      <li>The bell shows 1 already: the welcome toast that came when the page opened.</li>
      <li>
        Press <strong>Receive</strong> in the toolbar: three toasts at once. They go after a few
        seconds; the history keeps them.
      </li>
      <li>
        Press <strong>Save</strong> (or Ctrl+S, ⌘S on a Mac): "Saving…" becomes "Saved.", and that
        is one notification, not two.
      </li>
      <li>
        Press <strong>Print</strong>: an error, with its detail under Details.
        <strong>Copy link</strong> says that the link is copied, and leaves nothing in the history.
      </li>
      <li>
        Open the bell, show one of the notifications again, then close the bell: the number goes.
      </li>
    </ol>

    <p class="note">
      The history is off in the library until the application turns it on:
      <code>provideGrdToastHistory()</code> in <code>app.config.ts</code>. Without it nothing is
      kept, the bell is not shown, and the list says that the history is off.
    </p>
  `,
  styles: `
    :host {
      display: block;
      max-width: 72ch;
      line-height: 1.5;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 1.3rem;
    }
    h2 {
      margin: 16px 0 4px;
      font-size: 1.05rem;
    }
    p,
    ul,
    ol {
      margin: 0 0 8px;
    }
    li + li {
      margin-top: 4px;
    }
    .note {
      margin-top: 16px;
      padding: 8px 12px;
      border-inline-start: 3px solid var(--grd-accent);
      background: color-mix(in srgb, var(--grd-accent) 8%, transparent);
    }
    code {
      font-family: var(--grd-font-mono, monospace);
    }
  `,
})
export class About {}
