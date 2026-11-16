/** One line of an invoice. */
export interface InvoiceLine {
  readonly item: string;
  readonly quantity: number;
  readonly price: number;
}

/** An invoice of the pretend data. */
export interface Invoice {
  /** The number of the invoice: it is in the address (`invoice:1001`). */
  readonly id: string;
  readonly customer: string;
  readonly date: string;
  readonly lines: readonly InvoiceLine[];
  /** The note of the invoice: the user edits and saves it. */
  readonly note: string;
}

/** The invoices of the application. A real application loads them from its server. */
const INVOICES: Invoice[] = [
  {
    id: '1001',
    customer: 'Northwind',
    date: '2026-10-02',
    note: 'Deliver to the back door.',
    lines: [
      { item: 'Coffee beans', quantity: 20, price: 12 },
      { item: 'Grinder', quantity: 2, price: 190 },
    ],
  },
  {
    id: '1002',
    customer: 'Contoso',
    date: '2026-10-05',
    note: '',
    lines: [{ item: 'Tea', quantity: 40, price: 6 }],
  },
  {
    id: '1003',
    customer: 'Fabrikam',
    date: '2026-10-11',
    note: '',
    lines: [
      { item: 'Espresso machine', quantity: 1, price: 1450 },
      { item: 'Cups', quantity: 24, price: 4 },
    ],
  },
  {
    id: '1004',
    customer: 'Adventure Works',
    date: '2026-10-17',
    note: '',
    lines: [{ item: 'Milk frother', quantity: 3, price: 85 }],
  },
  {
    id: '1005',
    customer: 'Tailspin Toys',
    date: '2026-10-23',
    note: '',
    lines: [
      { item: 'Hot chocolate', quantity: 15, price: 9 },
      { item: 'Mugs', quantity: 12, price: 7 },
    ],
  },
];

/** All the invoices. */
export function allInvoices(): readonly Invoice[] {
  return INVOICES;
}

/** Saves the note of an invoice (a real application sends it to its server). */
export function saveNote(id: string, note: string): void {
  const index = INVOICES.findIndex((invoice) => invoice.id === id);
  if (index >= 0) INVOICES[index] = { ...INVOICES[index], note };
}

/** The invoice with this number, or `undefined` when there is none. */
export function findInvoice(id: string): Invoice | undefined {
  return INVOICES.find((invoice) => invoice.id === id);
}

/** The total of an invoice: the sum of its lines. */
export function totalOf(invoice: Invoice): number {
  return invoice.lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
}
