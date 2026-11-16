import { signal } from '@angular/core';
import {
  grdGridActiveFilterEntries,
  grdGridCompareRows,
  grdGridCompileFilter,
  type GrdGridRemoteFetchParams,
  type GrdGridRemoteFetchResult,
  type GrdGridSortColumn,
} from '@gridify/studio';
import { makePeople, type Person } from './people';

/** The types of the fields the server sorts: numbers as numbers, dates as dates, the rest as text. */
const SORT_TYPES: GrdGridSortColumn[] = [
  { field: 'id', type: 'number' },
  { field: 'age', type: 'number' },
  { field: 'salary', type: 'number' },
  { field: 'hired', type: 'date' },
  { field: 'active', type: 'boolean' },
];

/**
 * A pretend server in the page. It holds 20 000 people and answers the questions of the grid the way an
 * API over a database would: a page of rows after the filters and the sorting. A real application asks
 * its API here instead, with `fetch(url, { signal })`.
 */
export class PeopleServer {
  /** How long the server thinks before it answers, in ms. */
  readonly delay = signal(300);
  /** While it is on, every answer is an error. */
  readonly failing = signal(false);
  /** How many changes the grid sent to be saved. */
  readonly saves = signal(0);

  private readonly people = makePeople(20_000);

  /** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
  async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
    await this.wait(params.signal);
    const found = this.select(params);
    return {
      rows: found.slice(params.start, params.end),
      isLast: params.end >= found.length,
      // The server counts the rows, so the grid knows how long the table is at once.
      exactTotalCount: found.length,
      unfilteredTotalCount: this.people.length,
    };
  }

  /** Keeps a change of one person, after the wait. It fails while `failing` is on. */
  async save(id: number, change: Partial<Person>): Promise<void> {
    this.saves.update((count) => count + 1);
    await this.wait();
    const index = this.people.findIndex((person) => person.id === id);
    if (index < 0) throw new Error(`No person ${id}`);
    this.people[index] = { ...this.people[index], ...change };
  }

  /** The work of the database: WHERE (the filters) and ORDER BY (the sorting). */
  private select(params: GrdGridRemoteFetchParams): Person[] {
    const tests = grdGridActiveFilterEntries(params.filters).map(([field, filter]) => ({
      field: field as keyof Person,
      test: grdGridCompileFilter(filter),
    }));
    const found = this.people.filter((person) => tests.every((t) => t.test(person[t.field])));
    const compare = grdGridCompareRows<Person>(params.sorts, 'en', SORT_TYPES);
    return compare ? found.sort(compare) : found;
  }

  /** The time the server takes, or its error. A request the grid stops (aborts) ends at once. */
  private wait(abort?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const stop = () => {
        clearTimeout(timer);
        reject(abort?.reason);
      };
      const timer = setTimeout(() => {
        abort?.removeEventListener('abort', stop);
        if (this.failing()) reject(new Error('The server does not answer'));
        else resolve();
      }, this.delay());
      abort?.addEventListener('abort', stop, { once: true });
    });
  }
}
