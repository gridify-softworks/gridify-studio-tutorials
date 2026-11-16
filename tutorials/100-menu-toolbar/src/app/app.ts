import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdMenu,
  GrdMenuBar,
  grdMenuItemOf,
  GrdRibbonActionEvent,
  GrdStatusBar,
  GrdStatusItem,
  GrdToolbar,
  GrdToolbarItem,
  grdToolbarItemOf,
} from '@gridify/studio';
import { NoteCommands, noteTab, SAMPLES } from './commands';
import { Notes, ZOOMS } from './notes';
import { PopupTool } from './popup-tool';
import { PropertiesTool } from './properties-tool';

const WELCOME = `This is a note: a document of the docking engine.

Add another one with File › New document, with the first button of the toolbar, or with Alt+N.
Type into it, then save it with Ctrl+S (⌘S on a Mac) and watch the status bar.
The View menu turns the toolbar, the status bar and the wrapping of the lines on and off.
The panel at the bottom right opens a popup menu.`;

/** The documents in the middle (the dockable core of the roles mode); on the right the Properties, and the popup menu under them. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    {
      type: 'panel',
      role: 'document',
      size: 75,
      activeTab: 0,
      collapsed: false,
      tabs: [noteTab('Welcome', WELCOME)],
    },
    {
      type: 'column',
      size: 25,
      children: [
        {
          type: 'panel',
          role: 'tool',
          size: 60,
          activeTab: 0,
          collapsed: false,
          tabs: [
            { tag: 'properties', role: 'tool', title: 'Properties', componentType: PropertiesTool },
          ],
        },
        {
          type: 'panel',
          role: 'tool',
          size: 40,
          activeTab: 0,
          collapsed: false,
          tabs: [{ tag: 'popup', role: 'tool', title: 'Popup menu', componentType: PopupTool }],
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdToolbar, GrdDockingEngine, GrdStatusBar],
  template: `
    <grd-app-header
      productName="Notes"
      subtitle="a menu bar, a toolbar, a popup menu and a status bar around a docking engine"
      icon="grd:logo"
      preferences="theme density"
    />
    <grd-menu-bar [menus]="menus()" [shortcuts]="true">
      <span grdMenuBarTitle>{{ title() }}</span>
    </grd-menu-bar>
    @if (showToolbar()) {
      <!-- The menu bar runs the shortcuts, the toolbar only shows them in its tooltips. A press on the toolbar
           leaves the focus in the note (keepFocus), so a command acts on the place the user works in. -->
      <grd-toolbar
        [items]="toolbarItems"
        [shortcuts]="false"
        keepFocus
        ariaLabel="Notes"
        (action)="onToolbar($event)"
      />
    }
    <grd-docking-engine
      [defaultLayout]="layout"
      [layoutStorageKey]="null"
      viewSources
      (tabOpened)="commands.say('Opened ' + $event.title + '.')"
      (tabClosed)="commands.say('Closed ' + $event.title + '.')"
    />
    @if (showStatusBar()) {
      <grd-status-bar [items]="statusItems()" />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-toolbar {
      flex: none;
      border-bottom: 1px solid var(--grd-border-color);
    }
    grd-docking-engine {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class App {
  protected readonly layout = LAYOUT;
  protected readonly commands = inject(NoteCommands);
  private readonly notes = inject(Notes);
  private readonly engine = viewChild(GrdDockingEngine);
  private readonly menuBar = viewChild(GrdMenuBar);

  protected readonly showToolbar = signal(true);
  protected readonly showStatusBar = signal(true);

  constructor() {
    // The commands open and close the tabs of this engine.
    effect(() => this.commands.attach(this.engine()));
  }

  /** The title in the menu bar. */
  protected readonly title = computed(() => {
    const doc = this.commands.document();
    return doc ? `${doc.title}${this.commands.note()?.dirty() ? ' *' : ''} – Notes` : 'Notes';
  });

  // ---- the menu bar ----

  /** The menus: a `computed`, so the state of the items (enabled, checked) follows the signals it reads. */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const commands = this.commands;
    return [
      {
        id: 'file',
        label: '&File',
        items: [
          grdMenuItemOf(commands.newDocument),
          {
            label: 'Open sa&mple',
            children: Object.keys(SAMPLES).map((title) => ({
              label: title,
              run: () => commands.open(title, SAMPLES[title]),
            })),
          },
          { separator: true },
          grdMenuItemOf(commands.save),
          grdMenuItemOf(commands.close),
        ],
      },
      {
        id: 'edit',
        label: '&Edit',
        items: [
          grdMenuItemOf(commands.insertDate),
          {
            label: 'Change &case',
            icon: 'app:case',
            children: [
              grdMenuItemOf(commands.upperCase),
              grdMenuItemOf(commands.lowerCase),
              grdMenuItemOf(commands.titleCase),
            ],
          },
        ],
      },
      {
        id: 'view',
        label: '&View',
        items: [
          {
            label: '&Toolbar',
            checked: this.showToolbar(),
            run: () => this.showToolbar.update((on) => !on),
          },
          {
            label: 'Status &bar',
            checked: this.showStatusBar(),
            run: () => this.showStatusBar.update((on) => !on),
          },
          { separator: true },
          grdMenuItemOf(commands.wrapLines),
          {
            label: '&Zoom',
            children: ZOOMS.map((zoom) => ({
              label: zoom,
              checked: this.notes.zoom() === zoom,
              run: () => this.notes.zoom.set(zoom),
            })),
          },
          { separator: true },
          // The blocks of the engine (viewSources): its tool panels with a check mark, and Restore layout.
          { source: 'grd:tools' },
          { source: 'grd:restore-layout' },
        ],
      },
      // The open documents, numbered, the active one checked: the block of the engine.
      { id: 'window', label: '&Window', items: [{ source: 'grd:documents' }] },
      { id: 'help', label: '&Help', items: [{ label: '&About', run: () => commands.about() }] },
    ];
  });

  // ---- the toolbar ----

  /**
   * The items of the toolbar. They are made once: the toolbar keeps the state of a control (a toggle, a select) for its object. What changes is in signals:
   * the state of a command (`grdToolbarItemOf` makes `disabled` and `checked` of its signals, and the toolbar runs the command itself) and `value` of the
   * select (a writable signal, so the toolbar writes it and the menu sees it).
   */
  protected readonly toolbarItems: GrdToolbarItem[] = [
    grdToolbarItemOf(this.commands.newDocument, { priority: 10 }),
    { type: 'separator' },
    grdToolbarItemOf(this.commands.save, { inputs: { iconOnly: true }, priority: 9 }),
    grdToolbarItemOf(this.commands.close, { inputs: { iconOnly: true }, priority: 8 }),
    { type: 'separator' },
    grdToolbarItemOf(this.commands.wrapLines, { inputs: { iconOnly: true }, priority: 5 }),
    {
      type: 'split-button',
      action: 'case',
      label: 'UPPER CASE',
      icon: 'app:case',
      disabled: computed(() => !this.commands.note()),
      // The main part runs UPPER CASE; a choice of its menu goes to `onToolbar`.
      run: this.commands.upperCase.run,
      choices: [
        { label: 'UPPER CASE', value: 'upper' },
        { label: 'lower case', value: 'lower' },
        { label: 'Title Case', value: 'title' },
      ],
      priority: 3,
    },
    grdToolbarItemOf(this.commands.insertDate, { inputs: { iconOnly: true }, priority: 4 }),
    { type: 'separator' },
    {
      type: 'select',
      action: 'zoom',
      label: 'Zoom',
      value: this.notes.zoom,
      choices: ZOOMS.map((zoom) => ({ label: zoom })),
      width: 84,
      priority: 6,
    },
  ];

  /**
   * What the toolbar tells. The items of the commands have run their commands already, and the select wrote its signal itself (zoom): only a choice of
   * the split button is left, the case it names.
   */
  protected onToolbar(event: GrdRibbonActionEvent): void {
    if (event.item.action === 'case' && event.choice) {
      this.commands.byId.get(String(event.choice.value))?.run();
    }
  }

  // ---- the status bar ----

  /** The status bar: a `computed` of the state of the application and of the engine. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => {
    const doc = this.commands.document();
    const note = this.commands.note();
    const count = this.commands.documentCount();
    const saving = this.commands.saving();
    const zoom = this.notes.zoom();
    return [
      {
        id: 'message',
        text: this.commands.message(),
        shrink: true,
        live: true,
        busy: saving !== null,
      },
      {
        id: 'saving',
        progress: saving ?? 0,
        tooltip: 'Saving',
        visible: saving !== null,
        align: 'end',
      },
      {
        id: 'document',
        icon: 'grd:document',
        text: doc ? doc.title + (note?.dirty() ? ' *' : '') : 'No document',
        tooltip: 'The active document',
        align: 'end',
        priority: 5,
      },
      {
        id: 'words',
        text: `${note?.words() ?? 0} words`,
        visible: !!note,
        align: 'end',
        priority: 2,
      },
      {
        id: 'count',
        text: count === 1 ? '1 document' : `${count} documents`,
        tooltip: 'The open documents (the Window menu)',
        align: 'end',
        priority: 4,
        run: () => this.menuBar()?.open('window'),
      },
      {
        id: 'zoom',
        icon: 'grd:zoom',
        text: zoom,
        tooltip: 'Zoom',
        align: 'end',
        priority: 3,
        choices: ZOOMS.map((step) => ({
          label: step,
          checked: step === zoom,
          run: () => this.notes.zoom.set(step),
        })),
      },
    ];
  });
}
