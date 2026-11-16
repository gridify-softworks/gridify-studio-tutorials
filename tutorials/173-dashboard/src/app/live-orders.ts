import { computed, Injectable, signal } from '@angular/core';

/** An order that came in. */
export interface Order {
  readonly id: number;
  readonly customer: string;
  readonly amount: number;
  readonly time: string;
}

const CUSTOMERS = [
  'Northwind',
  'Contoso',
  'Fabrikam',
  'Kavárna Slavia',
  'Tailspin Toys',
  'Adventure Works',
];

/** The goal of the month in euros: the progress bar of the dashboard goes towards it. */
export const MONTHLY_GOAL = 50_000;

/**
 * A pretend live feed: a new order comes every three seconds, as if a server pushed it. The
 * widgets and the tool read the same signals, so they all change together.
 */
@Injectable({ providedIn: 'root' })
export class LiveOrders {
  private nextId = 1001;

  /** The orders of today, the newest first. */
  readonly orders = signal<readonly Order[]>([]);
  /** The revenue of the month before today. */
  private readonly earlier = 31_250;

  readonly count = computed(() => this.orders().length);
  readonly revenue = computed(
    () => this.earlier + this.orders().reduce((sum, order) => sum + order.amount, 0),
  );
  /** The customers with the most money today, the first three. */
  readonly topCustomers = computed(() => {
    const totals = new Map<string, number>();
    for (const order of this.orders())
      totals.set(order.customer, (totals.get(order.customer) ?? 0) + order.amount);
    return [...totals].sort((a, b) => b[1] - a[1]).slice(0, 3);
  });

  constructor() {
    // Three orders at the start, then one every three seconds.
    for (let i = 0; i < 3; i++) this.arrive();
    setInterval(() => this.arrive(), 3000);
  }

  private arrive(): void {
    const order: Order = {
      id: this.nextId++,
      customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      amount: 50 + Math.round(Math.random() * 450),
      time: new Date().toLocaleTimeString(),
    };
    this.orders.update((orders) => [order, ...orders]);
  }
}

/** Money as text: €1,250. */
export function euro(amount: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}
