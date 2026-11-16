import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { GrdAuth, GrdButton } from '@gridify/studio';
import { demoServer } from './demo-server';
import { EventLog } from './event-log';

/** The session: its state, when it ends, and the buttons that end it in each way. */
@Component({
  selector: 'app-session-panel',
  imports: [GrdButton],
  template: `
    <h2>The session</h2>
    <dl>
      <dt>Status</dt>
      <dd>{{ auth.status() }}</dd>
      <dt>Ends at</dt>
      <dd>{{ endsAt() }}</dd>
      <dt>Ends in</dt>
      <dd>{{ endsIn() }}</dd>
    </dl>
    <div class="buttons">
      <grd-button label="The server forgets the session" (pressed)="forget()" />
      <grd-button label="End the session now" (pressed)="endNow()" />
      <grd-button label="Lock the screen" (pressed)="lock()" />
      <grd-button label="Sign out" (pressed)="signOut()" />
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
    }
    dd {
      margin: 0;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class SessionPanel {
  protected readonly auth = inject(GrdAuth);
  private readonly log = inject(EventLog);

  /** The clock of the page, once a second, for the countdown. */
  private readonly now = signal(Date.now());

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** When the session ends, as the server said (`session().expiresAt`). */
  protected readonly endsAt = computed(() => {
    const end = this.auth.session().expiresAt;
    return end ? new Date(end).toLocaleTimeString() : '–';
  });

  /** How long until the end, while the session works. */
  protected readonly endsIn = computed(() => {
    const end = this.auth.session().expiresAt;
    if (!end || this.auth.status() !== 'authenticated') return '–';
    const seconds = Math.max(0, Math.round((end - this.now()) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  });

  /**
   * The server forgets the session, as when it restarts or an administrator ends it. The page does
   * not know yet: nothing happens until the next request, which the server answers with 401, or
   * until the next refresh of the session, which the server refuses.
   */
  protected forget(): void {
    demoServer.expireSession();
    this.log.write('The server forgot the session. Nothing shows until a request or a refresh.');
  }

  /** What GrdAuth does by itself when the time of a session is up and it cannot be refreshed. */
  protected endNow(): void {
    this.auth.expire('timeout');
  }

  /** What GrdAuth does by itself after `idleLock` without a click or a key. */
  protected lock(): void {
    this.auth.lock();
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
