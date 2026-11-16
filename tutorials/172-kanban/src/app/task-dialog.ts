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
