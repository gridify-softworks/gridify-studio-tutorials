import { GrdDemoAuth } from '@gridify/studio';

/**
 * The pretend server of this tutorial (see 190): the accounts of the library (`eva`, `jan`, `petra`
 * and more, all with the password `gridify`) and the session kept across F5.
 */
export const demoServer = new GrdDemoAuth({ storageKey: 'tutorial-197-session' });
