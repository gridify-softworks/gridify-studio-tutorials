import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdLogin,
  GrdLoginHost,
  GrdTextarea,
  grdUserName,
} from '@gridify/studio';
import { EventLog } from './event-log';
import { OrdersPanel } from './orders-panel';
import { SessionPanel } from './session-panel';

@Component({
  selector: 'app-root',
  imports: [
    GrdAppHeader,
    GrdButton,
    GrdLogin,
    GrdLoginHost,
    GrdTextarea,
    OrdersPanel,
    SessionPanel,
  ],
  template: `
    <grd-app-header
      productName="Session expiry"
      subtitle="Tutorial 193"
      preferences="theme density"
    >
      @if (auth.user()) {
        <span grdAppHeaderEnd>{{ who() }}</span>
      }
    </grd-app-header>

    @if (!auth.user()) {
      <!--
        Nobody is signed in: the sign-in screen, as in 190. (Not "status() === 'anonymous'": while
        the server checks the password the status is 'authenticating', and the screen must stay.)
      -->
      <grd-login
        heading="Sign in"
        subtitle="Try eva with the password gridify"
        [preferences]="false"
      />
    } @else {
      <!--
        Somebody is known: signed in, or the session has ended, or the screen is locked (GrdAuth
        keeps the user in each case). The work stays on the screen; while the session does not
        work, a line says so.
      -->
      @if (auth.status() !== 'authenticated') {
        <p class="ended">
          <span>{{ ended() }}</span>
          <grd-button label="Sign in again" (pressed)="signInAgain()" />
        </p>
      }
      <main>
        <section>
          <h2>Your work</h2>
          <grd-textarea label="A note, not saved anywhere" [rows]="6" [(value)]="note" />
        </section>
        <section><app-orders-panel /></section>
        <section><app-session-panel /></section>
        <section>
          <h2>What happened</h2>
          <ol class="log">
            @for (line of log.lines(); track $index) {
              <li>{{ line }}</li>
            }
          </ol>
        </section>
      </main>
    }

    <!-- Once in the application: the window that opens when somebody asks for a sign-in. -->
    <grd-login-host />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: var(--grd-text-main);
      background: var(--grd-bg-main);
    }
    grd-login {
      --grd-login-min-height: 0;
      flex: 1;
    }
    .ended {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 6px 16px;
      background: var(--grd-bg-panel);
      border-bottom: 1px solid var(--grd-border-color);
      color: var(--grd-danger-text);
      font-weight: bold;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(22em, 100%), 1fr));
      align-content: start;
      gap: 16px 32px;
      padding: 16px 24px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
    }
    .log {
      margin: 0;
      padding-left: 1.5em;
      font-family: var(--grd-font-mono, monospace);
      font-size: 0.9em;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);
  protected readonly log = inject(EventLog);

  /** The work of the user: a note that lives only in this page. */
  protected readonly note = signal('');

  protected readonly who = computed(
    () => `${grdUserName(this.auth.user())} (${this.auth.status()})`,
  );
  protected readonly ended = computed(() =>
    this.auth.status() === 'locked' ? 'The screen is locked.' : 'Your session has ended.',
  );

  constructor() {
    // 1. The session has ended, or the screen is locked: ask for a sign-in at once. The window of
    //    <grd-login-host /> opens over the page, and the work under it stays as it is.
    effect(() => {
      const status = this.auth.status();
      if (status === 'expired' || status === 'locked') {
        untracked(() => void this.auth.requestSignIn());
      }
    });

    // 2. The events of GrdAuth go into the log, and decide what happens to the work.
    this.auth.on('signedIn', (event) => {
      const before = event.previous ? ` (before: ${grdUserName(event.previous)})` : '';
      this.log.write(`signedIn: ${grdUserName(event.user)}${before}`);
      // Somebody else signed in in the window: the work of the user before is not theirs.
      if (event.previous && event.previous.id !== event.user.id) this.note.set('');
    });
    this.auth.on('expired', (event) => this.log.write(`expired: ${event.reason}`));
    this.auth.on('signedOut', (event) => {
      this.log.write(`signedOut: ${event.reason}`);
      // What the application kept for the user goes with them.
      this.note.set('');
    });

    // 3. A refresh moves the end of the session on. The user notices nothing; the log does.
    let before = this.auth.session();
    effect(() => {
      const now = this.auth.session();
      const renewed =
        before.status === 'authenticated' &&
        now.status === 'authenticated' &&
        before.user?.id === now.user?.id &&
        (now.expiresAt ?? 0) > (before.expiresAt ?? 0);
      if (renewed) {
        const end = new Date(now.expiresAt ?? 0).toLocaleTimeString();
        untracked(() => this.log.write(`refreshed: the session now ends at ${end}`));
      }
      before = now;
    });
  }

  /** The line under the header: the window again, after it was closed without signing in. */
  protected signInAgain(): void {
    void this.auth.requestSignIn();
  }
}
