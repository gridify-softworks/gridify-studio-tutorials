import { Component } from '@angular/core';
import { GrdClock } from '@gridify/studio';

/** The tool: a clock that ticks. */
@Component({
  selector: 'app-clock-tool',
  imports: [GrdClock],
  template: `<grd-clock displayOnly seconds />`,
  styles: `
    :host {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 16px;
    }
  `,
})
export class ClockTool {}
