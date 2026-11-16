import { Component, inject, signal } from '@angular/core';
import { GrdAuth, GrdButton, GrdInput, GrdPassword } from '@gridify/studio';
import { server } from './pretend-server';

/**
 * The sign-in page of the SERVER, played over the application. A real server has this page at
 * /auth/login, outside the application: the browser goes there and comes back.
 */
@Component({
  selector: 'app-server-page',
  imports: [GrdButton, GrdInput, GrdPassword],
  template: `
    <div class="card">
      <p class="note">This page belongs to the server ({{ address }}), not to the application.</p>
      <h2>Example Corp</h2>
      <form (submit)="signIn($event)">
        <grd-input label="Name" [(value)]="name" />
        <grd-password label="Password" [(value)]="password" />
        @if (wrong()) {
          <p class="error">The name or the password is not correct.</p>
        }
        <div class="buttons">
          <grd-button type="submit" label="Sign in" variant="primary" />
          <grd-button label="Back to the application" (pressed)="back()" />
        </div>
      </form>
      <p class="note">Try alice or tomas, with the password secret.</p>
    </div>
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: 10;
      display: grid;
      place-items: center;
      /* The page is outside the docking engine, which gives its own content the colours of the
         theme: this page takes them itself, the text as well as the background. */
      background: var(--grd-bg-main);
      color: var(--grd-text-main);
    }
    .card {
      width: 22em;
      padding: 20px 24px;
      border: 1px solid var(--grd-border-color);
      border-radius: 8px;
      background: var(--grd-bg-panel);
    }
    h2 {
      color: var(--grd-text-active);
    }
    .note {
      opacity: 0.88;
      font-size: 0.9em;
    }
    .error {
      color: var(--grd-danger-text);
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
  `,
})
export class ServerPage {
  private readonly auth = inject(GrdAuth);
  protected readonly address = server.page();
  protected readonly name = signal('');
  protected readonly password = signal('');
  protected readonly wrong = signal(false);

  /** The server checks the password and sets the cookie, then sends the user back. */
  protected async signIn(event: Event): Promise<void> {
    event.preventDefault();
    if (!server.signIn(this.name(), this.password())) {
      this.wrong.set(true);
      return;
    }
    const back = server.returnUrl();
    server.closePage();
    // Back in the application: GrdAuth asks /api/me, and the cookie answers. (After a real
    // redirect the application starts again, and its first /api/me does the same.)
    await this.auth.complete('session', back);
  }

  protected back(): void {
    server.closePage();
  }
}
