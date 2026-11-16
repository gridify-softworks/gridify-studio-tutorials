/** An account to try, and what it shows. */
export interface Try {
  /** How to sign in (the form, and what to type). */
  how: string;
  /** What happens. */
  what: string;
}

/** The accounts of the pretend server, and the step each one shows. All have the password `gridify`. */
export const TRIES: Try[] = [
  { how: 'eva', what: 'Signs in at once: no step.' },
  { how: 'otto', what: 'A second factor: asks for a one-time code. The code is 123456.' },
  {
    how: 'lena',
    what: 'Her password is old: she has to set a new one (8 characters or more), twice.',
  },
  { how: 'zora', what: 'Has to accept the terms of use first.' },
  { how: 'karel', what: 'His account is locked: no way in.' },
  { how: 'jan, a wrong password three times', what: 'The third try locks the account.' },
  {
    how: 'The tab Company directory: marta in CORP, david in LAB',
    what: 'A name in a company directory: the form asks for the domain too.',
  },
  {
    how: 'The button Continue with Demo ID',
    what: 'Goes to the identity provider and back. The pretend one signs Eva in at once.',
  },
];
