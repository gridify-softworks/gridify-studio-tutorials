import { Component, computed, inject } from '@angular/core';
import { OrderStore } from './order';

const money = new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' });

/** A tool: the order at a glance. It reads the same store as the document, so it follows every change. */
@Component({
  selector: 'app-summary-tool',
  template: `
    <dl>
      <dt>Customer</dt>
      <dd>{{ order.customer() || '—' }}</dd>
      <dt>Items</dt>
      <dd>{{ order.lines().length }} lines, {{ order.pieces() }} pieces</dd>
      <dt>Total</dt>
      <dd class="total">{{ total() }}</dd>
      <dt>Saved</dt>
      <dd>{{ saved() }}</dd>
      <dt>Document made</dt>
      <dd>{{ order.documentsMade() }}×</dd>
    </dl>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px;
    }
    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 12px;
      margin: 0;
    }
    dt {
      /* the text color a little fainter (88 %), so it keeps its contrast in every theme */
      opacity: 0.88;
    }
    dd {
      margin: 0;
    }
    .total {
      font-weight: 600;
    }
  `,
})
export class SummaryTool {
  protected readonly order = inject(OrderStore);
  protected readonly total = computed(() => money.format(this.order.total()));
  protected readonly saved = computed(() => {
    if (this.order.changed()) return 'Unsaved changes';
    const at = this.order.savedAt();
    return at ? `Saved at ${at}` : 'Nothing changed';
  });
}
