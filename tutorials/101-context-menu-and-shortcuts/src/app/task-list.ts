import { Component, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { GrdButton, GrdContextMenu, GrdInput, type GrdMenuItem } from '@gridify/studio';
import { taskCommands } from './commands';
import { type Task, Tasks } from './tasks';

/** The document: the list of the tasks, and a field for a new one. */
@Component({
  selector: 'app-task-list',
  imports: [GrdButton, GrdContextMenu, GrdInput],
  template: `
    <form (submit)="add($event)">
      <grd-input label="New task" [(value)]="title" [reserveMessageSpace]="false" />
      <grd-button type="submit" label="Add" />
    </form>

    <!-- The list has a context menu of its own: a right-click on its empty part. -->
    <ul [grdContextMenu]="listMenu">
      @for (task of tasks.list(); track task.id) {
        <!--
          Every task has its context menu: the right mouse button, the Menu key or Shift+F10. The
          function makes the items when the menu opens. The menu of a task wins over the menu of
          the list around it.
        -->
        <li
          tabindex="0"
          [class.selected]="task.id === tasks.selectedId()"
          [class.done]="task.done"
          [grdContextMenu]="() => menuOf(task)"
          (click)="tasks.select(task.id)"
          (focus)="tasks.select(task.id)"
        >
          {{ task.title }}
        </li>
      }
    </ul>
    <p class="hint">Right-click a task, or the empty part of the list. F1 shows the keys.</p>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 16px;
    }
    form {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin-bottom: 12px;
    }
    ul {
      margin: 0;
      padding: 0 0 48px;
      list-style: none;
    }
    li {
      padding: 6px 8px;
      border-bottom: 1px solid var(--grd-border-color);
      cursor: default;
    }
    li.selected {
      background: var(--grd-bg-panel);
      font-weight: bold;
    }
    li.done {
      text-decoration: line-through;
      opacity: 0.88;
    }
    .hint {
      opacity: 0.88;
    }
  `,
})
export class TaskList {
  protected readonly tasks = inject(Tasks);
  /** The text of the field "New task". */
  protected readonly title = signal('');
  private readonly field = viewChild.required(GrdInput);

  /** The context menu of the empty part of the list: only New task. */
  protected readonly listMenu: GrdMenuItem[] = [
    { label: 'New task', shortcut: 'Alt+N', run: () => this.tasks.askForNewTask() },
  ];

  constructor() {
    // "New task" (from a menu or by Alt+N): the cursor goes into the field.
    effect(() => {
      if (this.tasks.newTaskAsked() > 0) untracked(() => this.field().focus());
    });
  }

  /** The context menu of a task: the task is selected first, then the commands are made for it. */
  protected menuOf(task: Task): GrdMenuItem[] {
    this.tasks.select(task.id);
    return taskCommands(this.tasks);
  }

  /** The form: Enter in the field, or Add. */
  protected add(event: Event): void {
    event.preventDefault();
    const title = this.title().trim();
    if (!title) return;
    this.tasks.add(title);
    this.title.set('');
  }
}
