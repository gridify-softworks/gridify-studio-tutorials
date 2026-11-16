# 172 – A kanban board

This tutorial shows a kanban board (`grd-kanban`) in a docking application: the tasks of a sprint in columns, moved by the mouse, a finger or the keyboard, with a limit for the column _Doing_ and a rule of the team. You will learn how to:

- give the board its columns and cards (`GrdKanbanColumn`, `GrdKanbanCard`), with data of your own on a card;
- change the cards when the user moves one (`cardMoved`, `grdKanbanApplyMove`): the board never changes them itself;
- set a limit of a column, and a rule that refuses some moves (`limit`, `canDrop`);
- open a card (`cardActivated`), add one and edit one in a dialog (`addable`, `addRequested`, `cardMenuItems`, `GrdDialog`).

```
npm run tutorial 172
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30172 and drag a card to another column.

## The words first

- **A column** is a stage of the work: _To do_, _Doing_, _Review_, _Done_. **A card** is a task; it says in which column it is (`column`).
- **The order of the cards** in a column is their order in the list `cards`: the board has no other.
- **A move** is what the user did: the card, the column it came `from`, the column it went `to`, and its new place there (`index`).
- **The data is yours**: the board draws the lists it is given and tells what the user did; the application changes the lists, so it can ask a server first, or refuse.

## Step by step

### Step 1: the board and its rules

`src/app/board.ts` has the columns, the cards, and what the application does with a move:

```ts
import { Injectable, signal } from '@angular/core';
import {
  grdKanbanApplyMove,
  type GrdKanbanCard,
  type GrdKanbanColumn,
  type GrdKanbanMove,
} from '@gridify/studio';

/** What the application keeps with a card: who works on it (`null`: nobody yet). */
export interface Task {
  readonly owner: string | null;
}

/** What the dialog of a task shows and gives back: the text of the card, its tags (the badges under the text) and the owner. */
export interface TaskFields {
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly owner: string | null;
}

/** The columns, left to right. Doing takes three cards at most: a fourth is let in, and the column is marked. */
export const COLUMNS: GrdKanbanColumn[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing', limit: 3 },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
];

/** The board of a sprint: the cards, and what happened to them. */
@Injectable({ providedIn: 'root' })
export class Board {
  private nextId = 9;

  /** The cards of all the columns. The place of a card in its column is its place in this list. */
  readonly cards = signal<readonly GrdKanbanCard<Task>[]>([
    {
      id: 'c1',
      column: 'todo',
      title: 'Price list for 2027',
      tags: ['sales'],
      data: { owner: 'Emma' },
    },
    {
      id: 'c2',
      column: 'todo',
      title: 'New photos of the shop',
      tags: ['web'],
      data: { owner: 'Liam' },
    },
    {
      id: 'c3',
      column: 'doing',
      title: 'Invoice template',
      description: 'The logo, the bank account and the VAT number.',
      tags: ['finance'],
      data: { owner: 'Petr' },
    },
    {
      id: 'c4',
      column: 'doing',
      title: 'Export of the orders',
      tags: ['IT'],
      data: { owner: 'Olivia' },
    },
    {
      id: 'c5',
      column: 'review',
      title: 'Terms of delivery',
      tags: ['legal'],
      data: { owner: 'Noah' },
    },
    {
      id: 'c6',
      column: 'done',
      title: 'Opening hours on the web',
      tags: ['web'],
      data: { owner: 'Liam' },
    },
  ]);
  /** The card that was opened last (a double click or Enter). */
  readonly opened = signal<GrdKanbanCard<Task> | null>(null);
  /** What happened, the newest first. */
  readonly log = signal<readonly string[]>([]);

  /** The rule of the team: a card goes through Review, never from To do straight to Done. */
  readonly canDrop = (move: GrdKanbanMove<Task>): boolean =>
    !(move.from === 'todo' && move.to === 'done');

  /** The user moved a card: the board has not changed anything, the application does it here. */
  move(move: GrdKanbanMove<Task>): void {
    this.cards.set(grdKanbanApplyMove(this.cards(), move));
    if (move.from !== move.to)
      this.write(`${move.card.title}: ${this.titleOf(move.from)} → ${this.titleOf(move.to)}`);
  }

  /** "Add card" of a column: a new card at its end, with what the dialog gave. */
  add(column: GrdKanbanColumn, fields: TaskFields): void {
    const card: GrdKanbanCard<Task> = {
      id: `c${this.nextId++}`,
      column: column.id,
      ...cardFields(fields),
    };
    this.cards.update((cards) => [...cards, card]);
    this.write(`${card.title}: new in ${column.title}`);
  }

  /** A task that was edited: its card becomes a new object with the new fields, in the same place (the board draws it again). */
  update(id: string, fields: TaskFields): void {
    const card = this.cards().find((candidate) => candidate.id === id);
    if (!card) return;
    const changed: GrdKanbanCard<Task> = { ...card, ...cardFields(fields) };
    this.cards.update((cards) =>
      cards.map((candidate) => (candidate.id === id ? changed : candidate)),
    );
    if (this.opened()?.id === id) this.opened.set(changed);
    this.write(`${changed.title}: edited`);
  }

  private titleOf(column: string): string {
    return COLUMNS.find((candidate) => candidate.id === column)?.title ?? column;
  }

  private write(line: string): void {
    this.log.update((log) => [line, ...log]);
  }
}

/** The fields of a card, for the dialog. */
export function fieldsOf(card: GrdKanbanCard<Task>): TaskFields {
  return {
    title: card.title,
    description: card.description ?? '',
    tags: card.tags ?? [],
    owner: card.data?.owner ?? null,
  };
}

/** What a card takes from the fields of the dialog: an empty description and no tags are left out. */
function cardFields(
  fields: TaskFields,
): Pick<GrdKanbanCard<Task>, 'title' | 'description' | 'tags' | 'data'> {
  return {
    title: fields.title,
    description: fields.description || undefined,
    tags: fields.tags.length ? fields.tags : undefined,
    data: { owner: fields.owner },
  };
}
```

- **`COLUMNS`**: `id` and `title`; `limit: 3` on _Doing_. A fourth card is let in and the column is marked (the default `limitMode: 'warn'`; `'block'` would refuse it).
- **The cards**: `id`, `column`, `title`, and optional `description`, `tags` (the badges under the text) and `data` (here the owner, a type of our own: `GrdKanbanCard<Task>`).
- **`canDrop`** is the rule of the team: no card goes from _To do_ straight to _Done_. The board asks it while a card is dragged (the column that refuses is marked) and again when it is dropped.
- **`move`** applies the move with **`grdKanbanApplyMove`** (it takes the card out and puts it at its new place) and writes a line to the log. A real application sends the move to its server first (`beforeId` and `afterId` of the move say between which cards it landed).
- **`add`** puts a new card at the end of a column, with the fields that the dialog of step 3 gave. **`update`** gives a card that was edited its new fields: a new object in the same place of the list, so the board draws it again (and the details, when it is the card they show). **`fieldsOf`** turns a card into the fields of the dialog.

### Step 2: the board in a tab

`src/app/board-page.ts` is the document:

<!-- prettier-ignore -->
```html
<!--
  The board draws the columns and the cards, and says what the user did. It never changes the
  cards itself: (cardMoved) gives the move, and the application changes the list.
-->
<grd-kanban
  [columns]="columns"
  [cards]="board.cards()"
  [canDrop]="board.canDrop"
  [cardMenuItems]="menuOf"
  addable
  (cardMoved)="board.move($event)"
  (cardActivated)="board.opened.set($event)"
  (addRequested)="dialog.add($event)"
/>
```

and, in the class, the item of our own in the menu of a card:

```ts
/** Our items in the menu of a card, after the moves of the board. */
protected readonly menuOf = (card: GrdKanbanCard<Task>): GrdMenuItem[] => [
  { label: '&Edit…', run: () => void this.dialog.edit(card) },
];
```

- **`[cards]`** is the signal of step 1; after a move it is a new list, and the board draws it.
- **`(cardMoved)`** gives the move; **`(cardActivated)`** a card that was double-clicked (or Enter on it); **`(addRequested)`** the column whose _Add card_ was pressed (`addable` draws the buttons): the dialog of step 3 asks for the task.
- **`[cardMenuItems]`** gives the items of the page for the menu of a card (the three dots, a right-click, the Menu key); the board puts them after its own moves. `&` before a letter makes it the key of the item.

### Step 3: the dialog of a task

`src/app/task-dialog.ts` asks for a task, a new one and one that is edited, in a dialog of the library (`GrdDialog`):

```ts
import { Component, Injectable, effect, inject, model } from '@angular/core';
import {
  GrdDialog,
  GrdInput,
  GrdSelect,
  GrdTags,
  GrdTextarea,
  injectGrdDialogRef,
  type GrdKanbanCard,
  type GrdKanbanColumn,
} from '@gridify/studio';
import { Board, fieldsOf, type Task, type TaskFields } from './board';

/** Who can own a task. */
const TEAM = ['Emma', 'Liam', 'Noah', 'Olivia', 'Petr'];

/**
 * The body of the dialog of a task. The dialog sets its fields (`inputs`), and the body gives the dialog its result while it
 * is open: the button Save gets the fields as they are now, and it is off while the task has no title.
 */
@Component({
  selector: 'app-task-form',
  imports: [GrdInput, GrdSelect, GrdTags, GrdTextarea],
  template: `
    <grd-input label="Title" required [(value)]="title" />
    <grd-textarea label="Description" [rows]="3" [(value)]="description" />
    <grd-tags label="Tags" hint="Enter after each one: the badges of the card" [(value)]="tags" />
    <grd-select
      label="Owner"
      placeholder="Nobody yet"
      [options]="team"
      clearable
      [(value)]="owner"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: min(26em, 80vw);
    }
  `,
})
export class TaskForm {
  readonly title = model('');
  readonly description = model('');
  readonly tags = model<readonly string[]>([]);
  readonly owner = model<string | null>(null);
  protected readonly team = TEAM.map((name) => ({ value: name, label: name }));
  private readonly dialog = injectGrdDialogRef<TaskFields | null, TaskForm>();

  constructor() {
    effect(() => {
      const fields: TaskFields = {
        title: this.title().trim(),
        description: this.description().trim(),
        tags: this.tags(),
        owner: this.owner(),
      };
      this.dialog.patchButton('save', { result: fields, disabled: !fields.title });
    });
  }
}

/** The dialog of a task: for a new card ("Add card" of a column) and for a card that is edited. */
@Injectable({ providedIn: 'root' })
export class TaskDialog {
  private readonly dialogs = inject(GrdDialog);
  private readonly board = inject(Board);

  /** "Add card": the dialog with empty fields, then a new card at the end of the column. */
  async add(column: GrdKanbanColumn): Promise<void> {
    const empty: TaskFields = { title: '', description: '', tags: [], owner: null };
    const fields = await this.open('New task', `At the end of ${column.title}`, 'Add', empty);
    if (fields) this.board.add(column, fields);
  }

  /** "Edit…": the dialog with the fields of the card, then the card changed. */
  async edit(card: GrdKanbanCard<Task>): Promise<void> {
    const fields = await this.open('Edit the task', card.title, 'Save', fieldsOf(card));
    if (fields) this.board.update(card.id, fields);
  }

  /** The fields of the task, or `null` when the user cancelled (the button, Esc or the cross). */
  private async open(title: string, subtitle: string, save: string, fields: TaskFields) {
    const ref = this.dialogs.open<TaskFields | null, TaskForm>({
      title,
      subtitle,
      component: TaskForm,
      inputs: { ...fields },
      autoFocus: 'app-task-form input',
      buttons: [
        { id: 'cancel', label: 'Cancel', cancel: true, result: null },
        { id: 'save', label: save, variant: 'primary', default: true, disabled: !fields.title },
      ],
    });
    return (await ref.closed) ?? null;
  }
}
```

- **`TaskForm`** is the body of the dialog: four fields of the library with `[(value)]`. Its fields are `model()`s, so the dialog fills them in (`inputs` of `open`, with the fields of a card when it is edited).
- **The result** comes from the body while the dialog is open: an `effect` gives the button _Save_ the fields as they are now (`patchButton('save', {result})`) and turns it off while there is no title (`disabled`). The code after `await ref.closed` cannot ask the body any more, it is gone by then.
- **`cancel: true`** makes _Cancel_ the way out: Esc and the cross give its `result` (`null`) too. `autoFocus` puts the cursor into the title.
- **`TaskDialog`** opens the same dialog for both: `add` with empty fields, `edit` with the fields of the card, and then the board changes the cards (step 1).

### Step 4: the details

`src/app/details-tool.ts` is a tool: the card that was opened last (with _Edit…_, the dialog of step 3), and the log.

```ts
template: `
  @if (board.opened(); as card) {
    <h3>{{ card.title }}</h3>
    <p>{{ card.description ?? 'No description.' }}</p>
    <p>Owner: {{ card.data?.owner ?? 'nobody yet' }}</p>
    <grd-button label="Edit…" (pressed)="dialog.edit(card)" />
  } @else {
    <p class="hint">Double-click a card (or press Enter on it) to see it here.</p>
  }
  <h4>What happened</h4>
  @for (line of board.log(); track $index) {
    <div class="line">{{ line }}</div>
  }
`,
```

### Step 5: run it

```
npm run tutorial 172
```

## Try it

1. **Drag.** Drag _Price list for 2027_ from _To do_ to _Doing_: it moves, and the log says _Price list for 2027: To do → Doing_.
2. **The limit.** Drag _New photos of the shop_ to _Doing_ as well: it has four cards now, and the column says _Limit 3 exceeded_.
3. **The rule.** Try to drag a card of _To do_ to _Done_: the column is marked as refusing, and the card stays. The menu of a card (the three dots, or a right-click) says _Done (not allowed)_.
4. **The menu of a card.** _Move to column_, _To the top of the column_, _To the bottom of the column_: the same moves without dragging.
5. **The keyboard.** Tab to a card, press Space to lift it, the arrows to move it (Left and Right between the columns), Space or Enter to put it down, Esc to put it back.
6. **Open.** Double-click _Invoice template_ (or press Enter on it): the details show its description and its owner.
7. **Add.** Press _Add card_ under _Review_: the dialog asks for the title (_Add_ is off until there is one), a description, the tags (Enter after each one) and the owner. _Add_ puts the card at the end of _Review_, with its tags as badges; _Cancel_ or Esc adds nothing.
8. **Edit.** Open the menu of a card (the three dots, or a right-click) and choose _Edit…_, or press _Edit…_ in the details: the same dialog, with the fields of the card. Change the title, take a tag away with its cross, and _Save_: the card shows it at once.

## More

- **A column that takes nothing**: `dropDisabled: true` on a column.
- **Folded columns**: `[(collapsed)]` holds the ids of the columns folded into a narrow strip (the button in the header of a column).
- **Your own card**: a template with `grdKanbanCard` draws the card the way you want (an avatar of the owner, a date).
- **Delete a card**: one more item in `cardMenuItems`, which asks first (`GrdMessageBox.confirm`) and then takes the card out of `cards`.

## Build it yourself

`npm run tutorial:eject 172 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `board.ts`, `task-dialog.ts`, `board-page.ts` and `details-tool.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
