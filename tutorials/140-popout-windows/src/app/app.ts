import { Component, computed, inject, Signal, signal, viewChild } from '@angular/core';
import {
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineEvents,
  GrdEngineSettings,
  GrdEventMap,
  GrdMenu,
  GrdMenuBar,
  GrdRibbonActionEvent,
  GrdStatusBar,
  GrdStatusItem,
  GrdToolbar,
  GrdToolbarItem,
  GrdWindowBar,
  GrdWindowRef,
} from '@gridify/studio';
import { Counter } from './counter';
import { KeyCounter } from './key-counter';
import { WindowLog, WindowLogTool } from './window-log';

/** Two documents on the left, the log of the windows on the right. The tags of the documents start with `doc`. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 65,
      activeTab: 0,
      collapsed: false,
      tabs: [
        { tag: 'doc-counter', role: 'document', title: 'Counter', componentKey: 'counter' },
        { tag: 'doc-keys', role: 'document', title: 'Keys', componentKey: 'keys' },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'log', role: 'tool', title: 'Window log', componentKey: 'log' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdWindowBar, GrdMenuBar, GrdToolbar, GrdStatusBar, GrdDockingEngine],
  template: `
    <!-- every window: the main one and each popout window -->
    <grd-menu-bar *grdWindowBar [menus]="menus()" [showForTags]="['*']" />
    <!-- only in a popout window that has a document -->
    <grd-toolbar
      *grdWindowBar="let win"
      [items]="toolbarItems"
      ariaLabel="Window"
      [showForTags]="['grd:popout&doc*']"
      (action)="onToolbar($event, win)"
    />
    <grd-docking-engine
      popouts
      viewSources
      layoutStorageKey="tutorial-140-layout"
      [defaultLayout]="layout"
      (tabMovedToWindow)="moved($event)"
      (popoutOpened)="opened($event)"
      (popoutClosed)="closed($event)"
      (popoutRefused)="refused($event)"
    />
    <!-- every window, with a text of its own -->
    <grd-status-bar *grdWindowBar="let win" [items]="statusOf(win)()" [showForTags]="['*']" />
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
  private readonly engine = viewChild(GrdDockingEngine);
  private readonly log = inject(WindowLog);
  /** The active document of the application, in whichever window it is. */
  private readonly activeDocument = inject(GrdEngineEvents).activeDocumentTab();
  /** Goes up with every event of the windows: what the status bar asks the API is asked again. */
  private readonly changes = signal(0);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change: the popout windows are saved with it.
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('counter', Counter);
    registry.registerComponent('keys', KeyCounter);
    registry.registerComponent('log', WindowLogTool);
  }

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        { label: 'Add a &counter', run: () => this.add('counter', 'Counter') },
        { label: 'Add a &key counter', run: () => this.add('keys', 'Keys') },
        { separator: true },
        { label: '&Reset layout', run: () => this.engine()?.resetLayout() },
      ],
    },
    {
      id: 'window',
      label: '&Window',
      items: [
        {
          label: '&Open the document in a new window',
          enabled: this.activeDocument() !== null,
          run: () => this.popout(),
        },
        { separator: true },
        // The block of the engine: the main window, the popout windows, and Return all windows.
        { source: 'grd:windows' },
      ],
    },
  ]);

  /** The buttons of the toolbar: it is shown only in a popout window with a document. */
  protected readonly toolbarItems: GrdToolbarItem[] = [
    { type: 'button', action: 'back', label: 'Back to the main window' },
    { type: 'button', action: 'all', label: 'Return all windows' },
  ];

  /** A new document: its tag starts with `doc`, like the tags of the layout. */
  private add(componentKey: string, title: string): void {
    this.engine()?.openComponentTab({
      tag: `doc-${componentKey}`,
      role: 'document',
      title,
      componentKey,
    });
  }

  /** In the handler of the click: a browser opens a window only in a gesture of the user. */
  private popout(): void {
    const active = this.activeDocument();
    if (active) this.engine()?.api.popout(active.tabId);
  }

  /** A press in the toolbar of a popout window: `win` is the window of the copy of the toolbar. */
  protected onToolbar(event: GrdRibbonActionEvent, win: GrdWindowRef): void {
    const api = this.engine()?.api;
    if (event.item.action === 'back') api?.closeWindow(win.id);
    if (event.item.action === 'all') api?.returnAll();
  }

  protected moved(event: GrdEventMap['tabMovedToWindow']): void {
    this.log.add('tabMovedToWindow', `${event.title}: ${event.from} → ${event.to}`);
    this.changes.update((n) => n + 1);
  }

  protected opened(event: GrdEventMap['popoutOpened']): void {
    this.log.add('popoutOpened', `${event.popoutId} (${event.way}), tabs: ${event.tabIds.length}`);
    this.changes.update((n) => n + 1);
  }

  protected closed(event: GrdEventMap['popoutClosed']): void {
    this.log.add('popoutClosed', `${event.popoutId} (${event.reason})`);
    // The id of a closed window never comes back: its status would only keep the window in memory.
    this.statuses.delete(event.popoutId);
    this.changes.update((n) => n + 1);
  }

  protected refused(event: GrdEventMap['popoutRefused']): void {
    this.log.add('popoutRefused', `the browser blocked the window (${event.way})`);
  }

  /** The name of a window for people, as the Window menu numbers them. */
  private nameOf(windowId: string | null): string {
    const windows = this.engine()?.api.windows() ?? ['main'];
    if (windowId === 'main') return 'the main window';
    return `Window ${windows.indexOf(windowId ?? '') + 1}`;
  }

  /** The items of the status bar of every window: one signal for each window. */
  private readonly statuses = new Map<string, Signal<GrdStatusItem[]>>();

  protected statusOf(win: GrdWindowRef): Signal<GrdStatusItem[]> {
    let status = this.statuses.get(win.id);
    if (!status) {
      status = computed(() => {
        this.changes();
        const engine = this.engine();
        const api = engine?.ready() ? engine.api : undefined;
        const active = this.activeDocument();
        const where = active && api ? this.nameOf(api.windowOf(active.tabId)) : '';
        return [
          { id: 'window', text: win.kind === 'main' ? 'Main window' : this.nameOf(win.id) },
          { id: 'windows', text: `Windows: ${(api?.windows() ?? ['main']).join(', ')}` },
          {
            id: 'document',
            text: active ? `${active.title} is in ${where}` : 'No document',
            align: 'end',
          },
        ];
      });
      this.statuses.set(win.id, status);
    }
    return status;
  }
}
