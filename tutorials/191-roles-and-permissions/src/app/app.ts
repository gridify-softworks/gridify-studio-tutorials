import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdAuth, GrdButton, GrdCan, grdUserName } from '@gridify/studio';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdCan, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <grd-app-header productName="Orders" subtitle="Tutorial 191" preferences="theme density">
      <div grdAppHeaderEnd class="who">
        @if (auth.user()) {
          <span>{{ who() }}</span>
          <grd-button label="Sign out" (pressed)="signOut()" />
        } @else {
          <a routerLink="/sign-in">Sign in</a>
        }
      </div>
    </grd-app-header>

    <!--
      A link is there only for who may open its page (*grdCan). That is a comfort, not a lock: the
      guard of the route checks again, and the server checks every request.
    -->
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exact">Home</a>
      <a *grdCan="'orders.view'" routerLink="/orders" routerLinkActive="active">Orders</a>
      <a *grdCan="'orders.edit'" routerLink="/new-order" routerLinkActive="active">New order</a>
      <a *grdCan="{ role: 'admin' }" routerLink="/administration" routerLinkActive="active">
        Administration
      </a>
    </nav>

    <main>
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
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);

  /** The link of the first page is marked only on that page. */
  protected readonly exact = { exact: true };

  /** `Signed in as Eva Müller (admin)`: the name and the roles of the user. */
  protected readonly who = computed(() => {
    const user = this.auth.user();
    return user ? `Signed in as ${grdUserName(user)} (${user.roles.join(', ')})` : '';
  });

  constructor() {
    // Signed out here or in another window: back to the first page (see 190).
    this.auth.on('signedOut', () => void this.router.navigateByUrl('/'));
  }

  protected signOut(): void {
    void this.auth.signOut();
  }
}
