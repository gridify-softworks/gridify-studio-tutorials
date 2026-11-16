import { Component } from '@angular/core';
import { grdRolePermissions, grdUserName } from '@gridify/studio';
import { demoServer } from './demo-server';
import { ROLE_PERMISSIONS } from './permissions';

/** The accounts and what they may do. Only for the role `admin` (see app.routes.ts). */
@Component({
  selector: 'app-administration',
  template: `
    <h1>Administration</h1>
    <p>Only an administrator sees this page. The accounts of the pretend server:</p>
    <table>
      <thead>
        <tr>
          <th>Account</th>
          <th>Name</th>
          <th>Roles</th>
          <th>Permissions</th>
        </tr>
      </thead>
      <tbody>
        @for (account of accounts; track account.username) {
          <tr>
            <td>
              <code>{{ account.username }}</code>
            </td>
            <td>{{ account.name }}</td>
            <td>{{ account.roles }}</td>
            <td>
              <code>{{ account.permissions }}</code>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
      padding: 16px 24px;
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
  `,
})
export class AdministrationPage {
  /** The permissions of a user by the table of permissions.ts, the same function as in app.config.ts. */
  private readonly permissionsOf = grdRolePermissions(ROLE_PERMISSIONS);

  /** The accounts that sign in with a name and a password (the others belong to 192). */
  protected readonly accounts = demoServer
    .accountList()
    .filter((account) => !account.domain)
    .map((account) => ({
      username: account.username,
      name: grdUserName(account.user),
      roles: account.user.roles.join(', '),
      permissions: this.permissionsOf(account.user).join(', '),
    }));
}
