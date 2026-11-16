import { Component, inject } from '@angular/core';
import { euro, LiveOrders } from './live-orders';

/** A tool: the orders as they come in, the newest first. */
@Component({
  selector: 'app-feed-tool',
  template: `
    @for (order of live.orders(); track order.id) {
      <div class="row">
        <span class="time">{{ order.time }}</span>
        <span>{{ order.customer }}</span>
        <span class="amount">{{ euro(order.amount) }}</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 8px 12px;
    }
    .row {
      display: flex;
      gap: 8px;
      padding: 3px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
    .time {
      opacity: 0.88;
    }
    .amount {
      margin-left: auto;
      font-weight: bold;
    }
  `,
})
export class FeedTool {
  protected readonly live = inject(LiveOrders);
  protected readonly euro = euro;
}
