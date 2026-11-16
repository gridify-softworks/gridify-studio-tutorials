import { Component, inject } from '@angular/core';
import { GrdConsole, GrdTabContext } from '@gridify/studio';
import { readSetting, writeSetting } from './settings';
import { type ConsoleLine, Workspace } from './workspace';

/** A tool: the console, with a bar, a command line, and the problems as links into the editor. */
@Component({
  selector: 'app-console-tool',
  imports: [GrdConsole],
  template: `
    <grd-console
      [lines]="workspace.lines()"
      [tools]="['filter', 'count', 'copy', 'clear']"
      showTime
      prompt
      placeholder="Type a command: help, check, get city, set seats 30, clear"
      (submitted)="run($event)"
      (cleared)="workspace.lines.set([])"
      (lineActivated)="show($event)"
    />
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
  `,
})
export class ConsoleTool {
  protected readonly workspace = inject(Workspace);
  private readonly engine = inject(GrdTabContext).engine;

  /** Enter in the command line: the command is written to the log, then done. */
  protected run(command: string): void {
    const { workspace } = this;
    workspace.write(command, 'input');
    const [name, key, ...rest] = command.trim().split(/\s+/);

    switch (name.toLowerCase()) {
      case 'help':
        workspace.write('check: the problems of the settings', 'output');
        workspace.write('get <key>: the value of a setting, for example get city', 'output');
        workspace.write('set <key> <value>: changes a setting, for example set seats 30', 'output');
        workspace.write('clear: empties the console', 'output');
        break;
      case 'check':
        this.check();
        break;
      case 'get': {
        const value = key ? readSetting(workspace.text(), key) : undefined;
        if (value === undefined) workspace.write(`There is no setting "${key ?? ''}".`, 'error');
        else workspace.write(value, 'output');
        break;
      }
      case 'set': {
        const changed = key ? writeSetting(workspace.text(), key, rest.join(' ')) : null;
        if (changed === null) {
          workspace.write(`There is no setting "${key ?? ''}".`, 'error');
        } else {
          // The text of the workspace changes, and the editor shows the new text.
          workspace.text.set(changed);
          workspace.write(`${key}: ${rest.join(' ')}`, 'success');
        }
        break;
      }
      case 'clear':
        workspace.lines.set([]);
        break;
      default:
        workspace.write(`"${name}" is not a command. Type help.`, 'error');
    }
  }

  /** Writes the problems of the settings: each is a link to its place. */
  private check(): void {
    const problems = this.workspace.problems();
    if (problems.length === 0) {
      this.workspace.write('No problems.', 'success');
      return;
    }
    for (const problem of problems) {
      const text = `Line ${problem.line}, column ${problem.column}: ${problem.message}`;
      this.workspace.write(text, problem.severity, { line: problem.line, column: problem.column });
    }
  }

  /** A double click (or Enter) on a problem: the editor shows its place. */
  protected show(line: ConsoleLine): void {
    if (!line.at) return;
    // The editor is a tab of the engine: show it (or open it again, when it was closed).
    const [tab] = this.engine.api.getByTag('settings');
    if (tab) {
      this.engine.api.activateTab(tab.id);
    } else {
      this.engine.openComponentTab({
        tag: 'settings',
        title: 'settings.yaml',
        componentKey: 'settings',
      });
    }
    // A new object: a signal tells only a change, and the same place may be asked for twice.
    this.workspace.goTo.set({ ...line.at });
  }
}
