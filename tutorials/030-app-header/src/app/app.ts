import { Component, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
} from '@gridify/studio';
import { Counter } from './counter';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdMenuBar, GrdDockingEngine],
  template: `
    <!-- the name on the left; the button and the select of the themes on the right -->
    <grd-app-header productName="App Header" preferences="theme">
      <!-- grdAppHeaderEnd: the place at the right, before the select -->
      <grd-button grdAppHeaderEnd label="Press me" (pressed)="pressed()" />
    </grd-app-header>
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
  private readonly messageBox = inject(GrdMessageBox);
  private opened = 0;

  protected pressed(): void {
    this.messageBox.info('Button pressed');
  }

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
