import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial.
 *
 * A real application signs its users in through its own backend. This tutorial has none, so the
 * library's `GrdDemoAuth` plays the server: it knows a few accounts, checks the password, answers
 * after a short pause (350 ms, as a real server would) and keeps the session.
 *
 * - Sign in as `eva` with the password `gridify` (every account of the demo has this password).
 * - `storageKey` keeps the session in `localStorage`, the way a real server keeps a cookie: after F5
 *   you are still signed in. Only a demo does this; a real server keeps the session in an
 *   `HttpOnly` cookie, which no script can read.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-190-session' });
