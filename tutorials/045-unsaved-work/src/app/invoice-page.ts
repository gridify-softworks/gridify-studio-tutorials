import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, type OnInit, signal } from '@angular/core';
import { GrdButton, GrdTabContext, GrdTextarea } from '@gridify/studio';
import { findInvoice, saveNote, totalOf } from './invoices';

/**
 * A document: one invoice, with a note the user edits and saves. While the note differs from the
 * saved one, the tab has the mark of unsaved changes: the engine tells it to `GrdUnsavedWork`,
 * and the application asks before the note would be lost (app.config.ts).
 */
@Component({
  selector: 'app-invoice-page',
  imports: [CurrencyPipe, GrdButton, GrdTextarea],
  template: `
    @if (invoice(); as invoice) {
      <h2>Invoice {{ invoice.id }}</h2>
      <p>{{ invoice.customer }}, {{ invoice.date }}</p>
      <table>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
        @for (line of invoice.lines; track line.item) {
          <tr>
            <td>{{ line.item }}</td>
            <td>{{ line.quantity }}</td>
            <td>{{ line.price | currency: 'EUR' }}</td>
            <td>{{ line.quantity * line.price | currency: 'EUR' }}</td>
          </tr>
        }
        <tr>
          <th colspan="3">Total</th>
          <th>{{ total() | currency: 'EUR' }}</th>
        </tr>
      </table>
      <grd-textarea label="Note" [rows]="3" [value]="note()" (valueChange)="edit($event)" />
      <p class="actions">
        <grd-button label="Save" [disabled]="!changed()" (pressed)="save()" />
        <grd-button label="Revert" [disabled]="!changed()" (pressed)="revert()" />
        <span class="state">{{ changed() ? 'Unsaved changes' : 'Saved' }}</span>
      </p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    h2 {
      margin: 0 0 4px;
    }
    table {
      border-collapse: collapse;
      margin: 12px 0;
    }
    th,
    td {
      padding: 4px 12px 4px 0;
      text-align: left;
      border-bottom: 1px solid var(--grd-border-color);
    }
    grd-textarea {
      max-width: 480px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .state {
      opacity: 0.88;
    }
  `,
})
export class InvoicePage implements OnInit {
  /** The number of the invoice: the input that the resolver of the bridge gives the tab. */
  readonly id = input.required<string>();

  /** The tab this page is in: it carries the mark of unsaved changes. */
  private readonly tab = inject(GrdTabContext);
  protected readonly invoice = computed(() => findInvoice(this.id()));
  protected readonly total = computed(() => {
    const invoice = this.invoice();
    return invoice ? totalOf(invoice) : 0;
  });

  /** The saved note, and the note as the user is writing it. */
  private readonly saved = signal('');
  protected readonly note = signal('');
  protected readonly changed = computed(() => this.note() !== this.saved());

  ngOnInit(): void {
    const note = this.invoice()?.note ?? '';
    this.saved.set(note);
    this.note.set(note);
  }

  protected edit(note: string): void {
    this.note.set(note);
    // The mark of unsaved changes of the tab: a dot after its title, and the unsaved work of the
    // application (the browser and the Back button ask while it is there).
    this.tab.setDirty(this.changed());
  }

  protected save(): void {
    saveNote(this.id(), this.note());
    this.saved.set(this.note());
    this.tab.setDirty(false);
  }

  protected revert(): void {
    this.note.set(this.saved());
    this.tab.setDirty(false);
  }
}
