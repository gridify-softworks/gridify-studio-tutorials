import { Component, inject } from '@angular/core';
import { GrdKanban, type GrdKanbanCard, type GrdMenuItem } from '@gridify/studio';
import { Board, COLUMNS, type Task } from './board';
import { TaskDialog } from './task-dialog';

/** A document: the kanban board of the sprint. */
@Component({
  selector: 'app-board-page',
  imports: [GrdKanban],
  template: `
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
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      padding: 8px;
      box-sizing: border-box;
    }
  `,
})
export class BoardPage {
  protected readonly board = inject(Board);
  protected readonly dialog = inject(TaskDialog);
  protected readonly columns = COLUMNS;

  /** Our items in the menu of a card, after the moves of the board. */
  protected readonly menuOf = (card: GrdKanbanCard<Task>): GrdMenuItem[] => [
    { label: '&Edit…', run: () => void this.dialog.edit(card) },
  ];
}
