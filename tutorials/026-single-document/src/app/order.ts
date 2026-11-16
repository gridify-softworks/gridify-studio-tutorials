import { computed, Injectable, signal } from '@angular/core';

/** One line of the order: an item, how many, the price of one, and what they cost together. */
export interface OrderLine {
  id: number;
  item: string;
  quantity: number;
  price: number;
  amount: number;
}

/** The order as it is saved: the customer, the date and the lines. */
interface SavedOrder {
  customer: string;
  date: string;
  lines: OrderLine[];
}

/** Where the order is kept in localStorage (the layout has a key of its own). */
const STORAGE_KEY = 'tutorial-026-document';

/** The order of the first start, before anything is saved. */
const SAMPLE: SavedOrder = {
  customer: 'Alice Brown',
  date: '2026-11-02',
  lines: [
    { id: 1, item: 'Desk lamp', quantity: 2, price: 39.9, amount: 79.8 },
    { id: 2, item: 'Office chair', quantity: 1, price: 189, amount: 189 },
    { id: 3, item: 'Notebook A5', quantity: 10, price: 3.5, amount: 35 },
    { id: 4, item: 'Monitor stand', quantity: 1, price: 49, amount: 49 },
    { id: 5, item: 'USB-C cable', quantity: 3, price: 12.9, amount: 38.7 },
  ],
};

const round = (value: number): number => Math.round(value * 100) / 100;
const time = (): string => new Date().toLocaleTimeString('en-GB');

/**
 * The document of the application: one order. It lives here, in a service, and not in the component that shows it: the component fills the empty
 * document area of the engine, which is not a tab, so the engine neither saves it with the layout nor marks it as changed.
 */
@Injectable({ providedIn: 'root' })
export class OrderStore {
  readonly customer = signal('');
  readonly date = signal('');
  readonly lines = signal<OrderLine[]>([]);
  /** Something changed since the last save. */
  readonly changed = signal(false);
  /** The time of the last save while the page runs. */
  readonly savedAt = signal<string | null>(null);
  /** How many times the component of the document was made: the engine makes it once and keeps it. */
  readonly documentsMade = signal(0);
  /** What happened, the newest first. */
  readonly log = signal<string[]>([]);

  readonly pieces = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() => round(this.lines().reduce((sum, line) => sum + line.amount, 0)));

  constructor() {
    const saved = this.read();
    const order = saved ?? SAMPLE;
    this.customer.set(order.customer);
    this.date.set(order.date);
    this.lines.set(order.lines);
    this.write(saved ? 'The saved order is open' : 'A sample order is open (nothing saved yet)');
  }

  setCustomer(customer: string): void {
    this.customer.set(customer);
    this.changed.set(true);
  }

  setDate(date: string): void {
    this.date.set(date);
    this.changed.set(true);
  }

  /** A new quantity of a line: its amount follows. */
  setQuantity(id: number, quantity: number | null): void {
    const pieces = quantity ?? 0;
    this.lines.update((lines) =>
      lines.map((line) =>
        line.id === id ? { ...line, quantity: pieces, amount: round(pieces * line.price) } : line,
      ),
    );
    this.changed.set(true);
    const line = this.lines().find((one) => one.id === id);
    this.write(`${line?.item}: ${pieces} pieces`);
  }

  /** File › Save: the whole order under its own key. */
  save(): void {
    const order: SavedOrder = { customer: this.customer(), date: this.date(), lines: this.lines() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      this.write('The order could not be saved (localStorage is off or full)');
      return;
    }
    this.changed.set(false);
    this.savedAt.set(time());
    this.write('The order is saved');
  }

  /** The component of the document tells that it was made. */
  documentMade(): void {
    this.documentsMade.update((count) => count + 1);
    this.write(`The document component is made (${this.documentsMade()}×)`);
  }

  /** A line of the log. */
  write(text: string): void {
    this.log.update((lines) => [`${time()}  ${text}`, ...lines].slice(0, 50));
  }

  private read(): SavedOrder | null {
    try {
      const text = localStorage.getItem(STORAGE_KEY);
      return text ? (JSON.parse(text) as SavedOrder) : null;
    } catch {
      return null;
    }
  }
}
