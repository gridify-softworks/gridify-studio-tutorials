import { GrdDemoAuth } from '@gridify/studio';

/**
 * A pretend server, only for the tutorial: two accounts, an answer at once (`latency: 0`), and the session
 * kept in localStorage under `storageKey`, the way a real server keeps a cookie: after F5 it is still there.
 */
export const demoServer = new GrdDemoAuth({
  accounts: [
    {
      username: 'alice',
      password: 'tutorial',
      user: { id: 'alice', name: 'alice', displayName: 'Alice', roles: [] },
    },
    {
      username: 'bob',
      password: 'tutorial',
      user: { id: 'bob', name: 'bob', displayName: 'Bob', roles: [] },
    },
  ],
  latency: 0,
  storageKey: 'tutorial-122-session',
});
