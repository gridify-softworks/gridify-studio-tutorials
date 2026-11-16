import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth } from '@gridify/studio';

/** One question that the application asks GrdAuth, for the table of the first page. */
interface Question {
  what: string;
  code: string;
  answer: boolean;
}

/** The first page: what the user who is signed in may do, and a link to every page. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <h1>Roles and permissions</h1>
    @if (auth.user(); as user) {
      <p>
        Your roles: <code>{{ user.roles.join(', ') }}</code>
      </p>
      <p>
        What they let you do: <code>{{ auth.permissions().join(', ') }}</code>
      </p>
      <!-- The questions of the application, and what GrdAuth answers for this user. -->
      <table>
        <thead>
          <tr>
            <th>May I…</th>
            <th>The question in the code</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
          @for (question of questions(); track question.code) {
            <tr>
              <td>{{ question.what }}</td>
              <td>
                <code>{{ question.code }}</code>
              </td>
              <td [class.yes]="question.answer" [class.no]="!question.answer">
                {{ question.answer ? 'yes' : 'no' }}
              </td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <p>Nobody is signed in. <a routerLink="/sign-in">Sign in</a> as one of the users below.</p>
    }

    <h2>Every page</h2>
    <p>
      The bar above has only the pages you may open. These links are there for everybody, so you can
      see what the guards do with a page you may not open:
    </p>
    <ul>
      <li><a routerLink="/orders">Orders</a>: needs <code>orders.view</code></li>
      <li><a routerLink="/new-order">New order</a>: needs <code>orders.edit</code></li>
      <li><a routerLink="/administration">Administration</a>: needs the role <code>admin</code></li>
    </ul>

    <h2>The users</h2>
    <p>Every account has the password <code>gridify</code>.</p>
    <ul>
      <li><code>eva</code> (Eva Müller): <code>admin</code>, may do everything</li>
      <li><code>jan</code> (Jan Wagner): <code>editor</code>, may do everything with the orders</li>
      <li><code>petra</code> (Petra Schmidt): <code>viewer</code>, may only look</li>
    </ul>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
    }
    a {
      color: var(--grd-link-color, var(--grd-accent));
    }
    table {
      border-collapse: collapse;
    }
    th,
    td {
      padding: 4px 12px;
      border-bottom: 1px solid var(--grd-border-color);
      text-align: left;
    }
    .yes {
      color: var(--grd-success-text);
      font-weight: bold;
    }
    .no {
      color: var(--grd-danger-text);
      font-weight: bold;
    }
  `,
})
export class HomePage {
  protected readonly auth = inject(GrdAuth);

  /**
   * The questions. `can` and `hasRole` read the session, a signal, so the answers follow every
   * sign-in and sign-out by themselves.
   */
  protected readonly questions = computed<Question[]>(() => [
    {
      what: 'see the orders',
      code: "auth.can('orders.view')",
      answer: this.auth.can('orders.view'),
    },
    {
      what: 'create an order',
      code: "auth.can('orders.edit')",
      answer: this.auth.can('orders.edit'),
    },
    {
      what: 'delete an order',
      code: "auth.can('orders.delete')",
      answer: this.auth.can('orders.delete'),
    },
    {
      what: 'see the reports',
      code: "auth.can('reports.view')",
      answer: this.auth.can('reports.view'),
    },
    { what: 'administer', code: "auth.hasRole('admin')", answer: this.auth.hasRole('admin') },
  ]);
}
