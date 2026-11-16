import { Component, computed, inject, signal } from '@angular/core';
import {
  GRD_I18N,
  GrdI18n,
  GrdProblem,
  GrdProblemList,
  GrdProblemTool,
  grdCheckDictionaries,
} from '@gridify/studio';

/**
 * A tool of the engine that lists what French lacks: `grdCheckDictionaries` compares every
 * dictionary with English. Only French and Canadian French are shown; the application has no
 * texts of its own in German or Japanese, so those two would list every text of the application.
 */
@Component({
  selector: 'app-french-check',
  imports: [GrdProblemList],
  template: `
    <p>{{ i18n.keyed('app.check.intro') }}</p>
    <grd-problem-list
      [problems]="problems()"
      [columns]="['severity', 'code', 'message']"
      [columnTitles]="{
        code: i18n.keyed('app.check.language'),
        message: i18n.keyed('app.check.key'),
      }"
      [tools]="tools()"
      [emptyText]="i18n.keyed('app.check.ok')"
      (toolUsed)="runs.set(runs() + 1)"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    p {
      margin: 0;
      padding: 8px 10px;
      font-size: var(--grd-font-size-base);
      line-height: 1.45;
    }
    grd-problem-list {
      flex: 1;
      min-height: 0;
    }
  `,
})
export class FrenchCheck {
  protected readonly i18n = inject(GrdI18n);
  /** Check again: in dev mode the texts looked up so far are checked too, and more are looked up as the user works. */
  protected readonly runs = signal(0);

  protected readonly problems = computed<GrdProblem[]>(() => {
    this.runs();
    // `revision` changes with every dictionary and language: a dictionary registered later is checked as well.
    this.i18n.revision();
    const issues = grdCheckDictionaries(
      GRD_I18N.dictionariesSnapshot(),
      GRD_I18N.defaultLanguage,
      GRD_I18N.usedLookups(),
    );
    return issues
      .filter((issue) => issue.language === 'fr' || issue.language.startsWith('fr-'))
      .map((issue) => ({
        id: `${issue.language} ${issue.key} ${issue.type}`,
        severity: 'warning',
        // The columns: the language, the key of the text, and what is wrong in the tooltip of the row.
        code: issue.language,
        message: issue.key,
        title: issue.type === 'missing' ? this.i18n.keyed('app.check.missing') : issue.detail,
      }));
  });

  protected readonly tools = computed<GrdProblemTool[]>(() => [
    { type: 'count' },
    { type: 'spacer' },
    { type: 'button', id: 'again', label: this.i18n.keyed('app.check.again') },
  ]);
}
