import { Component, inject } from '@angular/core';
import { GrdMenuItem, grdMenuItemOf, grdParseAccessKey, GrdPopupMenu } from '@gridify/studio';
import { NoteCommands } from './commands';

/**
 * A tool of the engine, docked on the right: the whole panel is one button that opens a popup menu. A click and the right mouse button open it at the
 * pointer; Enter, Space and the Menu key (the button has the focus) open it in the corner of the panel, with the first item highlighted.
 */
@Component({
  selector: 'app-popup-tool',
  template: `
    <button type="button" class="target" (click)="show($event)" (contextmenu)="show($event)">
      Click here to show the popup menu
    </button>
  `,
  styles: `
    :host {
      display: flex;
      height: 100%;
      box-sizing: border-box;
      padding: 8px;
    }
    .target {
      flex: 1;
      border: 1px dashed var(--grd-border-color);
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: context-menu;
    }
    .target:hover {
      background: color-mix(in srgb, var(--grd-accent) 8%, transparent);
    }
    .target:focus-visible {
      outline: 2px solid var(--grd-accent);
      outline-offset: -2px;
    }
  `,
})
export class PopupTool {
  private readonly popup = inject(GrdPopupMenu);
  private readonly commands = inject(NoteCommands);

  /**
   * The items: commands of the application (the same ones as in the menu bar and the toolbar), a check mark, a submenu, separators and an item that is
   * greyed out. They are made when the menu opens, so they say the state of that moment. A shortcut is only shown: the menu bar runs it.
   */
  private items(): GrdMenuItem[] {
    const commands = this.commands;
    return [
      { label: 'Notes', header: true },
      grdMenuItemOf(commands.newDocument),
      grdMenuItemOf(commands.save),
      { separator: true },
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
      grdMenuItemOf(commands.wrapLines),
      { separator: true },
      // Greyed out: there is no printing in this tutorial. It cannot be highlighted or chosen.
      { label: '&Print…', shortcut: 'Mod+P', enabled: false },
      grdMenuItemOf(commands.close),
    ];
  }

  /**
   * Opens the menu at the event (`at: event`). A press of the mouse opens it at the pointer. Enter and Space on the button and the Menu key or Shift+F10
   * have no pointer: the popup menu sees that in the event and opens as from the keyboard, in the corner of the panel (it is a large element; under a
   * small one) with the first item highlighted. Then the status bar says what was chosen.
   */
  protected async show(event: MouseEvent): Promise<void> {
    event.preventDefault();
    const ref = this.popup.open(this.items(), { at: event, ariaLabel: 'Notes' });
    const chosen = await ref.closed;
    if (chosen?.label) this.commands.say(`Popup menu: ${grdParseAccessKey(chosen.label).text}.`);
  }
}
