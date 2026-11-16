import { Component, computed, effect, signal } from '@angular/core';
import {
  GrdButton,
  GrdSplitPane,
  GrdSplitter,
  type GrdSplitTrack,
  GrdStack,
} from '@gridify/studio';
import { MESSAGES } from './mail';

/** The key in localStorage under which the widths of the panes are kept. */
const KEY = 'tutorial-043-widths';

/** The widths as they were left, or the ones of the start. */
function savedWidths(): readonly GrdSplitTrack[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '') as GrdSplitTrack[];
  } catch {
    return ['280px', '1fr'];
  }
}

/** A document: the inbox, cut into the list and the message by a line that the user drags. */
@Component({
  selector: 'app-inbox-page',
  imports: [GrdButton, GrdSplitPane, GrdSplitter, GrdStack],
  template: `
    <!--
      Two panes side by side: the list (280 px at the start) and the message (the rest, 1fr).
      [(columns)] is two-way: dragging the line gives new widths, and they are kept.
    -->
    <grd-splitter [(columns)]="widths" ariaLabel="Inbox">
      <grd-split-pane>
        <ul>
          @for (message of messages; track message.id) {
            <li>
              <!-- A button, so the keyboard chooses a message too (Tab, then Enter or Space). -->
              <button
                type="button"
                [attr.aria-current]="message.id === selectedId() ? 'true' : null"
                (click)="selectedId.set(message.id)"
              >
                <b>{{ message.from }}</b>
                <span>{{ message.subject }}</span>
              </button>
            </li>
          }
        </ul>
      </grd-split-pane>
      <grd-split-pane>
        @if (selected(); as message) {
          <!-- A stack puts its children in a column (or a row) with a gap: no CSS of your own. -->
          <grd-stack gap="12px" class="message">
            <grd-stack direction="row" gap="8px">
              <grd-button label="Reply" variant="primary" />
              <grd-button label="Forward" />
              <grd-button label="Delete" />
            </grd-stack>
            <h2>{{ message.subject }}</h2>
            <p class="from">From {{ message.from }}</p>
            <p>{{ message.text }}</p>
          </grd-stack>
        }
      </grd-split-pane>
    </grd-splitter>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      border-bottom: 1px solid var(--grd-border-color);
    }
    li button {
      display: flex;
      flex-direction: column;
      width: 100%;
      padding: 8px 12px;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }
    li button:focus-visible {
      outline-offset: -2px;
    }
    li button[aria-current] {
      background: var(--grd-bg-panel);
    }
    .message {
      padding: 12px 20px;
    }
    h2,
    p {
      margin: 0;
    }
    .from {
      opacity: 0.88;
    }
  `,
})
export class InboxPage {
  protected readonly messages = MESSAGES;
  protected readonly selectedId = signal(1);
  protected readonly selected = computed(() => MESSAGES.find((m) => m.id === this.selectedId()));
  /** The widths of the two panes: a length (`280px`) or a share of the rest (`1fr`). */
  protected readonly widths = signal<readonly GrdSplitTrack[]>(savedWidths());

  constructor() {
    // The widths are kept whenever the user drags the line, and come back after F5.
    effect(() => {
      const widths = JSON.stringify(this.widths());
      try {
        localStorage.setItem(KEY, widths);
      } catch {
        // The storage is off or full: the widths live as long as the page.
      }
    });
  }
}
