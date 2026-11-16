import { signal } from '@angular/core';

/** A user of the server, with the password (a real server keeps only a hash of it). */
interface ServerUser {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: string[];
  readonly password: string;
}

const USERS: readonly ServerUser[] = [
  {
    id: 'u-alice',
    name: 'alice',
    displayName: 'Alice Brown',
    email: 'alice@example.com',
    roles: ['editor'],
    password: 'secret',
  },
  {
    id: 'u-tomas',
    name: 'tomas',
    displayName: 'Tomáš Novák',
    email: 'tomas@example.com',
    roles: ['viewer'],
    password: 'secret',
  },
];

/** How long a session lasts, in seconds. */
const LIFETIME = 10 * 60;

/**
 * The cookie of the session. A real server sets it itself (`Set-Cookie`, HttpOnly: no script reads
 * it). The pretend server keeps the name of the user in localStorage instead, so that it lasts
 * across F5 like a cookie.
 */
const COOKIE = 'tutorial-195-cookie';

/** An answer of the server, as fetch gives it. */
function answer(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * The backend of the application, played in the page. It does what a real server does for
 * grdSessionProvider: it answers four addresses, and it has a sign-in page of its own.
 */
export class PretendServer {
  /** Every request that came, the newest first: the tool Requests shows them. */
  readonly log = signal<readonly string[]>([]);
  /** The sign-in page of the server is open (with the address it was opened at), or `null`. */
  readonly page = signal<string | null>(null);

  /** The user of the cookie, or `null`: nobody is signed in. */
  private user(): ServerUser | null {
    const name = localStorage.getItem(COOKIE);
    return USERS.find((user) => user.name === name) ?? null;
  }

  /** What /api/me and /api/refresh answer: who is signed in, and for how long. Never the password. */
  private session(user: ServerUser): unknown {
    const { id, name, displayName, email, roles } = user;
    return { user: { id, name, displayName, email, roles }, expiresIn: LIFETIME };
  }

  /** The requests of the provider come here instead of to the network (the option `fetch`). */
  readonly fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    const user = this.user();
    let response: Response;
    if (
      (method === 'GET' && path === '/api/me') ||
      (method === 'POST' && path === '/api/refresh')
    ) {
      // Who is signed in: 200 with the user, or 401 for nobody.
      response = user ? answer(200, this.session(user)) : answer(401);
    } else if (method === 'POST' && path === '/api/logout') {
      // The end of the session: the server takes the cookie away.
      localStorage.removeItem(COOKIE);
      response = answer(204);
    } else {
      response = answer(404);
    }
    this.write(`${method} ${path} → ${response.status}${user ? ` (${user.name})` : ''}`);
    return response;
  }) as typeof fetch;

  /** The provider sends the browser to the sign-in page of the server (the option `navigate`). */
  readonly navigate = (url: string): void => {
    this.write(`The browser goes to ${url}`);
    this.page.set(url);
  };

  /** The form of the sign-in page: the right password sets the cookie. */
  signIn(name: string, password: string): boolean {
    const user = USERS.find((candidate) => candidate.name === name.trim().toLowerCase());
    if (!user || user.password !== password) return false;
    localStorage.setItem(COOKIE, user.name);
    this.write(`POST /auth/login → 302, the cookie is set (${user.name})`);
    return true;
  }

  /** Where the sign-in page sends the user back: the `returnUrl` it was given. */
  returnUrl(): string {
    const address = new URL(this.page() ?? '/', location.href);
    return address.searchParams.get('returnUrl') ?? '/';
  }

  /** The sign-in page goes away (the user went back to the application). */
  closePage(): void {
    this.page.set(null);
  }

  private write(line: string): void {
    this.log.update((log) => [`${new Date().toLocaleTimeString()}  ${line}`, ...log]);
  }
}

/** The one server of the tutorial. */
export const server = new PretendServer();
