import { signal } from '@angular/core';
import type { GrdDictionary } from '@gridify/studio';

/** How the pretend network brings a dictionary: at once, after 3 seconds, or not at all. */
export type Network = 'fast' | 'slow' | 'offline';

/** Where the choice of the network is kept, so that F5 starts on the same network. */
const NETWORK_KEY = 'tutorial-134-network';

/** The network the dictionaries come over now (the Network menu changes it). */
export const network = signal<Network>(readNetwork());

/** The languages whose dictionary has arrived, in the order they came (the status bar shows them). */
export const fetched = signal<readonly string[]>([]);

export function setNetwork(value: Network): void {
  network.set(value);
  try {
    localStorage.setItem(NETWORK_KEY, value);
  } catch {
    // A blocked storage: the network is not remembered.
  }
}

/**
 * A loader of a dictionary for `register(language, loader)`. The `import()` is real: the bundler
 * makes the module a chunk of its own, and the browser fetches it the first time the loader runs.
 * The pretend network only waits before it (slow) or fails instead of it (offline).
 */
export function overNetwork(
  language: string,
  load: () => Promise<{ default: GrdDictionary }>,
): () => Promise<{ default: GrdDictionary }> {
  return async () => {
    if (network() === 'slow') await new Promise((resolve) => setTimeout(resolve, 3000));
    if (network() === 'offline')
      throw new Error(`No network: the dictionary "${language}" did not come.`);
    const module = await load();
    fetched.update((list) => [...list, language]);
    return module;
  };
}

function readNetwork(): Network {
  try {
    const value = localStorage.getItem(NETWORK_KEY);
    return value === 'slow' || value === 'offline' ? value : 'fast';
  } catch {
    return 'fast';
  }
}
