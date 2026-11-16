import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrdAuth, grdUserName } from '@gridify/studio';

/** Where a guard sends a user who is signed in but may not open the page (`forbidden: '/forbidden'`). */
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  template: `
    <h1>Not allowed</h1>
    <p>{{ name() }}, your account may not open this page.</p>
    <p>
      Go to the <a routerLink="/">first page</a>, or <a routerLink="/sign-in">sign in</a> as
      somebody else.
    </p>
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
export class ForbiddenPage {
  private readonly auth = inject(GrdAuth);
  protected readonly name = computed(() => grdUserName(this.auth.user()));
}
