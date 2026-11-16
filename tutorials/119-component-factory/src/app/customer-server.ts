import { computed, Injectable, signal } from '@angular/core';

/** A customer, as the server sends it. */
export interface Customer {
  id: number;
  name: string;
  company: string;
  city: string;
  since: number;
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Ada Lovelace', company: 'Analytical Engines Ltd.', city: 'London', since: 2019 },
  { id: 2, name: 'Grace Hopper', company: 'Compiler Works', city: 'Arlington', since: 2021 },
  { id: 3, name: 'Alan Turing', company: 'Bombe & Co.', city: 'Manchester', since: 2023 },
];

/** Where the switch "Server online" is kept, so that it is the same after a reload. */
const OFFLINE_KEY = 'tutorial-119-server-offline';

/**
 * A fake server, so that the tutorial runs without a backend: it answers after a moment, and it can be switched off.
 * In an application this is a service that calls your API (with `HttpClient` or `fetch`).
 */
@Injectable({ providedIn: 'root' })
export class CustomerServer {
  readonly customers = CUSTOMERS;
  private readonly offline = signal(localStorage.getItem(OFFLINE_KEY) === 'yes');
  /** Does the server answer? */
  readonly online = computed(() => !this.offline());

  setOnline(online: boolean): void {
    this.offline.set(!online);
    if (online) localStorage.removeItem(OFFLINE_KEY);
    else localStorage.setItem(OFFLINE_KEY, 'yes');
  }

  /** Asks for one customer. It takes 800 ms; `signal` stops the request when the tab is closed meanwhile. */
  async customer(id: number, signal: AbortSignal): Promise<Customer> {
    await wait(800, signal);
    if (this.offline()) throw new Error('The server does not answer.');
    const customer = CUSTOMERS.find((candidate) => candidate.id === id);
    if (!customer) throw new Error(`There is no customer ${id}.`);
    return customer;
  }
}

/** Waits, or fails at once when `signal` is aborted (the tab was closed). */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Aborted.'));
    });
  });
}
