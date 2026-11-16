import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth } from '@gridify/studio';

/** The first page. Anybody may see it. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Welcome</h1>
    @if (auth.isAuthenticated()) {
      <p>You are signed in. Open the <a routerLink="/orders">orders</a>.</p>
    } @else {
      <p>
        Nobody is signed in. Open the <a routerLink="/orders">orders</a>: the application sends you
        to the sign-in page first, and back to the orders once you are signed in.
      </p>
      <p>Sign in as <code>eva</code> with the password <code>gridify</code>.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class HomePage {
  protected readonly auth = inject(GrdAuth);
}
