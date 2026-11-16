import { Component, computed, inject, signal } from '@angular/core';
import {
  GRD_I18N,
  GRD_LIB_DE,
  GRD_LIB_EN,
  GRD_LIB_JA,
  GrdDictionary,
  GrdEntry,
  GrdI18n,
  GrdInput,
} from '@gridify/studio';

/** The dictionaries as the library ships them: what a text was before the company changed it. */
const SHIPPED: Record<string, GrdDictionary> = {
  en: GRD_LIB_EN,
  de: GRD_LIB_DE,
  ja: GRD_LIB_JA,
};

/** What an entry says: the text, or the `other` form of plural forms. */
const textOf = (entry: GrdEntry | undefined): string =>
  entry === undefined ? '' : typeof entry === 'string' ? entry : entry.other;

/** A tool that finds the key of a text of the library: type a piece of a text you see on the screen. */
@Component({
  selector: 'app-text-finder',
  imports: [GrdInput],
  template: `
    <grd-input label="A text you see" placeholder="close, report…" [(value)]="query" />
    @for (row of found(); track row.key) {
      <div class="row">
        <code>{{ row.key }}</code>
        <span>{{ row.text }}</span>
        @if (row.changed) {
          <span class="changed">company</span>
          <span class="was">the library: {{ row.was }}</span>
        }
      </div>
    } @empty {
      <p>Type two letters or more of a text of the library, in the language of the screen.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 12px;
      font-size: var(--grd-font-size-base);
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 8px;
      padding: 4px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
    code {
      flex-basis: 100%;
      font-family: var(--grd-font-mono);
      opacity: 0.88;
    }
    .changed {
      color: var(--grd-link-color, var(--grd-accent));
      font-weight: 600;
    }
    .was {
      flex-basis: 100%;
      opacity: 0.88;
    }
    p {
      margin: 4px 0;
      opacity: 0.88;
    }
  `,
})
export class TextFinder {
  private readonly i18n = inject(GrdI18n);
  protected readonly query = signal('');

  /** The keys whose text in the language of the screen (or whose key) has what is typed. */
  protected readonly found = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (query.length < 2) return [];
    // A new dictionary or another language: the snapshot is taken again.
    this.i18n.revision();
    const language = this.i18n.language();
    const now = GRD_I18N.dictionariesSnapshot().get(language) ?? {};
    const shipped = SHIPPED[language] ?? {};
    return Object.keys(GRD_LIB_EN)
      .map((key) => ({
        key,
        text: textOf(now[key] ?? GRD_LIB_EN[key]),
        was: textOf(shipped[key]),
        changed: JSON.stringify(now[key]) !== JSON.stringify(shipped[key]),
      }))
      .filter(
        (row) => row.text.toLowerCase().includes(query) || row.key.toLowerCase().includes(query),
      )
      .slice(0, 30);
  });
}
