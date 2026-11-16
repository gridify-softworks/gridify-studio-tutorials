import { Component, signal } from '@angular/core';
import {
  GrdAppHeader,
  GrdButton,
  GrdDropdownButton,
  GrdGroupBox,
  type GrdMenuItem,
  GrdSplitButton,
  GrdToggleGroup,
  type GrdToggleOption,
} from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdDropdownButton,
    GrdGroupBox,
    GrdSplitButton,
    GrdToggleGroup,
  ],
  template: `
    <grd-app-header
      productName="Buttons"
      subtitle="variants, icons, toggles, busy, split and dropdown buttons"
      icon="grd:logo"
      preferences="theme density"
    />
    <main>
      <div class="page">
        <p>
          Press the buttons with the mouse, or reach them with Tab and press Enter or Space. The box
          at the bottom tells what the code was told.
        </p>

        <div class="boxes">
          <grd-group-box heading="Variants" icon="grd:component" gap="12px">
            <div class="actions">
              <grd-button label="Default" (pressed)="log('Default')" />
              <grd-button label="Primary" variant="primary" (pressed)="log('Primary')" />
              <grd-button label="Success" variant="success" (pressed)="log('Success')" />
              <grd-button label="Warning" variant="warning" (pressed)="log('Warning')" />
              <grd-button label="Danger" variant="danger" (pressed)="log('Danger')" />
            </div>
            <div class="actions">
              <grd-button label="Flat" appearance="flat" (pressed)="log('Flat')" />
              <grd-button
                label="Flat primary"
                appearance="flat"
                variant="primary"
                (pressed)="log('Flat primary')"
              />
              <grd-button label="Disabled" disabled />
            </div>
          </grd-group-box>

          <grd-group-box heading="Icons" icon="grd:document" gap="12px">
            <div class="actions">
              <grd-button label="Save" icon="app:save" variant="primary" (pressed)="log('Save')" />
              <grd-button
                label="Delete"
                icon="app:trash"
                variant="danger"
                (pressed)="log('Delete')"
              />
              <grd-button label="Add" icon="grd:plus" iconOnly (pressed)="log('Add')" />
              <grd-button
                label="Remove"
                icon="grd:minus"
                iconOnly
                tooltip="Remove the last line (Del)"
                (pressed)="log('Remove')"
              />
            </div>
            <div class="actions">
              <grd-button
                label="Upload a file"
                icon="app:upload"
                layout="column"
                [busy]="uploading()"
                (pressed)="upload()"
              />
            </div>
          </grd-group-box>

          <grd-group-box heading="Toggles" icon="grd:tool" gap="12px">
            <div class="actions">
              <grd-button label="Bold" icon="app:bold" iconOnly toggle [(checked)]="bold" />
              <grd-button label="Italic" icon="app:italic" iconOnly toggle [(checked)]="italic" />
              <grd-toggle-group
                ariaLabel="Alignment"
                iconOnly
                [options]="alignments"
                [(value)]="alignment"
              />
            </div>
            <p
              class="sample"
              [style.text-align]="alignment()"
              [style.font-weight]="bold() ? 'bold' : null"
              [style.font-style]="italic() ? 'italic' : null"
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </grd-group-box>

          <grd-group-box heading="Menus" icon="grd:chevrons">
            <div class="actions">
              <grd-split-button
                label="Save"
                icon="app:save"
                variant="primary"
                [items]="saveItems"
                (pressed)="log('Save')"
              />
              <grd-dropdown-button
                label="New"
                icon="grd:plus"
                [items]="newItems"
                (itemInvoked)="create($event)"
              />
            </div>
          </grd-group-box>
        </div>

        <grd-group-box heading="What the code was told">
          <div class="log">
            @for (entry of entries(); track $index) {
              <div>{{ entry }}</div>
            } @empty {
              Nothing yet.
            }
          </div>
        </grd-group-box>
      </div>
    </main>
  `,
  styles: `
    .log {
      font-family: var(--grd-font-mono);
    }
    .sample {
      margin: 0;
      padding: 8px 10px;
      border: 1px dashed var(--grd-border-color);
      border-radius: 6px;
    }
  `,
})
export class App {
  protected readonly entries = signal<string[]>([]);

  // A toggle button keeps its state in [(checked)]; a toggle group in [(value)].
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly alignment = signal<string | null>('left');
  protected readonly alignments: GrdToggleOption<string>[] = [
    { value: 'left', label: 'Align left', icon: 'app:align-left' },
    { value: 'center', label: 'Center', icon: 'app:align-center' },
    { value: 'right', label: 'Align right', icon: 'app:align-right' },
  ];

  /** The menu of the split button: each item runs its own command. */
  protected readonly saveItems: GrdMenuItem[] = [
    { label: 'Save as…', run: () => this.log('Save as…') },
    { label: 'Save a copy', run: () => this.log('Save a copy') },
    { separator: true },
    { label: 'Export as PDF', run: () => this.log('Export as PDF') },
  ];

  /** The menu of the dropdown button: the items have no run, the button tells which one was chosen (itemInvoked). */
  protected readonly newItems: GrdMenuItem[] = [
    { id: 'document', label: 'Document' },
    { id: 'sheet', label: 'Spreadsheet' },
    { id: 'slides', label: 'Presentation' },
  ];

  protected create(item: GrdMenuItem): void {
    this.log(`New ${item.label}`);
  }

  /** A button that waits for its work is busy: it shows a ring and takes no clicks. */
  protected readonly uploading = signal(false);

  protected async upload(): Promise<void> {
    this.uploading.set(true);
    this.log('Upload started');
    await new Promise((done) => setTimeout(done, 1500));
    this.uploading.set(false);
    this.log('Upload finished');
  }

  /** The newest line first, at most six. */
  protected log(text: string): void {
    const time = new Date().toLocaleTimeString();
    this.entries.update((lines) => [`${time}  ${text}`, ...lines].slice(0, 6));
  }
}
