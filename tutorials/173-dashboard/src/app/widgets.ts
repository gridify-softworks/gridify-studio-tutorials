import { Component, inject } from '@angular/core';
import { GrdDigitalDisplay, GrdLed, GrdProgressBar, injectGrdWidget } from '@gridify/studio';
import { euro, LiveOrders, MONTHLY_GOAL } from './live-orders';

/** A widget: the number of the orders of today, on a digital display. */
@Component({
  selector: 'app-orders-widget',
  imports: [GrdDigitalDisplay],
  template: `
    <grd-digital-display [value]="live.count()" [digits]="4" />
    <p>orders today</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
    p {
      margin: 4px 0 0;
      opacity: 0.88;
    }
  `,
})
export class OrdersWidget {
  protected readonly live = inject(LiveOrders);
}

/** A widget: the revenue of the month on its way to the goal. */
@Component({
  selector: 'app-revenue-widget',
  imports: [GrdProgressBar],
  template: `
    <grd-progress-bar
      [value]="live.revenue()"
      [max]="goal"
      [label]="euro(live.revenue()) + ' of ' + euro(goal)"
      showValue
    />
  `,
})
export class RevenueWidget {
  protected readonly live = inject(LiveOrders);
  protected readonly goal = MONTHLY_GOAL;
  protected readonly euro = euro;
}

/** A widget: the state of the services, as lights. */
@Component({
  selector: 'app-services-widget',
  imports: [GrdLed],
  template: `
    <grd-led variant="success" label="Web shop" />
    <grd-led variant="success" label="Payments" />
    <!-- A light that blinks catches the eye: the mail server is slow. -->
    <grd-led variant="warning" animation="blink" label="Mail (slow)" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `,
})
export class ServicesWidget {}

/** A widget: the best customers of today. A wide widget shows the amounts too. */
@Component({
  selector: 'app-customers-widget',
  template: `
    <ol>
      @for (entry of live.topCustomers(); track entry[0]) {
        <li>
          <span>{{ entry[0] }}</span>
          <span class="amount">{{ euro(entry[1]) }}</span>
        </li>
      }
    </ol>
    <p class="size">{{ widget.size().w }} × {{ widget.size().h }} cells</p>
  `,
  styles: `
    ol {
      margin: 0;
      padding-left: 1.2em;
    }
    li span {
      margin-right: 8px;
    }
    /* The body of a widget is a container named grd-widget: a narrow widget hides the amounts. */
    .amount {
      display: none;
    }
    @container grd-widget (min-width: 300px) {
      .amount {
        display: inline;
        font-weight: bold;
      }
    }
    .size {
      margin: 8px 0 0;
      opacity: 0.88;
      font-size: 0.85em;
    }
  `,
})
export class CustomersWidget {
  protected readonly live = inject(LiveOrders);
  protected readonly euro = euro;
  /** What the widget knows about its place on the board: its size in cells, among others. */
  protected readonly widget = injectGrdWidget();
}
