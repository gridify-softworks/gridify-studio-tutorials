# 071 – Notification history

This tutorial keeps what the toasts said, so that the user can come back to a message that went away: the history of the notifications. A toast is on the screen for a few seconds; when the user looked elsewhere, or three came at once, the history still has them, the newest first. You will learn how to:

- turn the history on (`provideGrdToastHistory`): the library keeps nothing until the application asks for it;
- put the bell at the end of a toolbar (`GrdToastHistoryControl`): the number of the notifications that the user has not seen, and the history in a panel under it;
- give the history as a submenu of the menu bar (`GrdToastHistory.menuItems()`), with the number in its label;
- show the history as a list in the page (`grd-toast-history-list`), and read it in the code (`entries()`, `unread()`);
- open it from the bell of the status bar (`GrdToastHistory.statusChoices()`);
- keep a toast out of the history (`history: false`), and see that a toast that changes is one notification, not two.

It goes deeper into the toasts of [070](../070-messages/README.md). The application starts from an empty `ng new`: a header, a menu bar, a toolbar, a page and a status bar, no docking engine.

```
npm run tutorial 071
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30071. The page says first what it is about and what to try; the bell at the right end of the toolbar has a number already (the welcome toast). Press the buttons of the toolbar, then open the bell and View › Notifications.

## The words first

- **A notification** is what one toast said: its title, its text, its severity, its detail and the time. Not its buttons: an Undo belongs to the moment of the toast.
- **Unread** is a notification that the user has not seen in the history. The bell counts them; they are read when the panel of the bell closes, with Mark all as read, or when one is shown again.
- **`GrdToastHistory`** is the history: a service of the root, as `GrdToast` is. `entries()` and `unread()` are signals, `markRead()`, `remove()`, `clear()` and `show()` change it, `menuItems()` gives it as the items of a menu. Every toast of `GrdToast` goes into it by itself: the code that shows a toast knows nothing about the history.

## Step by step

### Step 1: turn the history on

`src/app/app.config.ts`:

```ts
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { GrdIcons, provideGrdToastHistory } from '@gridify/studio';
import { APP_ICONS } from './app-icons';

/** How many notifications the history keeps: when there are more, the oldest go first. */
export const HISTORY_MAX = 30;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The history of the notifications is off in the library, and this line turns it on: from now
    // on every toast goes into it (unless the toast says history: false), and the bell is shown.
    provideGrdToastHistory({ max: HISTORY_MAX }),
    // The icons of the commands are in the registry before the menu bar and the toolbar draw them.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
```

Without `provideGrdToastHistory()` the history is off: nothing is kept, the bell is not shown, the list says "The history of the notifications is off." and `menuItems()` gives no items. So an application that does not want it changes nothing, and one that does adds one line. `max` is how many notifications it keeps (50 without it). `keep` decides which toasts go in, for instance `provideGrdToastHistory({ keep: (toast) => toast.severity !== 'success' })` for a history of the problems only. The history lives as long as the page: F5 starts an empty one.

### Step 2: the commands say what they did

`src/app/order-commands.ts` has the commands of the order (`GrdCommand`s, as in [100](../100-menu-toolbar/README.md): written once, used by the menu bar and the toolbar). Each one shows a toast, and none of them knows about the history. Three of them show what the history does with a toast:

```ts
  /**
   * One toast that changes: "Saving…" becomes "Saved.". The history keeps one notification for it,
   * and the change brings it to the top again, unread.
   */
  private async saveOrder(): Promise<void> {
    this.saving.set(true);
    const toast = this.toast.info('Saving order 1042…', { closeAfter: 0, closable: false });
    await wait(1200);
    toast.update({
      text: 'Order 1042 is saved.',
      severity: 'success',
      closeAfter: 4000,
      closable: true,
    });
    this.saving.set(false);
  }
```

```ts
  /**
   * The buttons of a toast belong to its moment: the history keeps the text, not Undo (Show again
   * shows the toast without it).
   */
  private sendOrder(): void {
    this.toast.success('Order 1042 was sent to ACME Ltd.', {
      actions: [
        { label: 'Undo', run: () => this.toast.info('The sending of order 1042 is undone.') },
      ],
    });
  }

  /**
   * "Copied" only says what has just happened. It is worth nothing later, so it stays out of the
   * history (`history: false`). A failure is kept: later the user may want to know why the link is
   * not there.
   */
  private async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${location.origin}/orders/1042`);
      this.toast.success('The link is copied.', { history: false, closeAfter: 2000 });
    } catch {
      this.toast.warning('The browser did not let the page copy the link.');
    }
  }
```

A toast that changes while it is on the screen (`ref.update`, or a new toast with the same `id`) changes its notification. A toast with the same `id` after the first one has gone is a new notification. The others (Import with a title and a detail, Print with an error, Receive with three toasts at once) are plain toasts.

### Step 3: the bell in the toolbar

`src/app/app.ts` makes the toolbar of the same commands, and the bell is its last item:

```ts
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
```

`GrdToastHistoryControl` is the bell as a control of a toolbar (or of a ribbon). `end: true` puts it at the right end of the toolbar, its `label` is its tooltip and what a screen reader says before the number ("Notifications, 4 unread"), and the highest `priority` keeps it in the bar when the window is narrow (the other items go behind the chevron first). `inputs: { max: 20 }` would show only the newest 20 in its panel.

A press opens the panel with the history; the notifications are read when it closes (while it is open, the new ones keep their marks, so the user sees which they are). Esc closes it too, and the focus goes back to the bell. The same bell goes into the header or the menu bar as a tag: `<grd-toast-history-button grdAppHeaderEnd />`, `<grd-toast-history-button grdMenuBarEnd />`.

### Step 4: the history in the menu

The menus are a `computed`, and the View menu has the history as a submenu:

```ts
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
```

`unread` is `this.history.unread()`, read at the start of the `computed`. `menuItems()` gives the newest ten notifications with the icons of their severities (`menuItems({ max: 5 })` for fewer), a separator, Mark all as read and Clear; "No notifications." while there are none. A choice shows the notification as a toast again. An `&` in a notification is a plain `&` there, not the mark of an access key.

### Step 5: the list in the page, and the history in the code

The template has the same history as a list beside the text (under it in a narrow window), and a status bar that reads it and opens it:

```html
<main [class.with-list]="showList()">
  <!-- What this tutorial is about: the first thing on the page. -->
  <app-about />
  @if (showList()) {
  <!-- The same history as a list in the page: the bell and the menu show the same one. -->
  <grd-toast-history-list class="list" />
  }
</main>
<grd-status-bar [items]="statusItems()" />
```

```ts
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
```

`statusChoices()` is the list of `menuItems()` as the choices of an item of a status bar: a press on the item opens them above the bar, and a label is written as it is (no access keys there).

`grd-toast-history-list` is what the panel of the bell shows: every notification with the icon of its severity, its title and text, its time, its detail under Details, a dot while it is unread, Show again (the eye) and Remove (the cross), and above them Mark all as read and Clear. It fits a page, a tab of a docking engine or a dialog. `[max]="5"` shows the newest five, `[heading]="null"` leaves out the heading, `[actions]="false"` the two buttons; `--grd-toast-history-max-height` (60vh here) is how high it grows before it scrolls inside.

The page itself starts with `src/app/about.ts`: what the tutorial is about and what to try, so it is there as soon as the tutorial starts.

## Try it

1. The bell has 1 on it: the welcome toast that came when the page opened. The list on the page has it too, with a dot.
2. Press **Receive**: three toasts at once. Wait until they are gone: the bell says 4.
3. Press **Save** (or Ctrl+S, ⌘S on a Mac): "Saving…" becomes "Saved.", and the list has one notification for it, at the top.
4. Press **Send**, then the eye of its notification in the list: the toast comes again, without Undo, and the history does not grow.
5. Press **Copy link**: the toast says that the link is copied, and the history leaves it out.
6. Open the bell, then close it (a press or Esc): the number goes, and the dots in the list go with it.
7. Open View › Notifications: the same notifications as menu items, then Mark all as read and Clear.
8. Press the bell in the status bar: the same list opens above the bar.

## What you get without writing any of it

- **Screen readers**: the bell says the number in its name ("Notifications, 4 unread"; the red number is only a picture of it), its panel is a dialog named like the bell, and every notification says its severity in words ("Warning. Stock") and "Unread" while it is, so the color, the icon and the dot are not the only way to tell them. The time is a `<time>` with the whole date in its tooltip.
- **The keyboard**: Enter or Space opens the panel, Tab goes through its buttons, Esc closes it and gives the focus back to the bell.
- **The theme, the density and the language**: switch the theme in the header and the bell, the panel and the list change with it; the texts of the library (Notifications, Mark all as read, Clear, Show again, Remove, Details, "No notifications.") are in English, German and Japanese, and the time is written in the language of the application.

## Build it yourself

`npm run tutorial:eject 071 path/to/new-folder` writes this tutorial as an Angular project of its own (see [Make a tutorial a project of its own](../README.md#make-a-tutorial-a-project-of-its-own)). By hand: make the empty application of 070 with the library (steps 1 to 4 of [Build it yourself from scratch](../070-messages/README.md#build-it-yourself-from-scratch)), add `about.ts`, `app-icons.ts` and `order-commands.ts` to `src/app`, and replace `app.ts` and `app.config.ts` with the ones of this tutorial.

## More

- The toasts themselves (the severities, the time, a toast that changes, Undo): [070](../070-messages/README.md).
- The menu bar and the toolbar made of the same commands: [100](../100-menu-toolbar/README.md).
- Everything about the history: the README of the toasts in the library (`src/app/components/ui/toast/README.md`, the section "The history of the notifications") and of the parts that show it (`src/app/components/ui/toast-history/README.md`).
