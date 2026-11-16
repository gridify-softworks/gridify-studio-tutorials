/** A message of the inbox. */
export interface Message {
  readonly id: number;
  readonly from: string;
  readonly subject: string;
  readonly text: string;
}

/** The inbox. A real application loads it from its server. */
export const MESSAGES: readonly Message[] = [
  {
    id: 1,
    from: 'Olivia Brown',
    subject: 'The offer for Northwind',
    text: 'Hi, the offer is ready. Can you check the prices before Friday?',
  },
  {
    id: 2,
    from: 'Petr Svoboda',
    subject: 'Meeting on Monday',
    text: 'Ahoj, the meeting moves to 10:00, in the small room.',
  },
  {
    id: 3,
    from: 'Lucas Meyer',
    subject: 'Invoice 1003',
    text: 'Thank you for the invoice. We will pay it this week.',
  },
  {
    id: 4,
    from: 'Emma Wilson',
    subject: 'New photos',
    text: 'The photos of the shop are on the shared drive.',
  },
];
