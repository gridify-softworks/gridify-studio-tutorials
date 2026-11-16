import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GrdAuth, GrdButton, GrdLogin, grdUserName } from '@gridify/studio';

/** One user to sign in as with a click, to try the roles quickly. */
interface QuickUser {
  username: string;
  label: string;
}

/** The sign-in page of 190, with a button for each user of the tutorial. */
@Component({
  selector: 'app-sign-in',
  imports: [GrdButton, GrdLogin],
  template: `
    @if (auth.user(); as user) {
      <p class="note">You are signed in as {{ nameOf(user) }}. Sign in as somebody else:</p>
    } @else {
      <grd-login
        heading="Sign in to the orders"
        subtitle="Try eva, jan or petra with the password gridify"
        [preferences]="false"
        (signedIn)="goOn()"
      />
    }
    <!-- A shortcut for the tutorial: sign in as one of the three users at once. -->
    <div class="quick">
      @for (user of quickUsers; track user.username) {
        <grd-button [label]="user.label" (pressed)="signInAs(user.username)" />
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-login {
      --grd-login-min-height: 0;
      flex: 1;
    }
    .note {
      margin: 0;
      padding: 16px 24px 0;
    }
    .quick {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      padding: 16px;
    }
  `,
})
export class SignInPage {
  protected readonly auth = inject(GrdAuth);
  private readonly router = inject(Router);
  protected readonly nameOf = grdUserName;

  protected readonly quickUsers: QuickUser[] = [
    { username: 'eva', label: 'Eva (admin)' },
    { username: 'jan', label: 'Jan (editor)' },
    { username: 'petra', label: 'Petra (viewer)' },
  ];

  /**
   * Signs in without the form: the same call that the form makes (`signIn` with the id of the
   * provider and what the form asks for). A user who is signed in is replaced by the new one.
   */
  protected async signInAs(username: string): Promise<void> {
    const result = await this.auth.signIn('password', { username, password: 'gridify' });
    if (result.status === 'ok') this.goOn();
  }

  /** On to the page the guard remembered, else to the first page. */
  protected goOn(): void {
    void this.router.navigateByUrl(this.auth.takeReturnUrl('/'));
  }
}
