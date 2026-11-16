/** A row of the grid: a person of a company. */
export interface Person {
  id: number;
  name: string;
  department: string;
  city: string;
  age: number;
  /** A year's salary in euros. */
  salary: number;
  /** The day the person joined the company, an ISO date `yyyy-mm-dd`. */
  hired: string;
  active: boolean;
}

export const DEPARTMENTS = ['Finance', 'HR', 'IT', 'Sales', 'Support'];
export const CITIES = ['Berlin', 'Brno', 'London', 'Prague', 'Vienna'];

const FIRST = ['Anna', 'Peter', 'Jana', 'Tom', 'Eva', 'Martin', 'Lucy', 'Jacob', 'Kate', 'David'];
const LAST = ['Novak', 'Smith', 'Dvorak', 'Brown', 'Black', 'Miller', 'Horak', 'Wagner', 'Marek'];

/**
 * `count` made-up people. They are the same every time: the numbers come from a fixed seed, not from
 * `Math.random()`, so a person keeps the id, the name and the salary after a reload.
 */
export function makePeople(count: number): Person[] {
  let seed = 7;
  const next = (max: number): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return Math.floor((seed / 2 ** 32) * max);
  };
  const people: Person[] = [];
  for (let id = 1; id <= count; id++) {
    const month = String(1 + next(12)).padStart(2, '0');
    const day = String(1 + next(28)).padStart(2, '0');
    people.push({
      id,
      name: `${FIRST[next(FIRST.length)]} ${LAST[next(LAST.length)]}`,
      department: DEPARTMENTS[next(DEPARTMENTS.length)],
      city: CITIES[next(CITIES.length)],
      age: 20 + next(45),
      salary: 30_000 + next(900) * 100,
      hired: `${2010 + next(16)}-${month}-${day}`,
      active: next(5) !== 0,
    });
  }
  return people;
}
