import { Component, viewChild } from '@angular/core';
import { GrdDockingEngine, GrdMenu, GrdMenuBar } from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdMenuBar, GrdDockingEngine],
  template: `
    <grd-menu-bar [menus]="menus" />
    <!-- null: no layout is loaded or saved, a reload starts empty (saving comes in tutorial 015) -->
    <grd-docking-engine [layoutStorageKey]="null" />
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
  private readonly engine = viewChild.required(GrdDockingEngine);
  private opened = 0;

  protected readonly menus: GrdMenu[] = [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () =>
            this.engine().openComponentTab({
              title: `Counter ${++this.opened}`,
              componentType: Counter,
            }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: `Notes ${++this.opened}`,
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
      ],
    },
  ];
}
