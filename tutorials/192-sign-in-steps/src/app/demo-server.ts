import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190). Its accounts show the steps a sign-in can take; the
 * table on the page lists them. Every account has the password `gridify`.
 *
 * The session is kept across F5 (`storageKey`). The rest of the server lives in memory: after F5 a
 * locked account is open again, Lena has her old password and Zora has not accepted the terms yet,
 * so every step can be tried again.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-192-session' });
