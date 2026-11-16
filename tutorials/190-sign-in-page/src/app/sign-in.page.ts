import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GrdAuth, GrdLogin, grdUserName } from '@gridify/studio';

/**
 * The sign-in page. The guard sends somebody here who opened a page that needs a user
 * (`/sign-in?returnUrl=/orders`); anybody may also open it by the link in the header.
 */
@Component({
  selector: 'app-sign-in',
  imports: [GrdLogin, RouterLink],
  template: `
    @if (auth.user(); as user) {
      <!-- Somebody is signed in already: no form, only a way on. -->
      <p class="done">You are signed in as {{ nameOf(user) }}.</p>
      <p class="done">Go to the <a routerLink="/orders">orders</a>.</p>
    } @else {
      <!--
        The whole sign-in screen: the fields of the provider (a name and a password), the button,
        the wait while the server answers, and the errors. (signedIn) comes once the server has
        let the user in. [preferences]="false": the header has the selects of the theme already.
      -->
      <grd-login
        heading="Sign in to the orders"
        subtitle="Try eva with the password gridify"
        [preferences]="false"
        (signedIn)="signedIn()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    grd-login {
      /* The screen fills the place of the page, under the header (it would fill the window). */
      --grd-login-min-height: 100%;
      height: 100%;
    }
    .done {
      margin: 0;
      padding: 16px 24px 0;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
  `,
})
export class SignInPage {
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);
  protected readonly nameOf = grdUserName;

  /**
   * Somebody signed in. The guard remembered the page they wanted (`/orders`); `takeReturnUrl`
   * gives it once and forgets it. Without one (the page was opened by the link) the orders.
   */
  protected signedIn(): void {
    void this.router.navigateByUrl(this.auth.takeReturnUrl('/orders'));
  }
}
