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
