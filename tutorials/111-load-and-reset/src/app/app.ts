import { AfterViewInit, Component, computed, inject, signal, viewChild } from '@angular/core';
import {
  GrdButton,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  GrdStatusBar,
  type GrdStatusItem,
} from '@gridify/studio';
import { Counter } from './counter';

/** The default layout: a shell on the left (the frame of the application, never saved) and the dockable core for the tabs. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'tool',
      size: '260px',
      resizable: true,
      shell: true,
      shellHeader: 'text',
      activeTab: 0,
      collapsed: false,
      tabs: [
        {
          role: 'tool',
          title: 'Shell',
          content:
            '<p>This panel is the <b>shell</b>: the frame that the application defines. ' +
            'Drag its edge: the new width is not saved, it comes from the default layout again ' +
            'after Load, Reset and F5.</p>',
        },
      ],
    },
    { type: 'panel', role: 'document', size: 100, activeTab: 0, collapsed: false, tabs: [] },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdButton, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-menu-bar [menus]="menus()" shortcuts>
      <grd-button grdMenuBarEnd label="Save" variant="primary" (pressed)="save()" />
      <grd-button grdMenuBarEnd label="Load" [disabled]="!canLoad()" (pressed)="load()" />
      <grd-button grdMenuBarEnd label="Reset" (pressed)="reset()" />
    </grd-menu-bar>
    <grd-docking-engine
      layoutStorageKey="tutorial-111-layout"
      [defaultLayout]="layout"
      (layoutSaved)="saved()"
      (layoutLoaded)="tell('The saved layout is loaded')"
      (layoutReset)="tell('The default layout is shown (Save keeps it)')"
    />
    <grd-status-bar [items]="status()" />
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
export class App implements AfterViewInit {
  private readonly engine = viewChild.required(GrdDockingEngine);
  protected readonly layout = LAYOUT;
  /** What happened last, for the status bar. */
  protected readonly status = signal<GrdStatusItem[]>([]);
  /** Is there a saved layout to load? Load is disabled while there is none. */
  protected readonly canLoad = signal(false);

  constructor() {
    // A saved tab names its component by a key: the key must be known before the layout comes back.
    inject(GrdContentRegistry).registerComponent('counter', Counter);
  }

  /** The engine has started (its `ngAfterViewInit` runs before this one): is a layout of an earlier visit saved? */
  ngAfterViewInit(): void {
    this.canLoad.set(this.engine().hasSavedLayout());
  }

  protected save(): void {
    this.engine().saveLayout();
  }

  /** A save made a saved layout: from now on there is something to load. */
  protected saved(): void {
    this.canLoad.set(true);
    this.tell('Saved');
  }

  /** Puts the saved layout in place of the one on the screen, as F5 does, but without reloading the page. */
  protected load(): void {
    if (!this.engine().loadLayout()) this.tell('Nothing is saved yet: there is nothing to load');
  }

  /** Goes back to the default layout (`defaultLayout`). It is not saved by itself: Save keeps it, Load brings the saved one back. */
  protected reset(): void {
    this.engine().resetLayout();
  }

  /** Shows what happened, with the time. */
  protected tell(text: string): void {
    const at = new Date().toLocaleTimeString();
    this.status.set([{ id: 'said', text: `${text} (${at})`, shrink: true, live: true }]);
  }

  /** A computed: Load saved layout is enabled only while there is something to load. */
  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add &component',
          run: () => this.engine().openComponentTab({ title: 'Counter', componentKey: 'counter' }),
        },
        {
          label: 'Add &HTML',
          run: () =>
            this.engine().openHtmlTab({
              title: 'Notes',
              content: '<p>Plain <b>HTML</b> in a tab.</p>',
            }),
        },
        { separator: true },
        { label: '&Save layout', shortcut: 'Mod+S', run: () => this.save() },
        { label: '&Load saved layout', enabled: this.canLoad(), run: () => this.load() },
        { label: '&Reset layout', run: () => this.reset() },
      ],
    },
  ]);
}
