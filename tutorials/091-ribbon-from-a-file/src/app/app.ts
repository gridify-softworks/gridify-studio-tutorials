import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  grdLoadRibbon,
  GrdAppHeader,
  GrdButton,
  GrdRibbon,
  GrdSelect,
  GrdSwitch,
  type GrdRibbonActionEvent,
  type GrdRibbonLoadBindings,
  type GrdRibbonLoadOptions,
  type GrdRibbonLoadProblem,
  type GrdRibbonTab,
} from '@gridify/studio';
import { DocState } from './doc-state';
import { type Language, translator } from './texts';

type FileName = 'ribbon.json' | 'tabs.json';

/** What a load gave: the tabs, the options the file carried, and what the loader could not use. */
interface Loaded {
  file: FileName;
  tabs: GrdRibbonTab[];
  options: GrdRibbonLoadOptions;
  problems: GrdRibbonLoadProblem[];
}

/**
 * The inputs of the ribbon that the application gives itself. A plain list of tabs has no options, so these are what it gets; the file of
 * the editor says its own (here the same, and `search` and `collapsible` on), and what it says wins.
 */
const APP_OPTIONS = {
  defaultRows: 3,
  uniformRows: false,
  collapsible: false,
  search: false,
  colWidth: 24 as number | undefined,
  colGap: undefined as number | undefined,
  searchPlaceholder: undefined as string | undefined,
};

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdRibbon, GrdSelect, GrdSwitch],
  template: `
    <grd-app-header
      productName="Ribbon from a file"
      subtitle="the file of the Ribbon Editor and a plain list of tabs, loaded with grdLoadRibbon"
      icon="grd:logo"
      preferences="theme density"
    />
    @if (loaded(); as ribbon) {
      <grd-ribbon
        [tabs]="ribbon.tabs"
        [defaultRows]="options().defaultRows"
        [uniformRows]="options().uniformRows"
        [colWidth]="options().colWidth"
        [colGap]="options().colGap"
        [collapsible]="options().collapsible"
        [search]="options().search"
        [searchPlaceholder]="options().searchPlaceholder"
        (action)="onAction($event)"
      />
    }
    <main>
      <section>
        <h2>The file</h2>
        <grd-select
          label="File in public/ribbons"
          [options]="files"
          [value]="file()"
          (valueChange)="file.set($event ?? 'ribbon.json')"
          [reserveMessageSpace]="false"
        />
        <grd-select
          label="Language of tr()"
          [options]="languages"
          [value]="language()"
          (valueChange)="language.set($event ?? 'en')"
          [reserveMessageSpace]="false"
        />
        <grd-switch
          label="Register the function percentText"
          [reserveMessageSpace]="false"
          [(checked)]="registerPercent"
        />
        <h3>Options of the file</h3>
        <pre>{{ optionsText() }}</pre>
        <h3>Problems of the load</h3>
        @for (problem of loaded()?.problems ?? []; track problem.message) {
          <p class="problem">{{ problem.kind }}: {{ problem.message }}</p>
        } @empty {
          <p>None.</p>
        }
      </section>

      <section>
        <h2>The document</h2>
        <grd-switch
          label="Some text is selected"
          [reserveMessageSpace]="false"
          [(checked)]="state.hasSelection"
        />
        <grd-switch
          label="A picture is selected"
          [reserveMessageSpace]="false"
          [(checked)]="state.pictureSelected"
        />
        <grd-button label="Type 10 words" (pressed)="state.words.update((w) => w + 10)" />
        <h3>State</h3>
        <ul>
          <li>Clipboard: {{ state.clipboard() || 'empty' }}</li>
          <li>
            Bold {{ state.bold() }}, italic {{ state.italic() }}, underline {{ state.underline() }}
          </li>
          <li>
            Align: {{ state.align() }}, layout: {{ state.layout() }}, zoom: {{ state.zoom() }} %
          </li>
          <li>Words: {{ state.words() }}</li>
          @for (line of state.fieldLines(); track line) {
            <li>{{ line }}</li>
          }
        </ul>
      </section>

      <section>
        <h2>Actions</h2>
        <p>What reached <code>(action)</code>, the last one first:</p>
        <ul>
          @for (entry of log(); track $index) {
            <li>{{ entry }}</li>
          } @empty {
            <li>Nothing yet. Press a button of the ribbon.</li>
          }
        </ul>
      </section>
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(20em, 100%), 1fr));
      align-items: start;
      gap: 8px 24px;
      padding: 12px 16px;
    }
    section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    h2,
    h3 {
      margin: 4px 0 0;
      font-size: 1rem;
    }
    h3 {
      font-size: 0.9rem;
      font-weight: 600;
    }
    p,
    ul {
      margin: 0;
    }
    ul {
      padding-left: 18px;
    }
    pre {
      margin: 0;
      font-size: 0.85rem;
    }
    .problem {
      color: var(--grd-danger-text, #c00);
    }
  `,
})
export class App {
  protected readonly state = inject(DocState);

  protected readonly files: { value: FileName; label: string }[] = [
    { value: 'ribbon.json', label: 'ribbon.json (the file of the editor)' },
    { value: 'tabs.json', label: 'tabs.json (a plain list of tabs)' },
  ];
  protected readonly languages: { value: Language; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
  ];
  protected readonly file = signal<FileName>('ribbon.json');
  protected readonly language = signal<Language>('en');
  protected readonly registerPercent = signal(true);

  protected readonly loaded = signal<Loaded | null>(null);
  /** The options of the ribbon: the ones of the application, and over them the ones the file carries. */
  protected readonly options = computed(() => ({ ...APP_OPTIONS, ...this.loaded()?.options }));
  protected readonly optionsText = computed(() => {
    const options = this.loaded()?.options ?? {};
    return Object.keys(options).length > 0
      ? JSON.stringify(options, null, 2)
      : 'none (a plain list has no options)';
  });
  protected readonly log = signal<string[]>([]);

  private loads = 0;

  constructor() {
    // The ribbon is loaded again when the file, the language of tr() or the registration of percentText changes.
    effect(() => {
      const file = this.file();
      const language = this.language();
      const registerPercent = this.registerPercent();
      untracked(() => void this.load(file, language, registerPercent));
    });
  }

  /** The file is fetched from the assets, and `grdLoadRibbon` turns it into the tabs the ribbon takes. */
  private async load(file: FileName, language: Language, registerPercent: boolean): Promise<void> {
    const load = ++this.loads;
    // A file that cannot be fetched or is not JSON is `undefined` here: the loader reports it as a definition that is not a ribbon.
    const definition: unknown = await fetch(`ribbons/${file}`)
      .then((response) => (response.ok ? response.json() : undefined))
      .catch(() => undefined);
    if (load !== this.loads) return; // a newer load has started meanwhile
    const problems: GrdRibbonLoadProblem[] = [];
    const bindings = this.bindings(file, language, registerPercent);
    const result = grdLoadRibbon(definition, {
      ...bindings,
      // Without `onProblem` every problem is written to the console as an error. The application keeps them to show, and writes them too.
      onProblem: (problem) => {
        problems.push(problem);
        console.error(`Ribbon ${file}: ${problem.message}`);
      },
    });
    this.loaded.set({ file, tabs: result.tabs, options: result.options, problems });
  }

  /**
   * What the application gives the loader. The file of the editor names what it needs: its functions (`tr`, `s.field`, `s.flag`,
   * `percentText`) and its signals (`{ "$bind": "noSelection" }`). A plain list names nothing, so the application lays its signals over
   * the items by their `id`.
   */
  private bindings(
    file: FileName,
    language: Language,
    registerPercent: boolean,
  ): GrdRibbonLoadBindings {
    const s = this.state;
    if (file === 'tabs.json') {
      const needsSelection = { disabled: s.noSelection, disabledReason: 'Select some text first.' };
      return {
        items: {
          paste: { disabled: s.noClipboard, disabledReason: 'Cut or copy something first.' },
          cut: needsSelection,
          copy: needsSelection,
          formatPainter: needsSelection,
          bold: { checked: s.bold },
          italic: { checked: s.italic },
          underline: { checked: s.underline },
          fontSize: { value: s.field('fontSize', 11) },
          wrap: { checked: s.flag('wrap', true) },
          ruler: { checked: s.ruler },
          zoomPercent: { value: s.zoom },
        },
        tabs: { pictureTools: { hidden: s.noPicture } },
      };
    }
    return {
      functions: {
        // Only a function that is registered runs: a call in the file (`tr('Home')`) is looked up here by its name.
        // `tr` is a translation of the library (as `t`, `tx` and `tk`): without it the loader would translate with
        // GRD_I18N. This ribbon has texts of its own, so its translator wins.
        tr: translator(language),
        's.field': (name: string, fallback: unknown) => s.field(name, fallback),
        's.flag': (name: string, fallback: boolean) => s.flag(name, fallback),
        ...(registerPercent
          ? { percentText: (_value: number, percent: number) => `${Math.round(percent)} %` }
          : {}),
      },
      signals: {
        noSelection: s.noSelection,
        noClipboard: s.noClipboard,
        noPicture: s.noPicture,
        bold: s.bold,
        italic: s.italic,
        underline: s.underline,
        ruler: s.ruler,
        gridlines: s.gridlines,
        zoom: s.zoom,
        alignLeft: s.alignLeft,
        alignCenter: s.alignCenter,
        alignRight: s.alignRight,
        layoutPrint: s.layoutPrint,
        layoutWeb: s.layoutWeb,
        layoutOutline: s.layoutOutline,
        goalPercent: s.goalPercent,
        pagesPercent: s.pagesPercent,
      },
    };
  }

  /** Every command of the ribbon comes here; the controls that hold a state in a writable signal have already written it. */
  protected onAction({ item, value }: GrdRibbonActionEvent): void {
    const s = this.state;
    switch (item.action) {
      case 'cut':
      case 'copy':
        s.clipboard.set(item.action === 'cut' ? 'cut text' : 'copied text');
        break;
      case 'align':
        s.align.set(value as 'left' | 'center' | 'right');
        break;
      case 'layout-print':
      case 'layout-web':
      case 'layout-outline':
        s.layout.set(item.action.slice('layout-'.length) as 'print' | 'web' | 'outline');
        break;
    }
    this.log.update((log) =>
      [
        `${item.action ?? item.label ?? '?'}${value === undefined ? '' : ` = ${String(value)}`}`,
        ...log,
      ].slice(0, 8),
    );
  }
}
