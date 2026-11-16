import { Component, inject } from '@angular/core';
import { GrdAuth, GrdButton, grdUserName } from '@gridify/studio';

/** A document: what a signed-in user sees, and the buttons that talk to the server. */
@Component({
  selector: 'app-orders-page',
  imports: [GrdButton],
  template: `
    @if (auth.user(); as user) {
      <h2>Hello, {{ nameOf(user) }}</h2>
      <p>The server says: {{ user.email }}, roles {{ user.roles.join(', ') }}.</p>
      <p>
        The session ends at {{ endsAt() }}. There is no token in the page:
        {{ auth.accessToken() ?? 'null' }}.
      </p>
      <div class="buttons">
        <grd-button label="Renew the session" (pressed)="auth.refresh()" />
        <grd-button label="Sign out" (pressed)="auth.signOut()" />
      </div>
    } @else {
      <h2>Nobody is signed in</h2>
      <p>Press Sign in at the top: the browser goes to the sign-in page of the server.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
  `,
})
export class OrdersPage {
  protected readonly auth = inject(GrdAuth);
  protected readonly nameOf = grdUserName;

  protected endsAt(): string {
    const end = this.auth.session().expiresAt;
    return end ? new Date(end).toLocaleTimeString() : 'no time';
  }
}
