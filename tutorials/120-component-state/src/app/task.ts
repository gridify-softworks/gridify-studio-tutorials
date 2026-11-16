import { Component, inject, signal } from '@angular/core';
import {
  GrdButton,
  GrdInput,
  GrdLabel,
  GrdOption,
  GrdPersistable,
  GrdPersistedState,
  GrdSelect,
  GrdTabContext,
} from '@gridify/studio';

type Priority = 'Low' | 'Normal' | 'High';

/** What a task saves with the layout: everything the user can change. */
interface TaskState {
  title: string;
  hours: number;
  priority: Priority;
}

/**
 * A task with a title, an estimate and a priority. It implements `GrdPersistable`: the engine asks it for its state on every save of
 * the layout (`persist`) and gives the state back after a reload (`restore`), so what the user typed is there again after F5.
 */
@Component({
  selector: 'app-task',
  imports: [GrdButton, GrdInput, GrdLabel, GrdSelect],
  template: `
    <grd-input label="Title" [value]="title()" (valueChange)="setTitle($event)" />
    <div class="field">
      <grd-label>Estimate</grd-label>
      <div class="row">
        <grd-button label="−" [disabled]="hours() === 0" (pressed)="addHours(-1)" />
        <output>{{ hours() }} h</output>
        <grd-button label="+" (pressed)="addHours(1)" />
      </div>
    </div>
    <grd-select
      label="Priority"
      [options]="priorities"
      [value]="priority()"
      (valueChange)="setPriority($event)"
    />
    <div class="row">
      <grd-button label="Save" variant="primary" [disabled]="!unsaved()" (pressed)="save()" />
      <span class="status">{{ unsaved() ? 'Unsaved changes' : 'Saved' }}</span>
    </div>
    <p class="note">
      {{ restored ? 'Restored from the saved layout.' : 'A new task: change it, then press F5.' }}
    </p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 360px;
      padding: 16px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    output {
      min-width: 3em;
      text-align: center;
    }
    .status,
    .note {
      opacity: 0.88;
    }
    .note {
      margin: 0;
    }
  `,
})
export class Task implements GrdPersistable<TaskState> {
  private readonly tab = inject(GrdTabContext);
  protected readonly priorities: GrdOption<Priority>[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
  ];

  protected readonly title = signal('');
  protected readonly hours = signal(1);
  protected readonly priority = signal<Priority>('Normal');
  protected readonly unsaved = signal(false);
  /** Did the state come from the saved layout? Only for the note at the bottom. */
  protected restored = false;

  /** The engine calls it on every save of the layout: the state goes into the saved layout with the tab. */
  persist(): GrdPersistedState<TaskState> {
    return {
      v: 1,
      data: {
        title: this.title(),
        hours: this.hours(),
        priority: this.priority(),
      },
    };
  }

  /** The engine calls it after a reload, before the first render: the saved state comes back. */
  restore(state: GrdPersistedState<TaskState>): void {
    const { title, hours, priority } = state.data;
    this.title.set(title);
    this.hours.set(hours);
    this.priority.set(priority);
    // The engine saved the mark of the tab with the state and has put it back: the task reads it.
    this.unsaved.set(this.tab.dirty);
    this.restored = true;
  }

  protected setTitle(title: string): void {
    this.title.set(title);
    this.changed();
  }

  protected addHours(step: number): void {
    this.hours.update((hours) => Math.max(0, hours + step));
    this.changed();
  }

  protected setPriority(priority: Priority | null): void {
    if (!priority) return;
    this.priority.set(priority);
    this.changed();
  }

  /** In an application this sends the task to the server; here it only marks the task as saved. */
  protected save(): void {
    this.unsaved.set(false);
    this.tab.setDirty(false);
    this.tab.requestSave();
  }

  /** After every change: mark the tab as changed, and ask the engine to save the layout (with the state of the task in it). */
  private changed(): void {
    this.unsaved.set(true);
    this.tab.setDirty(true);
    this.tab.requestSave();
  }
}
