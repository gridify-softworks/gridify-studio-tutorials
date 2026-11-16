import { Component, computed, inject } from '@angular/core';
import {
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  grdDisplayAccelerator,
  GrdEngineSettings,
  type GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdShortcuts,
} from '@gridify/studio';
import { taskCommands } from './commands';
import { LogTool } from './log-tool';
import { TaskList } from './task-list';
import { Tasks } from './tasks';

/** The list of the tasks (a document) on the left, the log (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 65,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'tasks', role: 'document', title: 'Tasks', componentKey: 'tasks' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- [shortcuts]="true": the menu bar makes the keys of its items work, everywhere in the page. -->
    <grd-menu-bar [menus]="menus()" [shortcuts]="true" />
    <grd-docking-engine layoutStorageKey="tutorial-101-layout" [defaultLayout]="layout" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  private readonly tasks = inject(Tasks);
  private readonly messages = inject(GrdMessageBox);

  protected readonly layout = LAYOUT;

  /** The menu bar has the commands of the tasks. A computed: enabled and checked follow the selection. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    { id: 'task', label: '&Task', items: taskCommands(this.tasks) },
  ]);

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('tasks', TaskList);
    registry.registerComponent('log', LogTool);

    // A key that is in no menu: F1 shows the keys. GrdShortcuts is the one place where all the
    // keys of the application are registered (the menu bar puts the keys of its items there too),
    // so two commands cannot take the same key without a warning. register() gives back a
    // function that takes the key away; the root component lives as long as the page, so it
    // never needs to.
    inject(GrdShortcuts).register({
      shortcut: 'F1',
      owner: 'app: keys',
      run: () => this.showKeys(),
    });
  }

  /** F1: the keys of the commands, written as this computer has them (Ctrl+Enter, or ⌘↩ on a Mac). */
  private showKeys(): void {
    const lines = taskCommands(this.tasks)
      .filter((item) => item.shortcut)
      .map((item) => `${grdDisplayAccelerator(item.shortcut!)}   ${item.label!.replace('&', '')}`);
    this.messages.info([...lines, 'F1   These keys'].join('\n'), { title: 'Keyboard shortcuts' });
  }
}
