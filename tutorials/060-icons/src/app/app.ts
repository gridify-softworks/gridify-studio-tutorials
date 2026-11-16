import { Component, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdIcon,
  GrdIcons,
  GrdToast,
  grdClassIcon,
} from '@gridify/studio';
import { PLACEHOLDER } from './app-icons';
import { type Example, SECTIONS } from './examples';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdIcon],
  template: `
    <grd-app-header
      productName="Icons"
      subtitle="the library, the application, a file, text and PrimeIcons"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      @for (section of sections; track section.id) {
        <section>
          <h2>{{ section.title }}</h2>
          <p>{{ section.text }}</p>
          @for (row of section.rows; track $index) {
            <div class="row {{ row.cls ?? '' }}">
              @if (row.name) {
                <span class="row-name">{{ row.name }}</span>
              }
              @for (example of row.examples; track example.label) {
                <grd-button
                  [class]="example.cls ?? ''"
                  [label]="example.label"
                  [icon]="example.icon"
                  [iconOnly]="!!example.iconOnly"
                  [variant]="example.variant ?? 'default'"
                  [appearance]="example.appearance ?? 'solid'"
                  [layout]="example.layout ?? 'row'"
                  (pressed)="show(example)"
                />
              }
            </div>
          }
          @if (section.id === 'file') {
            <div class="row">
              <grd-button
                label="Load star.svg"
                icon="grd:plus"
                variant="primary"
                [busy]="loading()"
                [disabled]="starLoaded()"
                (pressed)="loadStar()"
              />
              <grd-button
                label="Placeholder again"
                icon="grd:close"
                [disabled]="!starLoaded()"
                (pressed)="placeholderAgain()"
              />
            </div>
          }
        </section>
      }
      <section>
        <h2>7. An icon on its own</h2>
        <p>
          The directive [grdIcon] draws any of these icons into an element of yours. The element
          gives the icon its size (here 1em, as high as the text) and its color (the color of the
          text).
        </p>
        <p class="inline">
          Saved <span class="icon ok" [grdIcon]="'grd:check'"></span>, look at this
          <span class="icon warn" [grdIcon]="'grd:alert'"></span>, a heart
          <span class="icon love" [grdIcon]="heart"></span>, a rocket
          <span class="icon" [grdIcon]="'app:rocket'"></span> and a bigger one
          <span class="icon big" [grdIcon]="'app:rocket'"></span>.
        </p>
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
      padding: 8px 20px 24px;
    }
    section {
      max-width: 960px;
      margin-top: 16px;
    }
    h2 {
      margin: 0 0 4px;
      font-size: 1.05rem;
    }
    p {
      margin: 0 0 8px;
      max-width: 75ch;
      line-height: 1.45;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .row-name {
      width: 88px;
      opacity: 0.88;
    }
    /* Sizes: a button is as high as --grd-button-height and writes in --grd-font-size; its icon is 1.15em of that font. */
    .size-s {
      --grd-button-height: 24px;
      --grd-font-size: 11px;
    }
    .size-l {
      --grd-button-height: 36px;
      --grd-font-size: 15px;
    }
    .size-xl {
      --grd-button-height: 48px;
      --grd-font-size: 19px;
    }
    /* Colors: the icon has the color of the text, unless --grd-button-icon-color gives it one of its own. */
    .go {
      --grd-button-icon-color: var(--grd-success-text);
    }
    .stop {
      --grd-button-icon-color: var(--grd-danger-text);
    }
    .accent {
      --grd-button-icon-color: var(--grd-accent);
    }
    /* An icon on its own: the directive puts the svg (or the <i> of a font icon) into the span, so the span gives it its size. */
    .icon {
      display: inline-flex;
      width: 1em;
      height: 1em;
      vertical-align: -0.125em;
    }
    /* The svg is not a part of this template: a style of the component reaches it only through ::ng-deep. */
    .icon ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
    .big {
      font-size: 32px;
    }
    .ok {
      color: var(--grd-success-text);
    }
    .warn {
      color: var(--grd-warning-text);
    }
    .love {
      color: var(--grd-danger-text);
    }
  `,
})
export class App {
  private readonly icons = inject(GrdIcons);
  private readonly toast = inject(GrdToast);

  protected readonly sections = SECTIONS;
  protected readonly heart = grdClassIcon('pi pi-heart');
  protected readonly loading = signal(false);
  protected readonly starLoaded = signal(false);

  /** A button was pressed: the toast shows its icon, says how the icon is defined, and has the line of the template under Details. */
  protected show(example: Example): void {
    this.toast.info(example.how, {
      title: example.label,
      icon: example.icon,
      detail: example.code,
    });
  }

  /** Fetches public/icons/star.svg and registers it under the name of the placeholder: everything that shows the name is drawn again. */
  protected async loadStar(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await fetch('icons/star.svg');
      if (!response.ok) {
        throw new Error(`icons/star.svg: ${response.status} ${response.statusText}`);
      }
      // The registry takes a text that starts with <svg: an <?xml …?> line or a comment before it would be refused.
      const svg = (await response.text()).replace(/^[\s\S]*?(?=<svg)/i, '');
      // A server that answers every unknown address with the page of the application sends 200 and no SVG.
      if (!/^<svg[\s>]/i.test(svg)) throw new Error('icons/star.svg is not an SVG file');
      this.icons.set('app:file-star', svg);
      this.starLoaded.set(true);
      this.toast.success('The star is loaded: both star buttons show it now.', {
        icon: 'app:file-star',
      });
    } catch (error) {
      this.toast.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  /** Puts the placeholder back under the name, so the file can be loaded again. */
  protected placeholderAgain(): void {
    this.icons.set('app:file-star', PLACEHOLDER);
    this.starLoaded.set(false);
  }
}
