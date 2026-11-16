import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190), with a short session so that you see it end: two
 * minutes instead of the usual 30. Sign in as `eva` (or any account of 191) with the password
 * `gridify`.
 */
export const demoServer = new GrdDemoAuth({
  storageKey: 'tutorial-193-session',
  lifetime: 2 * 60_000,
});
