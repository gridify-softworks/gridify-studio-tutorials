import { Component, computed, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdContentRegistry,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  GrdEngineSettings,
  GrdI18n,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBox,
  GrdStatusBar,
  GrdStatusItem,
} from '@gridify/studio';
import { CalendarPage } from './calendar-page';
import { Form } from './form';

/** Two documents (a calendar and HTML notes) and a tool with a form on the right. */
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
        { tag: 'calendar', role: 'document', title: 'Calendar', componentKey: 'calendar' },
        {
          tag: 'notes',
          role: 'document',
          title: 'Notes',
          content: '<p>The texts of this application are English: they are its own.</p>',
        },
      ],
    },
    {
      type: 'panel',
      role: 'tool',
      size: 35,
      activeTab: 0,
      collapsed: false,
      tabs: [{ tag: 'form', role: 'tool', title: 'Form', componentKey: 'form' }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdDockingEngine, GrdStatusBar],
  template: `
    <!-- the Language select of the header switches the language by itself -->
    <grd-app-header productName="Languages" preferences="language" />
    <grd-menu-bar [menus]="menus()" />
    <!-- viewSources: the engine fills the blocks grd:tools and grd:restore-layout of the View menu -->
    <grd-docking-engine
      layoutStorageKey="tutorial-130-layout"
      [defaultLayout]="layout"
      viewSources
    />
    <grd-status-bar [items]="statusItems()" />
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
  private readonly i18n = inject(GrdI18n);
  private readonly box = inject(GrdMessageBox);
  protected readonly layout = LAYOUT;

  constructor() {
    // Save the layout after every change (by default the engine only loads a saved layout).
    inject(GrdEngineSettings).setAutoSaveLayout(true);
    // The components of the tabs, by the keys that the layout names.
    const registry = inject(GrdContentRegistry);
    registry.registerComponent('calendar', CalendarPage);
    registry.registerComponent('form', Form);
  }

  /** One item for every language that has a dictionary, in its own name, with a check mark at the one in use. */
  private readonly languageItems = computed(() =>
    this.i18n.languages().map((code) => ({
      label: this.i18n.languageName(code),
      checked: this.i18n.language() === code,
      run: () => void this.i18n.setLanguage(code),
    })),
  );

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'file',
      label: '&File',
      items: [
        {
          label: 'Add a &calendar',
          run: () =>
            this.engine().openComponentTab({ title: 'Calendar', componentKey: 'calendar' }),
        },
      ],
    },
    {
      id: 'view',
      label: '&View',
      items: [
        { label: '&Language', children: this.languageItems() },
        { separator: true },
        // The tools of the engine and Restore layout: blocks of the library, in the language in use.
        { source: 'grd:tools' },
        { separator: true },
        { source: 'grd:restore-layout' },
      ],
    },
    {
      id: 'help',
      label: '&Help',
      items: [
        {
          label: 'Ask a &question',
          run: () =>
            this.box.question('Keep the notes for the next visit?', { buttons: 'yesNoCancel' }),
        },
      ],
    },
  ]);

  /** What the page says about its language: the attributes that the library sets on <html>. */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => [
    { id: 'lang', text: `<html lang="${this.i18n.language()}">` },
    { id: 'script', text: `data-grd-script="${this.i18n.scriptClass()}"` },
  ]);
}
