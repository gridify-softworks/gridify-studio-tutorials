import { signal } from '@angular/core';
import {
  grdGridActiveFilterEntries,
  grdGridCompareRows,
  grdGridCompileFilter,
  grdGridDistinctOptions,
  tkx,
  type GrdGridAggregateValues,
  type GrdGridFilter,
  type GrdGridFilterOption,
  type GrdGridRemoteAggregateParams,
  type GrdGridRemoteFetchParams,
  type GrdGridRemoteFetchResult,
  type GrdGridRemoteFilterOptionsParams,
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
  /** While it is on, the server counts the rows (`COUNT(*)`) and tells the grid how many there are. */
  readonly countsRows = signal(true);
  /** How many requests came: for pages, for the totals, for the values of a filter. */
  readonly requests = signal(0);
  readonly totalsRequests = signal(0);
  readonly valuesRequests = signal(0);
  /** The last request for a page, as a short text. */
  readonly lastRequest = signal('nothing yet');

  private readonly people = makePeople(20_000);

  /** One page: the rows `[start, end)` of the people that pass the filters, in the order of the sorting. */
  async fetchPage(params: GrdGridRemoteFetchParams): Promise<GrdGridRemoteFetchResult<Person>> {
    this.requests.update((count) => count + 1);
    this.lastRequest.set(describe(params));
    await this.wait(params.signal);
    const found = this.select(params.filters, params.sorts);
    const page = {
      rows: found.slice(params.start, params.end),
      isLast: params.end >= found.length,
    };
    // Without the count the grid learns the length of the table only at the last page.
    if (!this.countsRows()) return page;
    return { ...page, exactTotalCount: found.length, unfilteredTotalCount: this.people.length };
  }

  /** The totals row: the sum, the average, the minimum or the maximum of a column, after the filters. */
  async fetchTotals(params: GrdGridRemoteAggregateParams): Promise<GrdGridAggregateValues> {
    this.totalsRequests.update((count) => count + 1);
    await this.wait();
    const found = this.select(params.filters, []);
    const totals: GrdGridAggregateValues = {};
    for (const { field, kinds } of params.request) {
      const values = found.map((person) => Number(person[field as keyof Person]));
      const sum = values.reduce((total, value) => total + value, 0);
      const avg = values.length ? sum / values.length : null;
      const all = { sum, avg, min: Math.min(...values), max: Math.max(...values) };
      totals[field] = Object.fromEntries(kinds.map((kind) => [kind, all[kind]]));
    }
    return totals;
  }

  /** The values of a column with the number of their rows, under the filters of the other columns. */
  async fetchValues(params: GrdGridRemoteFilterOptionsParams): Promise<GrdGridFilterOption[]> {
    this.valuesRequests.update((count) => count + 1);
    await this.wait(params.signal);
    const values = this.select(params.filters, []).map((p) => p[params.field as keyof Person]);
    return grdGridDistinctOptions(values, { text: tkx });
  }

  /** The work of the database: WHERE (the filters) and ORDER BY (the sorting). */
  private select(
    filters: Record<string, GrdGridFilter>,
    sorts: GrdGridRemoteFetchParams['sorts'],
  ): Person[] {
    const tests = grdGridActiveFilterEntries(filters).map(([field, filter]) => ({
      field: field as keyof Person,
      test: grdGridCompileFilter(filter),
    }));
    const found = this.people.filter((person) => tests.every((t) => t.test(person[t.field])));
    const compare = grdGridCompareRows<Person>(sorts, 'en', SORT_TYPES);
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

/** `rows 100–150, sorted by salary ↓, 2 filters` */
function describe(params: GrdGridRemoteFetchParams): string {
  const parts = [`rows ${params.start}–${params.end}`];
  const sorts = params.sorts.map((sort) => `${sort.field} ${sort.direction === 'asc' ? '↑' : '↓'}`);
  if (sorts.length) parts.push(`sorted by ${sorts.join(', ')}`);
  const filters = grdGridActiveFilterEntries(params.filters).length;
  if (filters) parts.push(filters === 1 ? '1 filter' : `${filters} filters`);
  return parts.join(', ');
}
