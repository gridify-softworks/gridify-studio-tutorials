import { computed, Injectable, signal } from '@angular/core';

/** One task of the list. */
export interface Task {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
}

/**
 * The tasks, which task is selected, and what happened (the log). The list, the menus and the
 * keys all work with this one service, so they always agree.
 */
@Injectable({ providedIn: 'root' })
export class Tasks {
  private nextId = 5;

  readonly list = signal<readonly Task[]>([
    { id: 1, title: 'Send the invoice to Northwind', done: false },
    { id: 2, title: 'Call Anna about the release', done: true },
    { id: 3, title: 'Book a table at U Fleků', done: false },
    { id: 4, title: 'Review the pull request of Tomáš', done: false },
  ]);
  readonly selectedId = signal<number | null>(1);
  readonly selected = computed(
    () => this.list().find((task) => task.id === this.selectedId()) ?? null,
  );
  /** What happened, the newest first: the Log shows it. */
  readonly log = signal<readonly string[]>([]);
  /** Grows by one when somebody asks for a new task: the list then puts the cursor into its field. */
  readonly newTaskAsked = signal(0);

  select(id: number): void {
    this.selectedId.set(id);
  }

  askForNewTask(): void {
    this.newTaskAsked.update((count) => count + 1);
  }

  add(title: string): void {
    const task: Task = { id: this.nextId++, title, done: false };
    this.list.update((list) => [...list, task]);
    this.selectedId.set(task.id);
    this.write(`Added: ${title}`);
  }

  toggleDone(): void {
    const task = this.selected();
    if (!task) return;
    this.list.update((list) => list.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    this.write(`${task.done ? 'Not done' : 'Done'}: ${task.title}`);
  }

  /** Can the selected task move up (-1) or down (+1)? */
  canMove(by: -1 | 1): boolean {
    const index = this.list().findIndex((task) => task.id === this.selectedId());
    return index >= 0 && index + by >= 0 && index + by < this.list().length;
  }

  move(by: -1 | 1): void {
    if (!this.canMove(by)) return;
    const list = [...this.list()];
    const index = list.findIndex((task) => task.id === this.selectedId());
    [list[index], list[index + by]] = [list[index + by], list[index]];
    this.list.set(list);
    this.write(`Moved ${by < 0 ? 'up' : 'down'}: ${list[index + by].title}`);
  }

  remove(): void {
    const task = this.selected();
    if (!task) return;
    const index = this.list().indexOf(task);
    const list = this.list().filter((t) => t.id !== task.id);
    this.list.set(list);
    // The next task (or the one before the last) is selected, so Del can go on deleting.
    this.selectedId.set(list[Math.min(index, list.length - 1)]?.id ?? null);
    this.write(`Deleted: ${task.title}`);
  }

  clearLog(): void {
    this.log.set([]);
  }

  private write(line: string): void {
    this.log.update((log) => [line, ...log]);
  }
}
