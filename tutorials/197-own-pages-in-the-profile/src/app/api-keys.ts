import { Injectable } from '@angular/core';
import { demoServer } from './demo-server';

/** A key of the API as the user sees it. The secret itself is shown once, when the key is made. */
export interface ApiKey {
  readonly id: string;
  /** What the user called it (`Nightly export`). */
  readonly name: string;
  /** The start of the secret, so that the user knows which key it is (`gk_3f9a`). */
  readonly start: string;
  /** When it was made (milliseconds since 1970). */
  readonly created: number;
}

/** A key that was just made: the only answer of the server that has its secret. */
export interface NewApiKey {
  readonly key: ApiKey;
  readonly secret: string;
}

/** The most keys that a user may have (the rule of the server). */
export const KEYS_MAX = 3;

/** The keys that the pretend server keeps, by the id of the user (in memory: F5 starts again). */
const kept = new Map<string, ApiKey[]>();

/** A pause as long as a request to a server takes. */
const serverPause = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The keys of the API of the signed-in user: data of the application that is not the profile (it
 * has requests of its own), so a service of the application loads and changes it, not the store
 * of the profile. The page "API keys" of the profile uses it.
 *
 * This one plays the server in the browser, like the store. A real one calls the server with
 * HttpClient: the request is in the comment of each method.
 */
@Injectable({ providedIn: 'root' })
export class ApiKeys {
  /** GET /api/keys: the keys of the user who asks. */
  async list(): Promise<readonly ApiKey[]> {
    await serverPause();
    return this.keysOf(this.whoAsks());
  }

  /** POST /api/keys with `{ name }`: a new key, with its secret. */
  async create(name: string): Promise<NewApiKey> {
    await serverPause();
    const user = this.whoAsks();
    const keys = this.keysOf(user);
    // The server keeps its own rule: the page knows it too, but only to say it before a trip.
    if (keys.length >= KEYS_MAX) throw { status: 409, message: `There may be ${KEYS_MAX} keys.` };
    const secret = `gk_${randomHex(24)}`;
    const key: ApiKey = { id: randomHex(8), name, start: secret.slice(0, 7), created: Date.now() };
    kept.set(user, [...keys, key]);
    // A real server keeps only a hash of the secret: after this answer nobody can read it again.
    return { key, secret };
  }

  /** DELETE /api/keys/{id}: the key stops working at once. */
  async revoke(id: string): Promise<void> {
    await serverPause();
    const user = this.whoAsks();
    kept.set(
      user,
      this.keysOf(user).filter((key) => key.id !== id),
    );
  }

  /** Who asks, by the id of the user: the server knows it from its session. Nobody: 401. */
  private whoAsks(): string {
    const account = demoServer.signedAccount();
    if (!account) throw { status: 401 };
    return account.user.id;
  }

  private keysOf(user: string): readonly ApiKey[] {
    return kept.get(user) ?? [];
  }
}

/** `length` random hexadecimal digits. */
function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}
