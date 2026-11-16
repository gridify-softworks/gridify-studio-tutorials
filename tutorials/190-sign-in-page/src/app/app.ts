import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdAuth, GrdButton, grdUserName } from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <grd-app-header productName="Orders" subtitle="Tutorial 190" preferences="theme density">
      <!-- Who is signed in. auth.user() is a signal: this part follows every sign-in and sign-out. -->
      <div grdAppHeaderEnd class="who">
        @if (auth.user(); as user) {
          <span>Signed in as {{ nameOf(user) }}</span>
          <grd-button label="Sign out" (pressed)="signOut()" />
        } @else {
          <a routerLink="/sign-in">Sign in</a>
        }
      </div>
    </grd-app-header>

    <!-- The pages. The router marks the link of the page that is shown (routerLinkActive). -->
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exact">Home</a>
      <a routerLink="/orders" routerLinkActive="active">Orders</a>
    </nav>

    <main>
      <!-- The router puts the page of the address here. -->
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      color: var(--grd-text-main);
      background: var(--grd-bg-main);
    }
    .who {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    nav {
      display: flex;
      gap: 16px;
      padding: 6px 16px;
      border-bottom: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
    nav a.active {
      font-weight: bold;
      text-decoration: none;
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class App {
  /** The session: who is signed in (`user()`), signing in and out. */
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);

  /** The name to show: the display name of the user (`Eva Müller`), else the sign-in name. */
  protected readonly nameOf = grdUserName;

  /** The link of the first page (`/`) is marked only on that page, not on every page under it. */
  protected readonly exact = { exact: true };

  constructor() {
    // Somebody signed out: here (the button) or in another window of the browser (the windows sign
    // out together). No page that needs a user may stay on the screen, so the application goes to
    // the first page. `on` gives a function that stops listening; the root component lives as long
    // as the application, so it never needs to.
    this.auth.on('signedOut', () => void this.router.navigateByUrl('/'));
  }

  /** Ends the session: here at once, then on the server. The handler above goes to the first page. */
  protected signOut(): void {
    void this.auth.signOut();
  }
}
