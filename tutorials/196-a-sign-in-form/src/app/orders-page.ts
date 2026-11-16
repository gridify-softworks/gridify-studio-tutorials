import { Component, inject } from '@angular/core';
import { GrdAuth, GrdButton, GrdLogin, grdUserName } from '@gridify/studio';

/** A document: the sign-in form for nobody, and for a signed-in user what the server said. */
@Component({
  selector: 'app-orders-page',
  imports: [GrdButton, GrdLogin],
  template: `
    @if (auth.user(); as user) {
      <h2>Hello, {{ nameOf(user) }}</h2>
      <p>The server says: {{ user.email }}, roles {{ user.roles.join(', ') }}.</p>
      <p>
        You signed in with the provider {{ auth.session().method }}. The session ends at
        {{ endsAt() }}. There is no token in the page: {{ auth.accessToken() ?? 'null' }}.
      </p>
      <div class="buttons">
        <grd-button label="Renew the session" (pressed)="auth.refresh()" />
        <grd-button label="Sign out" (pressed)="auth.signOut()" />
      </div>
    } @else {
      <!--
        The sign-in screen of the library, drawn from the provider: its fields (a name and a
        password), and the steps that the server asks for. It passes what was typed to GrdAuth, and
        GrdAuth to the provider. "dialog" is the card alone, without the page around it.
      -->
      <grd-login
        class="login"
        mode="dialog"
        heading="Sign in to Orders"
        subtitle="alice or tomas, with the password secret; tomas then types the code 123456"
        [cancellable]="false"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    .login {
      max-inline-size: 26em;
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
