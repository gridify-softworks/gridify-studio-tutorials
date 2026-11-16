import { Component, computed, inject } from '@angular/core';
import { GrdAuth, grdUserName } from '@gridify/studio';

/**
 * What GrdAuth says now, live: the state of the session, whether it waits for the server, and the
 * step that waits for an answer. Not needed by an application; it shows what happens under the screen.
 */
@Component({
  selector: 'app-auth-state',
  template: `
    <h2>What GrdAuth says</h2>
    <dl>
      <dt><code>status()</code></dt>
      <dd>{{ auth.status() }}</dd>
      <dt><code>user()</code></dt>
      <dd>{{ name() || 'null' }}</dd>
      <dt><code>busy()</code></dt>
      <dd>{{ auth.busy() ? 'true: the server is asked' : 'false' }}</dd>
      <dt><code>pending()</code></dt>
      <dd>{{ step() }}</dd>
      <dt><code>session().method</code></dt>
      <dd>{{ auth.session().method ?? '–' }}</dd>
    </dl>
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
      margin: 0;
    }
    dd {
      margin: 0;
    }
  `,
})
export class AuthState {
  protected readonly auth = inject(GrdAuth);
  protected readonly name = computed(() => grdUserName(this.auth.user()));

  /** The step that waits for an answer (`otp`, `password-change`, `terms`), or none. */
  protected readonly step = computed(() => {
    const pending = this.auth.pending();
    return pending
      ? `${pending.challenge.type} (from ${pending.providerId})`
      : 'null: no step waits';
  });
}
