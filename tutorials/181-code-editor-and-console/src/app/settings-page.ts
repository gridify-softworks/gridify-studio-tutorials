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
