import { Component, inject } from '@angular/core';
import { GrdButton } from '@gridify/studio';
import { Board } from './board';
import { TaskDialog } from './task-dialog';

/** A tool: the card that was opened last, and what happened on the board. */
@Component({
  selector: 'app-details-tool',
  imports: [GrdButton],
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
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    h3 {
      margin: 0 0 4px;
    }
    .hint {
      opacity: 0.88;
    }
    .line {
      padding: 2px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
  `,
})
export class DetailsTool {
  protected readonly board = inject(Board);
  protected readonly dialog = inject(TaskDialog);
}
