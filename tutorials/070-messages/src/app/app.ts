import { Component, computed, inject, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdMenu,
  GrdMenuBar,
  GrdMessageBarSpec,
  GrdToast,
} from '@gridify/studio';
import { MessageBars } from './message-bars';
import { MessageBoxes } from './message-boxes';
import { Toasts } from './toasts';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdButton, MessageBoxes, Toasts, MessageBars],
  template: `
    <grd-app-header
      productName="Messages"
      subtitle="message boxes, toasts and message bars"
      icon="grd:logo"
      preferences="theme density"
    />
    <!-- [(messageBar)]: a message under the menu bar, over the whole width of the application. -->
    <grd-menu-bar [menus]="menus()" [(messageBar)]="notice" />
    <main>
      <app-message-boxes />
      <app-toasts />
      <app-message-bars />
      <section class="demo">
        <h2>4. A message under the menu bar</h2>
        <p>
          The menu bar (and the ribbon) has a message bar of its own: [(messageBar)] shows a message
          under it, over the whole width of the application, and moves the page down while it is
          there. The Document menu has the same commands.
        </p>
        <div class="row">
          <grd-button label="Open read-only" (pressed)="readOnly()" />
          <grd-button label="An update is ready" (pressed)="updateReady()" />
        </div>
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
  `,
})
export class App {
  private readonly toast = inject(GrdToast);

  /** The message under the menu bar, or null for none. */
  protected readonly notice = signal<GrdMessageBarSpec | null>(null);

  protected readonly menus = computed<GrdMenu[]>(() => [
    {
      id: 'document',
      label: '&Document',
      items: [
        { label: 'Open &read-only', run: () => this.readOnly() },
        { label: 'An &update is ready', run: () => this.updateReady() },
        { separator: true },
        {
          label: '&Hide the message',
          enabled: this.notice() !== null,
          run: () => this.notice.set(null),
        },
      ],
    },
  ]);

  protected readOnly(): void {
    this.notice.set({
      text: 'report.docx is open read-only: another user is editing it.',
      severity: 'warning',
      actions: [
        {
          label: 'Edit a copy',
          run: () =>
            this.notice.set({ text: 'You are editing report (copy).docx.', severity: 'success' }),
        },
      ],
    });
  }

  protected updateReady(): void {
    this.notice.set({
      text: 'Version 2.4 is downloaded and ready to install.',
      actions: [
        {
          label: 'Restart now',
          variant: 'primary',
          run: () => {
            this.notice.set(null);
            this.toast.info('This is a tutorial: nothing restarts.');
          },
        },
        { label: 'Later', run: () => this.notice.set(null) },
      ],
    });
  }
}
