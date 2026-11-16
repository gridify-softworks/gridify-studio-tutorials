import type { GrdMenuItem } from '@gridify/studio';
import { Tasks } from './tasks';

/**
 * The commands of the tasks, written once as menu items. The menu bar, the context menu of a
 * task and the keys all use these items, so a command looks and works the same everywhere.
 *
 * `shortcut` is the key of the command. A menu shows it next to the label; the menu bar with
 * `[shortcuts]="true"` also makes it work (see app.ts). The items are made again whenever they
 * are needed, so `enabled` and `checked` always say how things are now.
 */
export function taskCommands(tasks: Tasks): GrdMenuItem[] {
  const task = tasks.selected();
  return [
    { label: '&New task', shortcut: 'Alt+N', run: () => tasks.askForNewTask() },
    { separator: true },
    {
      label: '&Done',
      shortcut: 'Mod+Enter',
      checked: task?.done ?? false,
      enabled: task !== null,
      run: () => tasks.toggleDone(),
    },
    {
      label: 'Move &up',
      shortcut: 'Alt+Up',
      enabled: tasks.canMove(-1),
      run: () => tasks.move(-1),
    },
    {
      label: 'Move do&wn',
      shortcut: 'Alt+Down',
      enabled: tasks.canMove(1),
      run: () => tasks.move(1),
    },
    { separator: true },
    { label: 'De&lete', shortcut: 'Del', enabled: task !== null, run: () => tasks.remove() },
  ];
}
