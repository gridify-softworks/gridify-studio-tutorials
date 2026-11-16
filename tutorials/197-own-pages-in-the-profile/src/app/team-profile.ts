import type { GrdProfile } from '@gridify/studio';

/** Out of office: the last day away (an ISO date, `2026-11-20`) and what the others read meanwhile. */
export interface Away {
  readonly until: string;
  readonly message: string;
}

/**
 * The profile as the server of this application keeps it: the fields of the library (`GrdProfile`:
 * the name to show, the e-mail, the telephone number, the photo) and the fields of the application,
 * which the library does not know. The page Work of the profile shows and changes them.
 */
export interface TeamProfile extends GrdProfile {
  /** The job title (`Accountant`); empty: none. */
  readonly jobTitle: string;
  /** The department, by its id (one of `DEPARTMENTS`). */
  readonly department: string;
  /** Out of office, or `null`. */
  readonly away: Away | null;
}

/** What a save sends: only the fields that changed, of the library and of the application. */
export type TeamProfilePatch = Partial<TeamProfile>;

/** The departments of the company. */
export const DEPARTMENTS = [
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'support', label: 'Customer support' },
  { value: 'it', label: 'IT' },
];

/** The longest job title that the server takes. */
export const JOB_TITLE_MAX = 60;

/** The name of a department. */
export function departmentName(id: string): string {
  return DEPARTMENTS.find((department) => department.value === id)?.label ?? id;
}

/** Today as an ISO date (`2026-11-04`), in the time of the browser. */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
