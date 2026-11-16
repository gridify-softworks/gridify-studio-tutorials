import { Component, computed, inject, input, signal } from '@angular/core';
import { GrdButton, GrdInput, GrdProfileState, grdUserName } from '@gridify/studio';
import { type ApiKey, ApiKeys, type NewApiKey } from './api-keys';

/**
 * A page of the application in the profile with data of its own: the keys of the API of the user.
 * They are not the profile, so the page loads and changes them through a service of the
 * application (`ApiKeys`). From the profile it takes only the user (`GrdProfileState.user`), and
 * from the application an input (`limit`), which the list of the pages gives (`inputs`).
 */
@Component({
  selector: 'app-keys-page',
  imports: [GrdButton, GrdInput],
  template: `
    <section class="section">
      <h3 class="heading">The keys of {{ owner() }}</h3>
      <p class="note">
        A key lets a script use the API in your name, with what you may do. Keep it as you keep a
        password, and revoke a key that you no longer need.
      </p>
      @if (made(); as made) {
        <div class="secret" role="status">
          <span>Copy the key {{ made.key.name }} now: it is not shown again.</span>
          <code>{{ made.secret }}</code>
          <grd-button [label]="copied() ? 'Copied' : 'Copy'" (pressed)="copy(made.secret)" />
        </div>
      }
      @if (keys(); as list) {
        <ul class="keys">
          @for (key of list; track key.id) {
            <li>
              <span class="what">
                <span class="name">{{ key.name }}</span>
                <span class="detail">{{ key.start }}… · made {{ dayOf(key.created) }}</span>
              </span>
              <grd-button
                label="Revoke"
                appearance="flat"
                [disabled]="working()"
                (pressed)="revoke(key)"
              />
            </li>
          } @empty {
            <li class="note">No keys yet.</li>
          }
        </ul>
      } @else if (!error()) {
        <p class="note" role="status">Loading the keys…</p>
      }
    </section>

    <form class="section" novalidate (submit)="create($event)">
      <h3 class="heading">A new key</h3>
      <div class="row">
        <grd-input
          label="What the key is for"
          placeholder="Nightly export"
          [disabled]="working() || full()"
          [(value)]="name"
        />
        <grd-button
          type="submit"
          label="Make the key"
          variant="primary"
          [busy]="working()"
          [disabled]="!name().trim() || full()"
        />
      </div>
      @if (full()) {
        <p class="note">You have {{ limit() }} keys, the most there may be. Revoke one first.</p>
      }
      @if (error(); as text) {
        <p class="error" role="alert">{{ text }}</p>
      }
    </form>
  `,
  styles: `
    /* The look of the pages of the library, as on the page Work. */
    :host {
      display: grid;
      align-content: start;
      gap: 16px;
      max-inline-size: var(--grd-profile-max-width, 38em);
      color: var(--grd-text-active);
    }
    .section {
      display: grid;
      gap: 8px;
    }
    .section + .section {
      padding-block-start: 14px;
      border-block-start: 1px solid var(--grd-border-color);
    }
    .heading {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
    }
    .note {
      margin: 0;
      opacity: 0.88;
    }
    .secret {
      display: grid;
      gap: 6px;
      justify-items: start;
      padding: 10px 12px;
      border: 1px solid var(--grd-border-color);
      border-radius: 6px;
      background: var(--grd-bg-main);
    }
    code {
      font-family: var(--grd-font-mono, monospace);
      overflow-wrap: anywhere;
    }
    .keys {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .keys li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-block: 6px;
      border-block-end: 1px solid var(--grd-border-color);
    }
    .keys li:last-child {
      border-block-end: 0;
    }
    .what {
      display: grid;
      row-gap: 2px;
    }
    .name {
      font-weight: 600;
    }
    .detail {
      opacity: 0.88;
      font-family: var(--grd-font-mono, monospace);
    }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .row grd-input {
      flex: 1;
    }
    .row grd-button {
      margin-top: 1.55em;
    }
    .error {
      margin: 0;
      color: var(--grd-danger-text);
      font-weight: 600;
    }
  `,
})
export class KeysPage {
  /** The most keys that a user may have: the application gives it (`inputs` of the page). */
  readonly limit = input(3);

  private readonly state = inject(GrdProfileState);
  private readonly api = inject(ApiKeys);

  /** Whose keys they are: the user of the profile. */
  protected readonly owner = computed(() => {
    const user = this.state.user();
    return user ? grdUserName(user) : '';
  });

  /** The keys, `null` until they are loaded. */
  protected readonly keys = signal<readonly ApiKey[] | null>(null);
  /** The key that was just made, with its secret (only until the page goes). */
  protected readonly made = signal<NewApiKey | null>(null);
  protected readonly copied = signal(false);
  protected readonly name = signal('');
  protected readonly working = signal(false);
  protected readonly error = signal('');
  protected readonly full = computed(() => (this.keys()?.length ?? 0) >= this.limit());

  constructor() {
    // The page is made when its tab is shown the first time, for the user of the profile (for
    // another user the profile makes its pages again), so it loads the keys once, here.
    void this.load();
  }

  protected async create(event: Event): Promise<void> {
    event.preventDefault();
    const name = this.name().trim();
    if (!name || this.full()) return;
    await this.call(async () => {
      const made = await this.api.create(name);
      this.made.set(made);
      this.copied.set(false);
      this.keys.update((keys) => [...(keys ?? []), made.key]);
      this.name.set('');
    });
  }

  protected async revoke(key: ApiKey): Promise<void> {
    await this.call(async () => {
      await this.api.revoke(key.id);
      this.keys.update((keys) => keys?.filter((other) => other.id !== key.id) ?? null);
      if (this.made()?.key.id === key.id) this.made.set(null);
    });
  }

  protected async copy(secret: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(secret);
      this.copied.set(true);
    } catch {
      // No clipboard (a page that is not https, or the browser said no): the key is on the page.
    }
  }

  protected dayOf(at: number): string {
    return new Date(at).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private async load(): Promise<void> {
    try {
      this.keys.set(await this.api.list());
    } catch {
      this.error.set('The keys could not be loaded.');
    }
  }

  /** A request of the page: the buttons wait for it, and a refusal is said under the form. */
  private async call(run: () => Promise<void>): Promise<void> {
    this.working.set(true);
    this.error.set('');
    try {
      await run();
    } catch (failure) {
      const message = (failure as { message?: unknown } | null)?.message;
      this.error.set(typeof message === 'string' ? message : 'Something went wrong.');
    } finally {
      this.working.set(false);
    }
  }
}
