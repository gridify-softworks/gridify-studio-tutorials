import { Component, inject } from '@angular/core';
import { GrdContextMenu, type GrdMenuItem } from '@gridify/studio';
import { Tasks } from './tasks';

/** A tool: what the commands did, the newest first. */
@Component({
  selector: 'app-log-tool',
  imports: [GrdContextMenu],
  template: `
    <!-- Another element with a context menu of its own. -->
    <div class="log" [grdContextMenu]="menu">
      @for (line of tasks.log(); track $index) {
        <div>{{ line }}</div>
      } @empty {
        <div class="hint">Nothing yet. Right-click here to clear the log.</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .log {
      box-sizing: border-box;
      min-height: 100%;
      padding: 8px 12px;
      font-family: var(--grd-font-mono, monospace);
    }
    .hint {
      opacity: 0.88;
    }
  `,
})
export class LogTool {
  protected readonly tasks = inject(Tasks);
  protected readonly menu: GrdMenuItem[] = [
    { label: 'Clear the log', run: () => this.tasks.clearLog() },
  ];
}
