import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdButton,
  GrdLoginHost,
  type GrdMenuItem,
  GrdProfileDialog,
  type GrdPropertyPageDef,
  GrdUserMenu,
  grdUserName,
} from '@gridify/studio';
import { KEYS_MAX } from './api-keys';
import { KeysPage } from './keys-page';
import { TeamProfileStore } from './profile-store';
import { departmentName, type TeamProfile } from './team-profile';
import { WorkPage } from './work-page';

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdButton, GrdLoginHost, GrdUserMenu],
  template: `
    <grd-app-header productName="Team" subtitle="Tutorial 197" preferences="theme density">
      <!-- The user menu (see 194): "My profile…" and a command of the application. -->
      <grd-user-menu grdAppHeaderUser profile [items]="items" (profileRequested)="openProfile()" />
    </grd-app-header>

    <main>
      @if (auth.user(); as user) {
        <!-- The card of the user as the colleagues see it: the fields of the application too. -->
        <section>
          <h2>{{ nameOf(user) }}</h2>
          @if (me(); as profile) {
            <p>{{ profile.jobTitle || 'No job title' }} · {{ department(profile.department) }}</p>
            @if (profile.away; as away) {
              <p class="away">Out of office until {{ dayOf(away.until) }}: {{ away.message }}</p>
            } @else {
              <p>At work.</p>
            }
          } @else {
            <p class="note">Loading the profile…</p>
          }
          <div class="buttons">
            <grd-button label="My profile…" (pressed)="openProfile()" />
            <grd-button label="Out of office…" (pressed)="openProfile('work')" />
          </div>
        </section>
        <section>
          <h2>What was saved</h2>
          @for (line of log(); track $index) {
            <div class="line">{{ line }}</div>
          } @empty {
            <p class="note">Nothing yet. Open the profile, change something and save it.</p>
          }
        </section>
      } @else {
        <section>
          <h2>Nobody is signed in</h2>
          <p>Press Sign in at the right end of the header.</p>
          <p>
            Sign in as eva or jan, who may use the API, or as petra, who may not. The password is
            gridify.
          </p>
        </section>
      }
    </main>

    <!-- Once in the application: the sign-in window that "Sign in" opens. -->
    <grd-login-host />
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
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(22em, 100%), 1fr));
      align-content: start;
      align-items: start;
      gap: 16px 32px;
      padding: 16px 24px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 1.1em;
      color: var(--grd-text-active);
    }
    p {
      margin: 0 0 8px;
    }
    .away {
      color: var(--grd-warning-text);
    }
    .note {
      opacity: 0.88;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .line {
      padding: 3px 0;
      border-bottom: 1px solid var(--grd-border-color);
    }
  `,
})
export class App {
  /** The session: who is signed in, and the roles. */
  protected readonly auth = inject(GrdAuth);
  /** The profile in a window. */
  private readonly profile = inject(GrdProfileDialog);
  /** The store of the profile: the page loads the profile through it too. */
  private readonly store = inject(TeamProfileStore);

  protected readonly nameOf = grdUserName;
  protected readonly department = departmentName;

  /**
   * The profile of the user for the page: loaded when the user signs in, then taken from every
   * save in the window (`saved`), so the card shows a new job title or an absence at once.
   */
  protected readonly me = signal<TeamProfile | null>(null);
  /** What each save changed, the newest first. */
  protected readonly log = signal<string[]>([]);

  /** A command of the application in the user menu: it opens the profile at the page Work. */
  protected readonly items: GrdMenuItem[] = [
    { label: 'Out of office…', run: () => this.openProfile('work') },
  ];

  /**
   * The pages of the application in the profile, after the tabs of the library. Work is for
   * everybody. API keys only for who may use the API (here an administrator or an editor): a page
   * that the user may not see is not in the list. `inputs` are the inputs of the component.
   */
  private readonly pages = computed<GrdPropertyPageDef[]>(() => [
    { name: 'work', label: 'Work', component: WorkPage },
    ...(this.auth.hasRole('admin') || this.auth.hasRole('editor')
      ? [{ name: 'keys', label: 'API keys', component: KeysPage, inputs: { limit: KEYS_MAX } }]
      : []),
  ]);

  /** Who is signed in, by the id: a new name in the session is the same user. */
  private readonly userId = computed(() => this.auth.user()?.id);

  constructor() {
    // The profile of the user who signs in. Nobody: none, and the log of the one before goes.
    effect(() => {
      const id = this.userId();
      untracked(() => {
        this.me.set(null);
        this.log.set([]);
        if (id !== undefined) void this.loadProfile(id);
      });
    });
  }

  /** Opens the profile in a window at the tab `tab`, at the first one without it. */
  protected openProfile(tab?: string): void {
    this.profile.open({
      // The tabs of the library, in this order. Preferences are not here (the appearance is in
      // the header), nor Notifications (this application sends none).
      tabs: 'profile security',
      // The pages of the application, after them.
      pages: this.pages(),
      // The tab to show first: the name of a tab of the library or of a page of the application.
      selected: tab,
      // A little taller than the 46em of the library: the page Work with an absence fits.
      height: '52em',
      // Every save, of a tab of the library or of a page of the application: the whole profile
      // as the store answered it, with the fields of the application.
      saved: (profile) => this.took(profile as TeamProfile),
    });
  }

  protected dayOf(iso: string): string {
    return new Date(`${iso}T00:00`).toLocaleDateString('en', { day: 'numeric', month: 'long' });
  }

  private async loadProfile(id: string): Promise<void> {
    try {
      const profile = await this.store.load();
      // Still the same user? Somebody else may have signed in meanwhile.
      if (this.userId() === id) this.me.set(profile);
    } catch {
      // The card stays at "Loading"; the profile in the window says why it failed.
    }
  }

  /** A save: the card shows the new profile, and the log says which fields changed. */
  private took(profile: TeamProfile): void {
    const before = this.me();
    this.me.set(profile);
    const changed = before ? changedFields(before, profile) : [];
    const time = new Date().toLocaleTimeString('en');
    this.log.update((lines) => [`${time}  ${changed.join(', ') || 'nothing'}`, ...lines]);
  }
}

/** The names of the fields that differ between two profiles. */
function changedFields(before: TeamProfile, after: TeamProfile): string[] {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  const value = (profile: TeamProfile, name: string) =>
    JSON.stringify((profile as unknown as Record<string, unknown>)[name] ?? null);
  return [...names].filter((name) => value(before, name) !== value(after, name));
}
