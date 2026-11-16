import { Component, computed, inject, signal } from '@angular/core';
import {
  GRD_TOAST_HISTORY_ICON,
  GrdAppHeader,
  type GrdMenu,
  GrdMenuBar,
  grdMenuItemOf,
  GrdStatusBar,
  type GrdStatusItem,
  GrdToast,
  GrdToastHistory,
  GrdToastHistoryControl,
  GrdToastHistoryList,
  GrdToolbar,
  type GrdToolbarItem,
  grdToolbarItemOf,
} from '@gridify/studio';
import { About } from './about';
import { HISTORY_MAX } from './app.config';
import { OrderCommands } from './order-commands';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdMenuBar, GrdToolbar, GrdStatusBar, GrdToastHistoryList, About],
  template: `
    <grd-app-header
      productName="Orders"
      subtitle="the history of the notifications"
      icon="grd:logo"
      preferences="theme density"
    />
    <!-- The menu bar runs the shortcuts (Ctrl+S); the toolbar only shows them in its tooltips. -->
    <grd-menu-bar [menus]="menus()" [shortcuts]="true" />
    <!-- The commands of the order, and at the end the bell with the history under it. -->
    <grd-toolbar [items]="toolbarItems" [shortcuts]="false" ariaLabel="Order 1042" />
    <main [class.with-list]="showList()">
      <!-- What this tutorial is about: the first thing on the page. -->
      <app-about />
      @if (showList()) {
        <!-- The same history as a list in the page: the bell and the menu show the same one. -->
        <grd-toast-history-list class="list" />
      }
    </main>
    <grd-status-bar [items]="statusItems()" />
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
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: grid;
      align-items: start;
      gap: 16px 32px;
      padding: 16px 20px 24px;
    }
    main.with-list {
      grid-template-columns: minmax(0, 72ch) minmax(280px, 380px);
    }
    /* A narrow window: the list goes under the text. */
    @media (max-width: 760px) {
      main.with-list {
        grid-template-columns: minmax(0, 1fr);
      }
    }
    .list {
      border: 1px solid var(--grd-border-color);
      border-radius: 6px;
      background: var(--grd-bg-panel);
      /* How high the list grows before it scrolls inside. */
      --grd-toast-history-max-height: 60vh;
    }
  `,
})
export class App {
  protected readonly commands = inject(OrderCommands);
  /** The history of the notifications: its entries and the count of the unread are signals. */
  protected readonly history = inject(GrdToastHistory);
  /** Is the list in the page (View › The list in the page)? */
  protected readonly showList = signal(true);

  constructor() {
    // The first notification comes when the page opens, so the bell has a number at once.
    inject(GrdToast).info('2 orders came in since yesterday.', { title: 'Welcome back' });
  }

  /** The menus: a `computed`, so the submenu of the history follows its entries. */
  protected readonly menus = computed<GrdMenu[]>(() => {
    const commands = this.commands;
    const unread = this.history.unread();
    return [
      {
        id: 'order',
        label: '&Order',
        items: [
          grdMenuItemOf(commands.save),
          grdMenuItemOf(commands.importLines),
          grdMenuItemOf(commands.print),
          grdMenuItemOf(commands.send),
          { separator: true },
          grdMenuItemOf(commands.copyLink),
          { separator: true },
          grdMenuItemOf(commands.receive),
        ],
      },
      {
        id: 'view',
        label: '&View',
        items: [
          // The history as a submenu: the newest ten (a choice shows the toast again), then Mark
          // all as read and Clear. menuItems() reads the entries, so this computed follows them.
          {
            label: unread > 0 ? `&Notifications (${unread})` : '&Notifications',
            icon: GRD_TOAST_HISTORY_ICON,
            children: this.history.menuItems(),
          },
          { separator: true },
          {
            label: 'The list in the &page',
            checked: this.showList(),
            run: () => this.showList.update((on) => !on),
          },
        ],
      },
    ];
  });

  /**
   * The toolbar: the same commands, with shorter labels, and the bell at the end. The bell is an
   * item of its own kind (`custom`, `GrdToastHistoryControl`); its label names it (the tooltip,
   * and what a screen reader says before the number), and the highest priority keeps it in the
   * bar when the window is narrow (the other items go behind the chevron first).
   */
  protected readonly toolbarItems: GrdToolbarItem[] = [
    grdToolbarItemOf(this.commands.save, { priority: 6 }),
    grdToolbarItemOf(this.commands.importLines, { label: 'Import', priority: 3 }),
    grdToolbarItemOf(this.commands.print, { priority: 4 }),
    grdToolbarItemOf(this.commands.send, { label: 'Send', priority: 2 }),
    { type: 'separator' },
    grdToolbarItemOf(this.commands.copyLink, { priority: 1 }),
    { type: 'separator' },
    grdToolbarItemOf(this.commands.receive, { label: 'Receive', priority: 5 }),
    {
      type: 'custom',
      component: GrdToastHistoryControl,
      label: 'Notifications',
      end: true,
      priority: 10,
    },
  ];

  /**
   * The status bar reads the history too: how many are unread, and how many it keeps. A press on the
   * bell of the bar opens the newest ten above it (`statusChoices()`, the same list as the menu).
   */
  protected readonly statusItems = computed<GrdStatusItem[]>(() => {
    const unread = this.history.unread();
    const kept = this.history.entries().length;
    return [
      { id: 'order', text: 'Order 1042 · ACME Ltd.', shrink: true },
      {
        id: 'unread',
        icon: GRD_TOAST_HISTORY_ICON,
        text: `${unread} unread`,
        tooltip: 'The notifications',
        align: 'end',
        choices: this.history.statusChoices(),
      },
      {
        id: 'kept',
        text: `${kept} of ${HISTORY_MAX} kept`,
        tooltip: `The history keeps the newest ${HISTORY_MAX} notifications.`,
        align: 'end',
      },
    ];
  });
}
