# 043 – The layout inside a tab

This tutorial shows how to arrange the inside of one tab: an inbox cut into the list of the messages and the message itself by a line that the user drags (`grd-splitter`), and a column and a row of elements without CSS of your own (`grd-stack`). You will learn how to:

- cut a tab into panes (`grd-splitter`, `grd-split-pane`), with widths in pixels and in shares of the rest (`280px`, `1fr`);
- keep the widths the user dragged, across F5 (`[(columns)]`);
- put elements into a column or a row with a gap (`grd-stack`);
- tell which tool to use for what: the engine arranges the tabs of the application, the splitter the inside of one tab.

It continues 040 and 041 (the shell and the default layout of the engine).

```
npm run tutorial 043
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30043 and drag the line between the list and the message.

## The words first

- **A pane** is a part of the splitter; **the line** between two panes is what the user drags.
- **A track** is the width of a column of panes: a length (`280px`, `20em`) or a share of the room that is left (`1fr`, `2fr`).
- **A stack** is a column (or a row) of elements with the same gap between them.
- **The engine or the splitter?** The engine arranges tabs that the user can move, float and close: the parts of an application. The splitter arranges the parts of one view, which always stay together: the list and the message of an inbox.

## Step by step

### Step 1: the messages

`src/app/mail.ts` has the messages of the inbox:

```ts
/** A message of the inbox. */
export interface Message {
  readonly id: number;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
}

/** The inbox. A real application loads it from its server. */
export const MESSAGES: readonly Message[] = [
  {
    id: 1,
    from: 'Olivia Brown',
    subject: 'The offer for Northwind',
    text: 'Hi, the offer is ready. Can you check the prices before Friday?',
  },
  {
    id: 2,
    from: 'Petr Svoboda',
    subject: 'Meeting on Monday',
    text: 'Ahoj, the meeting moves to 10:00, in the small room.',
  },
  {
    id: 3,
    from: 'Lucas Meyer',
    subject: 'Invoice 1003',
    text: 'Thank you for the invoice. We will pay it this week.',
  },
  {
    id: 4,
    from: 'Emma Wilson',
    subject: 'New photos',
    text: 'The photos of the shop are on the shared drive.',
  },
];
```

### Step 2: the inbox

`src/app/inbox-page.ts` is the document:

```ts
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
```

- **`grd-splitter`** fills its place (the tab) and puts its panes side by side, one for each width of `columns`. `[rows]` would put them under each other; both together make a grid.
- **`[(columns)]`** is two-way: the splitter shows the widths, and gives new ones when the user drags the line (or moves it with the arrow keys when it has the focus). An `effect` keeps them in `localStorage`.
- **`grd-stack`** puts its children in a column (`direction="row"` in a row) with `gap` between them: the buttons, the subject, the sender, the text.

### Step 3: the layout of the engine

`src/app/app.ts` puts the inbox and a small tool into the engine, as 015 does.

### Step 4: run it

```
npm run tutorial 043
```

## Try it

1. **Choose a message.** Click _Petr Svoboda_: the message is on the right.
2. **Drag the line** between the list and the message: the list is wider or narrower. A pane never gets narrower than 48 px (`minSize`).
3. **F5.** The list has the width you left it with (`tutorial-043-widths` in `localStorage`).
4. **The keyboard.** Tab to the line and press the arrows: it moves 10 px at a time (`step`).
5. **The engine around it.** Drag the tool _Notes_ to the right side, or float it: the inbox keeps its own layout inside its tab.

## More

- **Three panes**: `[columns]="['200px', '1fr', '1fr']"` and three `grd-split-pane`s.
- **A grid**: `[columns]` and `[rows]` together, with `rowSpan` and `columnSpan` on a pane (a tree on the left over both rows, an editor and a console on the right).
- **A stack that wraps**: `wrap` lets a row of elements go on in the next line when it has no room.

## Build it yourself

`npm run tutorial:eject 043 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `mail.ts`, `inbox-page.ts` and `notes-tool.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
