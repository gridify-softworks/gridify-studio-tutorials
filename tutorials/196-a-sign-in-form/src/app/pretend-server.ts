import { signal } from '@angular/core';

/** A user of the server, with the password (a real server keeps only a hash of it). */
interface ServerUser {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly email: string;
  readonly roles: string[];
  readonly password: string;
  /** After the password, the server asks for a code of a second factor. */
  readonly secondFactor?: boolean;
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
    secondFactor: true,
  },
];

/** The code of the second factor. A real one comes from an app of the user and changes. */
const CODE = '123456';
/** How long a session lasts, in seconds. */
const LIFETIME = 10 * 60;
/** Three wrong passwords for a name lock it for 30 seconds. */
const ATTEMPTS = 3;
const LOCK = 30;
/** How long the ticket of a second step is good for, in seconds. */
const TICKET_LIFETIME = 5 * 60;

/**
 * The cookie of the session. A real server sets it itself, in the answer of the sign-in
 * (`Set-Cookie`, HttpOnly: no script reads it). The pretend server keeps the name of the user in
 * localStorage instead, so that it lasts across F5 like a cookie.
 */
const COOKIE = 'tutorial-196-cookie';

/** An answer of the server, as fetch gives it. */
function answer(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** An answer, and what the log says about it after the status. */
interface Reply {
  readonly response: Response;
  readonly note: string;
}

/** What a request sent, for the log: the fields by their names, the secrets hidden. */
function sentText(sent: Readonly<Record<string, string>>): string {
  const fields = Object.entries(sent).map(
    ([name, value]) => `${name}=${name === 'password' || name === 'code' ? '•••' : value}`,
  );
  return fields.length ? ` ${fields.join(' ')}` : '';
}

/**
 * The backend of the application, played in the page. It does what a real server does for
 * grdCredentialsProvider: it checks what the sign-in form sends, asks for a second step when the
 * user has one, counts the wrong passwords, and keeps the session in a cookie.
 */
export class PretendServer {
  /** Every request that came, the newest first: the tool Requests shows them. */
  readonly log = signal<readonly string[]>([]);

  /** The wrong passwords of each name: how many, and until when they count. */
  private readonly wrong = new Map<string, { count: number; until: number }>();
  /** The tickets of the second steps: who typed the right password, and until when. */
  private readonly tickets = new Map<string, { user: ServerUser; until: number }>();
  private serial = 0;

  /** The requests of the provider come here instead of to the network (the option `fetch`). */
  readonly fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method = init?.method ?? 'GET';
    const path = String(input);
    // The provider sends the fields as JSON (the option `encoding` can make it a form).
    const sent: Record<string, string> =
      typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    let reply: Reply;
    if (method === 'POST' && path === '/api/login') {
      reply = this.login(sent);
    } else if (
      (method === 'GET' && path === '/api/me') ||
      (method === 'POST' && path === '/api/refresh')
    ) {
      // Who is signed in, by the cookie: 200 with the user, or 401 for nobody.
      const user = this.user();
      reply = user
        ? { response: answer(200, this.session(user)), note: ` (${user.name})` }
        : { response: answer(401), note: '' };
    } else if (method === 'POST' && path === '/api/logout') {
      // The end of the session: the server takes the cookie away.
      localStorage.removeItem(COOKIE);
      reply = { response: answer(204), note: ', the cookie is gone' };
    } else {
      reply = { response: answer(404), note: '' };
    }
    const { response, note } = reply;
    this.write(`${method} ${path}${sentText(sent)} → ${response.status}${note}`);
    return response;
  }) as typeof fetch;

  /**
   * POST /api/login: the name and the password, or the answer of a second step (its fields with
   * `ticket` and `step`). The answer is the user with the cookie, one step more, or a refusal.
   */
  private login(sent: Readonly<Record<string, string>>): Reply {
    // The answer of a step: the ticket says who typed the right password before.
    if (sent['step']) {
      const ticket = this.tickets.get(sent['ticket'] ?? '');
      if (!ticket || ticket.until < Date.now()) {
        return {
          response: answer(410, { error: 'challenge-expired' }),
          note: ' challenge-expired',
        };
      }
      if (sent['code'] !== CODE) {
        return { response: answer(401, { error: 'invalid-code' }), note: ' invalid-code' };
      }
      this.tickets.delete(sent['ticket']);
      return this.signedIn(ticket.user);
    }

    const name = (sent['username'] ?? '').trim().toLowerCase();
    const user = USERS.find((candidate) => candidate.name === name);
    const wrong = this.wrong.get(name);
    const counting = wrong !== undefined && wrong.until > Date.now();
    // A locked name: the server says for how long (Retry-After), and the screen waits.
    if (counting && wrong.count >= ATTEMPTS) return this.locked(wrong.until);
    if (!user || user.password !== sent['password']) {
      // The same answer for a name that does not exist and for a wrong password: the server never
      // tells which. It counts the tries of a name that does not exist too.
      const count = (counting ? wrong.count : 0) + 1;
      const until = Date.now() + LOCK * 1000;
      this.wrong.set(name, { count, until });
      if (count >= ATTEMPTS) return this.locked(until);
      return {
        response: answer(401, { error: 'invalid-credentials' }),
        note: ' invalid-credentials',
      };
    }
    this.wrong.delete(name);

    if (user.secondFactor) {
      // The right password, and one step more: the screen asks for the code. The ticket comes back
      // with the code; the library has the field and the text of the step `otp`.
      const ticket = `t-${++this.serial}`;
      this.tickets.set(ticket, { user, until: Date.now() + TICKET_LIFETIME * 1000 });
      return {
        response: answer(200, { challenge: { type: 'otp', ticket } }),
        note: `, a step more: otp (ticket ${ticket})`,
      };
    }
    return this.signedIn(user);
  }

  /** Signed in: the server sets the cookie in this answer and gives the user. */
  private signedIn(user: ServerUser): Reply {
    localStorage.setItem(COOKIE, user.name);
    return {
      response: answer(200, this.session(user)),
      note: `, the cookie is set (${user.name})`,
    };
  }

  /** Locked until `until`: 423 with the time that is left (Retry-After, in seconds). */
  private locked(until: number): Reply {
    const wait = String(Math.max(1, Math.ceil((until - Date.now()) / 1000)));
    return {
      response: answer(423, { error: 'locked' }, { 'Retry-After': wait }),
      note: ` locked, Retry-After: ${wait}`,
    };
  }

  /** The user of the cookie, or `null`: nobody is signed in. */
  private user(): ServerUser | null {
    const name = localStorage.getItem(COOKIE);
    return USERS.find((user) => user.name === name) ?? null;
  }

  /** What the sign-in, /api/me and /api/refresh answer: the user and how long. Never the password. */
  private session(user: ServerUser): unknown {
    const { id, name, displayName, email, roles } = user;
    return { user: { id, name, displayName, email, roles }, expiresIn: LIFETIME };
  }

  private write(line: string): void {
    this.log.update((log) => [`${new Date().toLocaleTimeString()}  ${line}`, ...log]);
  }
}

/** The one server of the tutorial. */
export const server = new PretendServer();
