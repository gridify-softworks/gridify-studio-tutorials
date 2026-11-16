import { Component, inject } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdContentRegistry,
  type GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  grdUserName,
} from '@gridify/studio';
import { OrdersPage } from './orders-page';
import { server } from './pretend-server';
import { RequestsTool } from './requests-tool';
import { ServerPage } from './server-page';

/** The page of the user (a document) on the left, the requests to the server (a tool) on the right. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      tag: 'documents',
      type: 'panel',
      role: 'document',
      size: 60,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'orders', role: 'document', title: 'Orders', componentKey: 'orders' }],
    },
    {
      tag: 'right',
      type: 'panel',
      role: 'tool',
      size: 40,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'requests', role: 'tool', title: 'Requests', componentKey: 'requests' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdDockingEngine, ServerPage],
  template: `
    <grd-app-header productName="Orders" subtitle="Tutorial 195" preferences="theme density">
      <div grdAppHeaderEnd class="who">
        @if (auth.user(); as user) {
          <span>{{ nameOf(user) }}</span>
          <grd-button label="Sign out" (pressed)="auth.signOut()" />
        } @else {
          <!-- begin() starts the sign-in of the provider: here it sends the browser to the server. -->
          <grd-button label="Sign in" variant="primary" (pressed)="auth.begin('session')" />
        }
      </div>
    </grd-app-header>
    <grd-docking-engine layoutStorageKey="tutorial-195-layout" [defaultLayout]="layout" />

    <!-- Only for this tutorial: the sign-in page of the pretend server, over the application. -->
    @if (serverPage()) {
      <app-server-page />
    }
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
    .who {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);

  protected readonly layout = LAYOUT;
  protected readonly nameOf = grdUserName;
  protected readonly serverPage = server.page;

  constructor() {
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('orders', OrdersPage);
    registry.registerComponent('requests', RequestsTool);
  }
}
