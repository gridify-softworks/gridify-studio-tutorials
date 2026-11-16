import { afterNextRender, Component, inject, viewChild } from '@angular/core';
import {
  GrdAppHeader,
  GrdDockContainerNodeInput,
  GrdDockingEngine,
  grdRead,
  GrdRibbon,
  type GrdRibbonActionEvent,
} from '@gridify/studio';
import { DocumentPage } from './document-page';
import { Doc, DocFormat, Editor, STYLES, Template } from './editor';
import { GuideTool } from './guide-tool';
import { QUICK_ACCESS, ribbonTabs } from './ribbon-tabs';

/** The documents on the left, the Guide on the right. Nothing is saved: a reload starts again from here. */
const LAYOUT: GrdDockContainerNodeInput = {
  type: 'row',
  size: 100,
  children: [
    { type: 'panel', role: 'document', size: 74, activeTab: 0, collapsed: false, tabs: [] },
    {
      type: 'panel',
      role: 'tool',
      size: 26,
      activeTab: 0,
      collapsed: false,
      tabs: [{ role: 'tool', title: 'Guide', componentType: GuideTool }],
    },
  ],
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdRibbon, GrdDockingEngine],
  template: `
    <grd-app-header
      productName="Ribbon"
      subtitle="three tabs, many controls, collapsing sections, a docking engine"
      icon="grd:logo"
      preferences="theme density"
    />
    <grd-ribbon
      [tabs]="tabs"
      [(activeTab)]="editor.ribbonTab"
      [quickAccess]="quickAccess"
      [collapsible]="true"
      [search]="true"
      (action)="onAction($event)"
    />
    <grd-docking-engine
      [layoutStorageKey]="null"
      [defaultLayout]="layout"
      (tabActiveChanged)="editor.activeId.set($event.document?.tabId ?? null)"
      (tabClosed)="editor.remove($event.tabId)"
    />
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
  protected readonly editor = inject(Editor);
  private readonly engine = viewChild.required(GrdDockingEngine);
  protected readonly layout = LAYOUT;
  protected readonly tabs = ribbonTabs(this.editor);
  protected readonly quickAccess = QUICK_ACCESS;

  constructor() {
    // The engine is ready after the first render: one document to start with.
    afterNextRender(() => this.newDocument('letter'));
  }

  /** Every command of the ribbon comes here: from a click, a shortcut, a KeyTip, the command search or the quick access toolbar. */
  protected onAction({ item, value }: GrdRibbonActionEvent): void {
    const editor = this.editor;
    switch (item.action) {
      // Basics
      case 'new':
        return this.newDocument((value as Template | undefined) ?? 'blank');
      case 'close':
        return this.close(editor.activeId());
      case 'close-all':
        return editor.documents().forEach((doc) => this.close(doc.id));
      case 'duplicate':
        return this.open(editor.create('blank', editor.active() ?? undefined));
      case 'bold':
      case 'italic':
      case 'underline':
        return editor.patch({ [item.action]: value === true });
      case 'clear':
        return editor.patch({
          ...STYLES['normal'],
          underline: false,
          highlight: 'none',
          style: 'normal',
        });
      case 'reset-layout':
        this.engine().resetLayout();
        return;
      // Controls
      case 'font':
        return editor.patch({ font: String(value) });
      case 'size':
        return editor.patch({ size: Number(value) });
      case 'color':
      case 'highlight':
      case 'spacing':
      case 'paper':
        return editor.patch({ [item.action]: String(value) });
      case 'align':
        return editor.patch({ align: value as DocFormat['align'] });
      case 'style':
        return editor.patch({ ...STYLES[String(value)], style: String(value) });
      case 'frame':
        return editor.patch({ frame: value === true });
      case 'wide':
      case 'narrow':
        return editor.patch({ width: item.action });
      case 'table':
        return editor.patch({ table: tableOf(value) });
      // Collapsing
      case 'insert':
        return editor.insert(`[${grdRead(item.label)}]`);
      case 'symbol':
        return editor.insert(String(value ?? '§'));
    }
  }

  /** A new document: the editor makes it, the engine opens its tab. */
  private newDocument(template: Template): void {
    this.open(this.editor.create(template));
  }

  private open(doc: Doc): void {
    this.engine().openComponentTab({
      id: doc.id,
      title: doc.title,
      role: 'document',
      icon: 'app:page',
      componentType: DocumentPage,
      inputs: { doc },
    });
  }

  private close(id: string | null): void {
    if (id) this.engine().api.closeTab(id);
  }
}

/** `'4x3'` from the table picker is 4 columns and 3 rows; its choice Remove the table takes the table away. */
function tableOf(value: unknown): DocFormat['table'] {
  const [columns, rows] = String(value).split('x').map(Number);
  return columns > 0 && rows > 0 ? { columns, rows } : null;
}
