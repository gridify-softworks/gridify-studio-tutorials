# 181 – A code editor and a console

This tutorial shows the tools of an IDE in a docking application: a file in a code editor (`grd-code-editor`) with its problems marked, a console under it (`grd-console`) with a command line, and a block of code to read (`grd-code-block`) in a tool. You will learn how to:

- edit a text in the colors of its language (`language="yaml"`, `[(value)]`);
- mark the lines that have a problem, behind the text and in the gutter (`marks`, `grdCodeGutterEnd`), and show where the caret is (`cursor()`);
- write lines to a console, with their kinds and times, under a bar that filters, counts, copies and clears them (`lines`, `tools`, `showTime`);
- take commands from the command line of the console (`prompt`, `submitted`);
- make a line of the console a link to its place in the editor (`actionable`, `lineActivated`, `reveal()`);
- show code to read, with a Copy button (`grd-code-block`).

```
npm run tutorial 181
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30181 and type `check` into the console.

## The words first

- **The language** of a text gives the editor its colors: a key, a text, a number, a comment. The colors come from the highlighter of the library (`GrdCodeHighlighter`), the same for the editor and for the block of code.
- **A mark** is a band behind a line of the editor (`background`), or a dotted line under it (`underline`). **The gutter** is the column of the line numbers; a template can draw something into it for every line.
- **The caret** is where the typing goes: a line and a column, both from 1.
- **A line of the console** has an `id`, a `text`, a `kind` (`info`, `success`, `warning`, `error`, `muted`, `input` for what the user typed, `output` for the answer) and a `time`. As with the chat, the console draws the lines it is given, and the application adds them.

## Step by step

### Step 1: the file and its check

`src/app/settings.ts` has the text of the file and the check of the settings, in plain TypeScript:

```ts
/** The file when the tutorial starts: the settings of a shop in YAML, with two mistakes and a warning. */
export const START_TEXT = `# The settings of the shop
name: Corner Coffee
city: Prague
opens: 8:00
closes: 18:0
seats: twenty
wifi: yes
parking: no
`;

/** Settings that are in order: the tool Example shows them. */
export const EXAMPLE_TEXT = `# The settings of the shop
name: Corner Coffee
city: Prague
opens: 8:00
closes: 18:00
seats: 24
wifi: yes
`;

/** A problem of the settings: where it is (both from 1), and what is wrong. */
export interface Problem {
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

const TIME = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** What the value of each setting must look like. */
const RULES: Record<string, { pattern: RegExp; hint: string }> = {
  name: { pattern: /./, hint: 'a text' },
  city: { pattern: /./, hint: 'a text' },
  opens: { pattern: TIME, hint: 'a time, such as 8:00' },
  closes: { pattern: TIME, hint: 'a time, such as 18:00' },
  seats: { pattern: /^\d+$/, hint: 'a whole number' },
  wifi: { pattern: /^(yes|no)$/, hint: 'yes or no' },
};

/** A line `key: value`: the key, and the value (the rest of the line). */
const SETTING = /^(\w+):\s*(.*)$/;

/** Checks the text line by line: a line is a setting (`key: value`), a comment (`#`) or empty. */
export function checkSettings(text: string): Problem[] {
  const problems: Problem[] = [];
  text.split('\n').forEach((content, index) => {
    const line = index + 1;
    if (content.trim() === '' || content.trim().startsWith('#')) return;

    const match = SETTING.exec(content);
    if (!match) {
      const message = 'Write a setting as "key: value".';
      problems.push({ line, column: 1, severity: 'error', message });
      return;
    }
    const [, key, value] = match;
    // Only a key of RULES itself: every object also has inherited members, such as `constructor`.
    const rule = Object.hasOwn(RULES, key) ? RULES[key] : undefined;
    if (!rule) {
      const message = `"${key}" is not a setting of the shop.`;
      problems.push({ line, column: 1, severity: 'warning', message });
    } else if (!rule.pattern.test(value.trim())) {
      // The value is the end of the line: it starts at this column.
      const column = content.length - value.length + 1;
      problems.push({ line, column, severity: 'error', message: `"${key}" must be ${rule.hint}.` });
    }
  });
  return problems;
}

/** The value of a setting, or undefined when the text does not have it. */
export function readSetting(text: string, key: string): string | undefined {
  for (const content of text.split('\n')) {
    const match = SETTING.exec(content);
    if (match && match[1] === key) return match[2].trim();
  }
  return undefined;
}

/** The text with a new value of a setting, or null when the text does not have the setting. */
export function writeSetting(text: string, key: string, value: string): string | null {
  const lines = text.split('\n');
  const index = lines.findIndex((content) => SETTING.exec(content)?.[1] === key);
  if (index < 0) return null;
  lines[index] = `${key}: ${value}`;
  return lines.join('\n');
}
```

The check goes line by line, so every problem knows its line and its column. A real application asks a parser, or its server.

### Step 2: what the parts share

`src/app/workspace.ts` is a service with the text, its problems and the lines of the console. The editor, the console and the example are three tabs, and all three have the same `Workspace`:

```ts
import { computed, Injectable, signal } from '@angular/core';
import type { GrdCodeCursor, GrdConsoleKind, GrdConsoleLine } from '@gridify/studio';
import { checkSettings, START_TEXT } from './settings';

/** A line of the console, with a field of our own: the place in the file that the line speaks of. */
export interface ConsoleLine extends GrdConsoleLine {
  at?: GrdCodeCursor;
}

/** What the editor, the console and the example share: the text of the file and the lines of the console. */
@Injectable({ providedIn: 'root' })
export class Workspace {
  /** The text of settings.yaml. The editor shows it and changes it; the console reads it and changes it too. */
  readonly text = signal(START_TEXT);

  /** The problems of the text, found again whenever it changes. */
  readonly problems = computed(() => checkSettings(this.text()));

  /** The lines of the console, oldest first. */
  readonly lines = signal<ConsoleLine[]>([
    { id: 0, text: 'settings.yaml is open. Type help and press Enter.', kind: 'muted' },
  ]);

  /** The place that the editor is asked to show: the console sets it, the editor goes there. */
  readonly goTo = signal<GrdCodeCursor | null>(null);

  private nextId = 1;

  /** Writes a line to the console. A line with a place (`at`) is a link: a double click shows the place. */
  write(text: string, kind: GrdConsoleKind = 'info', at?: GrdCodeCursor): void {
    const line: ConsoleLine = { id: this.nextId++, text, kind, time: new Date() };
    if (at) {
      line.at = at;
      line.actionable = true;
      line.title = 'Double-click to show it in the editor';
    }
    this.lines.update((lines) => [...lines, line]);
  }
}
```

- **`problems`** is a `computed`: the check runs again whenever the text changes, and everything that shows the problems follows.
- **`ConsoleLine`** adds a field of our own to a line of the console: `at`, its place in the file. A line with a place is `actionable`: a link.
- **`goTo`** is how the console asks the editor to show a place.

### Step 3: the editor

`src/app/settings-page.ts` is the document:

```ts
import { afterRenderEffect, Component, computed, inject, viewChild } from '@angular/core';
import { GrdCodeEditor, GrdCodeGutterEndTemplate, type GrdCodeMark } from '@gridify/studio';
import type { Problem } from './settings';
import { Workspace } from './workspace';

/** The colors of the problems: the status colors of the theme. */
const COLORS = { error: 'var(--grd-danger-text)', warning: 'var(--grd-warning-text)' };

/** A document: settings.yaml in a code editor, with its problems marked, and a status line under it. */
@Component({
  selector: 'app-settings-page',
  imports: [GrdCodeEditor, GrdCodeGutterEndTemplate],
  template: `
    <!-- [(value)]: the editor shows the text of the workspace, and writes into it what the user types. -->
    <grd-code-editor
      ariaLabel="settings.yaml"
      language="yaml"
      [(value)]="workspace.text"
      [marks]="marks()"
      [focusFrame]="false"
    >
      <!-- After the number of a line: a dot when the line has a problem, with the problem as its tooltip. -->
      <ng-template grdCodeGutterEnd let-line>
        @if (problemAt(line); as problem) {
          <span class="dot" [class]="problem.severity" [title]="problem.message">●</span>
        }
      </ng-template>
    </grd-code-editor>

    <div class="status">
      <span>Line {{ editor().cursor().line }}, column {{ editor().cursor().column }}</span>
      <span>YAML</span>
      <span>{{ problemCount() }}</span>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-code-editor {
      flex: 1;
      min-height: 0;
    }
    .dot {
      font-size: 10px;
    }
    .error {
      color: var(--grd-danger-text);
    }
    .warning {
      color: var(--grd-warning-text);
    }
    .status {
      display: flex;
      gap: 24px;
      padding: 4px 12px;
      border-top: 1px solid var(--grd-border-color);
      font-size: 12px;
    }
  `,
})
export class SettingsPage {
  protected readonly workspace = inject(Workspace);
  protected readonly editor = viewChild.required(GrdCodeEditor);

  /** A dotted line under every line that has a problem, in the color of the problem. */
  protected readonly marks = computed<GrdCodeMark[]>(() =>
    this.workspace.problems().map((problem) => ({
      line: problem.line,
      underline: COLORS[problem.severity],
    })),
  );

  protected readonly problemCount = computed(() => {
    const count = this.workspace.problems().length;
    return count === 0 ? 'No problems' : count === 1 ? '1 problem' : `${count} problems`;
  });

  constructor() {
    // The console asks for a place (a double click on a problem): the editor goes there and takes the focus.
    // afterRenderEffect runs after Angular has updated the page (the editor has its text by then),
    // and again whenever goTo changes: the right moment for the caret, the focus and scrolling.
    afterRenderEffect(() => {
      const place = this.workspace.goTo();
      if (!place) return;
      this.editor().reveal(place.line, place.column, true);
      // Done. Otherwise the tab would go there again when it is closed and opened later.
      this.workspace.goTo.set(null);
    });
  }

  /** The problem of a line, or undefined. */
  protected problemAt(line: number): Problem | undefined {
    return this.workspace.problems().find((problem) => problem.line === line);
  }
}
```

- **`[(value)]="workspace.text"`**: the editor shows the text of the service, and writes into it what the user types. When the console changes the text (`set seats 30`), the editor shows the new one.
- **`language="yaml"`** colors the text; `auto` would find the language in the text.
- **`[marks]`**: a dotted line in the color of the problem under every line that has one.
- **`grdCodeGutterEnd`** draws after the number of every line: here a dot with the problem as its tooltip. `grdCodeGutterStart` would draw before the number (a breakpoint, say).
- **`editor().cursor()`** is a signal with the line and the column of the caret, for the status line.
- **`[focusFrame]="false"`**: no frame inside the edges of an editor that fills its tab.
- **`reveal(line, column, true)`** moves the caret to a place, scrolls to it and takes the focus. **`afterRenderEffect`** calls it when `goTo` changes, after Angular has updated the page: when the tab was opened just now, the editor has its text by then. Then it empties `goTo`: a place is shown once, and not again when the tab is closed and opened later. The methods of the editor are commands, so the effect follows `goTo` only, and not the text or the caret.

### Step 4: the console

`src/app/console-tool.ts` is a tool:

```ts
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
```

- **`[lines]`** are the lines of the service, oldest first. A new line is a new list (`write` in step 2), and the console scrolls to it while the user is at the end.
- **`[tools]`**: a field that filters the lines, their count, Copy and Clear. Clear only says that it was pressed (**`(cleared)`**): the application empties its list.
- **`showTime`** shows the time of each line.
- **`prompt`** shows the command line, and **`(submitted)`** gives the command when Enter is pressed. Up and Down go through the commands that were typed.
- **`run`** writes the command as an `input` line, and the answer as `output`, `success` or `error` lines.
- **`(lineActivated)`**: a double click (or Enter) on a link. The console shows the tab of the editor, or opens it again when it was closed, and sets `goTo`.

### Step 5: code to read

`src/app/example-tool.ts` shows settings that are in order:

<!-- prettier-ignore -->
```html
<p>Settings that are in order:</p>
<grd-code-block language="yaml" heading="settings.yaml" lineNumbers [code]="example" />
<grd-button label="Use these settings" (pressed)="use()" />
```

`grd-code-block` colors with the same highlighter as the editor: `heading` is the title in its head, `lineNumbers` numbers the lines, and the head has a Copy button. **Use these settings** puts the example into the text of the service, and the editor shows it.

### Step 6: the layout

`src/app/app.ts` puts the editor among the documents, the example on the right and the console under both, where an IDE has them, and registers them by their keys, as 015 does.

### Step 7: run it

```
npm run tutorial 181
```

## Try it

1. **The problems.** The lines 5, 6 and 8 have a dotted line, and a dot in the gutter: point at a dot to read its problem. The status line says _3 problems_.
2. **Check.** Type `check` into the console and press Enter: the three problems, in red and orange, with their times.
3. **Go to a problem.** Double-click _Line 6, column 8_: the caret is in the editor, in front of `twenty`. Type `24` instead of it: the dotted line goes, and the status line says _2 problems_. (In the editor Tab types spaces; Esc and then Tab leaves the editor.)
4. **Commands.** `help`, `get city` (_Prague_), `set closes 18:00` (the editor changes), `hello` (not a command). Press Up in the command line: the commands come back.
5. **The bar.** Type `parking` into _Filter lines…_: only the lines with that word are left, and the count says how many of all. **Copy** copies the lines that are shown, **Clear** empties the console.
6. **The engine.** Close the tab _settings.yaml_, and double-click a problem in the console: the tab opens again, at the problem. The text is the same: it lives in the service, not in the tab.
7. **The example.** Press **Copy** in the head of the example, or **Use these settings**: _No problems_.

## More

- **Other languages**: `language="sql"`, `"ts"`, `"json"`, …, or `"auto"`, which finds the language in the text (`(languageDetected)` tells which one). The colors of a language for the whole application: `provideGrdCodeHighlighter({ languageColors: { yaml: { attribute: '#7c3aed' } } })` in `app.config.ts`.
- **A context menu** of the editor: `[contextMenu]` with menu items, which can call `clipboard('cut')`, `clipboard('copy')` and `paste()` of the editor (see 101).
- **Breakpoints**: `grdCodeGutterStart` with a dot that the user clicks, and a mark with a `background` for the line that runs.
- **A console without a command line**: leave out `prompt`, and it is a log (the output of a build, the messages of a server).
- **Angular forms**: the editor is a form control too (`formControlName`, `ngModel`).

## Build it yourself

`npm run tutorial:eject 181 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `settings.ts`, `workspace.ts`, `settings-page.ts`, `console-tool.ts` and `example-tool.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
