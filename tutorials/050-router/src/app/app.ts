import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { GrdAppHeader, GrdRibbonActionEvent, GrdToolbar, GrdToolbarItem } from '@gridify/studio';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdToolbar, RouterOutlet],
  template: `
    <grd-app-header
      productName="Router"
      subtitle="Angular router, no docking engine"
      preferences="theme density"
    />
    <grd-toolbar [items]="items" ariaLabel="Pages" (action)="go($event)" />
    <main>
      <!-- the router puts the page of the route here -->
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    grd-toolbar {
      border-bottom: 1px solid var(--grd-border-color);
    }
    main {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
  `,
})
export class App {
  private readonly router = inject(Router);

  /** The URL of the page that is shown (`/table`, `/form`), after the redirects. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );

  /** A button for each page, pressed while its page is shown, and the URL at the right end. */
  protected readonly items: GrdToolbarItem[] = [
    {
      type: 'toggle-button',
      label: 'Table',
      action: '/table',
      checked: computed(() => this.url().startsWith('/table')),
    },
    {
      type: 'toggle-button',
      label: 'Form',
      action: '/form',
      checked: computed(() => this.url().startsWith('/form')),
    },
    { type: 'label', label: computed(() => `Route: ${this.url()}`), end: true },
  ];

  /** A button of the toolbar: its action is the URL of its page. */
  protected go(event: GrdRibbonActionEvent): void {
    if (event.item.action) this.router.navigateByUrl(event.item.action);
  }
}
