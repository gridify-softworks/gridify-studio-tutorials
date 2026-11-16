import { Component, effect, signal } from '@angular/core';
import { GrdButton, type GrdWidgetDef, GrdWidgetGrid, type GrdWidgetLayout } from '@gridify/studio';
import { CustomersWidget, OrdersWidget, RevenueWidget, ServicesWidget } from './widgets';

/** What can be put on the board. The id names a widget in the saved layout: a word, not a number. */
const WIDGETS: GrdWidgetDef[] = [
  { id: 'orders', title: 'Orders today', component: OrdersWidget, defaultSize: { w: 1, h: 1 } },
  {
    id: 'revenue',
    title: 'Revenue of the month',
    component: RevenueWidget,
    defaultSize: { w: 2, h: 1 },
  },
  { id: 'services', title: 'Services', component: ServicesWidget, minSize: { w: 1, h: 1 } },
  {
    id: 'customers',
    title: 'Best customers',
    component: CustomersWidget,
    defaultSize: { w: 2, h: 1 },
  },
];

/** Where the widgets stand at the start: x and y in cells from the top left, w and h in cells. */
const START: GrdWidgetLayout = [
  { id: 'orders', x: 0, y: 0, w: 1, h: 1 },
  { id: 'revenue', x: 1, y: 0, w: 2, h: 1 },
  { id: 'services', x: 0, y: 1, w: 1, h: 1 },
];

/** The key in localStorage under which the board is kept. */
const KEY = 'tutorial-173-board';

/** The board as it was saved, or the one of the start. */
function savedLayout(): GrdWidgetLayout {
  try {
    const text = localStorage.getItem(KEY);
    return text ? (JSON.parse(text) as GrdWidgetLayout) : START;
  } catch {
    return START;
  }
}

/** The document: the board of widgets. */
@Component({
  selector: 'app-dashboard-page',
  imports: [GrdButton, GrdWidgetGrid],
  template: `
    <div class="bar">
      <grd-button
        [label]="editing() ? 'Done' : 'Edit the board'"
        [variant]="editing() ? 'primary' : 'default'"
        (pressed)="editing.set(!editing())"
      />
      <grd-button label="Start again" (pressed)="layout.set(start)" />
    </div>
    <!-- [(layout)] and [(editing)] are two-way: the board gives a new layout after every change. -->
    <grd-widget-grid [widgets]="widgets" [(layout)]="layout" [(editing)]="editing" />
  `,
  styles: `
    :host {
      display: block;
      padding: 12px;
    }
    .bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
  `,
})
export class DashboardPage {
  protected readonly widgets = WIDGETS;
  protected readonly start = START;
  protected readonly layout = signal<GrdWidgetLayout>(savedLayout());
  protected readonly editing = signal(false);

  constructor() {
    // The layout is plain data: it is kept whenever it changes, and comes back after F5.
    effect(() => {
      const text = JSON.stringify(this.layout());
      try {
        localStorage.setItem(KEY, text);
      } catch {
        // The storage is off or full: the board works, it only starts again after F5.
      }
    });
  }
}
