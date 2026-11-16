import { Component, computed, inject } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdLogin,
  GrdMessageBox,
  grdUserName,
} from '@gridify/studio';
import { AuthState } from './auth-state';
import { TRIES } from './tries';

@Component({
  selector: 'app-root',
  imports: [AuthState, GrdAppHeader, GrdButton, GrdLogin],
  template: `
    <grd-app-header productName="Sign-in steps" subtitle="Tutorial 192" preferences="theme density">
      @if (auth.user()) {
        <grd-button grdAppHeaderEnd label="Sign out" (pressed)="signOut()" />
      }
    </grd-app-header>

    <main>
      <section class="screen">
        @if (auth.isAuthenticated()) {
          <h1>Welcome, {{ name() }}</h1>
          <p>
            You signed in with: <code>{{ auth.session().method }}</code>
          </p>
          <p>Sign out to try another account.</p>
        } @else {
          <!--
            The sign-in screen draws every provider of app.config.ts: the two forms as tabs
            (Password and Directory), the identity provider as a button under them. When the
            server asks for a step more, the screen turns into that step by itself.
          -->
          <grd-login
            heading="Sign in"
            subtitle="Every account has the password gridify"
            [preferences]="false"
            forgotPassword
            register
            (forgotPasswordRequested)="tell('reset your password')"
            (registerRequested)="tell('create an account')"
          />
        }
      </section>

      <section class="side">
        <h2>Accounts to try</h2>
        <table>
          <tbody>
            @for (item of tries; track item.how) {
              <tr>
                <th>{{ item.how }}</th>
                <td>{{ item.what }}</td>
              </tr>
            }
          </tbody>
        </table>
        <app-auth-state />
      </section>
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
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px 24px;
    }
    .screen {
      flex: 1 1 26em;
    }
    grd-login {
      /* The screen in a column of the page, not over the whole window. */
      --grd-login-min-height: 0;
    }
    .side {
      flex: 1 1 22em;
      display: grid;
      align-content: start;
      gap: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.1em;
    }
    table {
      border-collapse: collapse;
    }
    th,
    td {
      padding: 4px 8px;
      border-bottom: 1px solid var(--grd-border-color);
      text-align: left;
      vertical-align: top;
    }
  `,
})
export class App {
  protected readonly auth = inject(GrdAuth);
  private readonly box = inject(GrdMessageBox);

  protected readonly tries = TRIES;
  protected readonly name = computed(() => grdUserName(this.auth.user()));

  protected signOut(): void {
    void this.auth.signOut();
  }

  /**
   * The two links of the screen only ask the application: the library has no page to reset a
   * password or to create an account, because only the server of the application can do that.
   */
  protected tell(what: string): void {
    this.box.info(`Here the application would open its own page to ${what}.`);
  }
}
