import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  GrdAppHeader,
  GrdAuth,
  GrdAvatar,
  type GrdAvatarStatus,
  GrdButton,
  GrdI18n,
  GrdLoginHost,
  type GrdMenuItem,
  type GrdProfile,
  GrdProfileDialog,
  type GrdProfileTopic,
  GrdTheme,
  GrdUiSettings,
  GrdUserMenu,
  grdUserName,
} from '@gridify/studio';

/** The topics of the notifications: the Notifications tab of the profile has a check box for each. */
const TOPICS: GrdProfileTopic[] = [
  { id: 'orders', label: 'Order updates', description: 'When an order is placed or changes.' },
  { id: 'mentions', label: 'Mentions', description: 'When somebody writes to you.' },
  { id: 'news', label: 'News and tips', description: 'Now and then, not often.' },
];

/** The presences that the user chooses in the user menu. */
const PRESENCES: { value: GrdAvatarStatus; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'away', label: 'Away' },
  { value: 'busy', label: 'Do not disturb' },
  { value: 'offline', label: 'Offline' },
];

/** What a save gave back, and when. */
interface Save {
  readonly at: Date;
  readonly profile: GrdProfile;
}

@Component({
  selector: 'app-root',
  imports: [GrdAppHeader, GrdAvatar, GrdButton, GrdLoginHost, GrdUserMenu],
  template: `
    <grd-app-header
      productName="User menu and profile"
      subtitle="Tutorial 194"
      preferences="theme density"
    >
      <!--
        The user menu, at the far end of the header. Nobody signed in: a button "Sign in". Somebody:
        the face and the name, and under them a panel with the card of the user, the rows that the
        attributes ask for, the commands of the application and "Sign out".
      -->
      <grd-user-menu
        grdAppHeaderUser
        profile
        settings
        switchAccount
        [items]="items()"
        [status]="presence()"
        [roleLabels]="roleLabels"
        (profileRequested)="openProfile()"
        (settingsRequested)="openProfile('preferences')"
      />
    </grd-app-header>

    <main>
      @if (auth.user(); as user) {
        <!-- The page shows the user too. auth.user() follows every save of the profile. -->
        <section class="you">
          <grd-avatar
            size="xlarge"
            [src]="user.avatar"
            [name]="nameOf(user)"
            [seed]="user.id"
            [status]="presence()"
          />
          <div>
            <h2>{{ nameOf(user) }}</h2>
            <p>{{ user.email }}</p>
            <grd-button label="Open my profile" (pressed)="openProfile()" />
          </div>
        </section>
        <section>
          <h2>What the store gave back</h2>
          @if (lastSave(); as save) {
            <p>The last save, at {{ save.at.toLocaleTimeString() }}:</p>
            <pre>{{ textOf(save.profile) }}</pre>
          } @else {
            <p>Nothing was saved yet. Open the profile, change something and save it.</p>
          }
        </section>
      } @else {
        <section>
          <h2>Nobody is signed in</h2>
          <p>Press Sign in at the right end of the header.</p>
          <p>Sign in as eva with the password gridify (or jan, or petra).</p>
        </section>
      }
      <section>
        <h2>Where the appearance is kept</h2>
        <!-- The keys in localStorage that the theme, the density and the language use now. -->
        <dl>
          <dt>Theme</dt>
          <dd>{{ theme.storageKey() }}</dd>
          <dt>Density</dt>
          <dd>{{ density.storageKey() }}</dd>
          <dt>Language</dt>
          <dd>{{ language.storageKey() }}</dd>
        </dl>
      </section>
    </main>

    <!-- Once in the application: the sign-in window that "Sign in" and "Switch account" open. -->
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
    }
    .you {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .you p {
      margin: 0 0 12px;
    }
    pre {
      margin: 0;
      font-family: var(--grd-font-mono, monospace);
      font-size: 0.9em;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }
    dd {
      margin: 0;
      font-family: var(--grd-font-mono, monospace);
    }
  `,
})
export class App {
  /** The session: who is signed in (`user()`). The user menu reads it by itself. */
  protected readonly auth = inject(GrdAuth);
  /** The profile in a window. */
  private readonly profile = inject(GrdProfileDialog);
  /** The services of the appearance: the theme, the density and the language. */
  protected readonly theme = inject(GrdTheme);
  protected readonly density = inject(GrdUiSettings);
  protected readonly language = inject(GrdI18n);

  /** The name to show: the display name of the user (`Eva Müller`), else the sign-in name. */
  protected readonly nameOf = grdUserName;

  /** The names of the roles on the card of the user menu (a role without a name shows as it is). */
  protected readonly roleLabels = { admin: 'Administrator', editor: 'Editor', viewer: 'Viewer' };

  /**
   * The presence of the user: a dot on the avatar and a word on the card. The menu only shows it;
   * the application knows it (here the user chooses it in the menu).
   */
  protected readonly presence = signal<GrdAvatarStatus>('online');

  /**
   * The commands of the application in the user menu, as in any menu: a label, `run`, and here
   * `checked`. An item with `children` is a heading in the panel, with its items under it. A
   * `computed`, so that the check mark follows the presence.
   */
  protected readonly items = computed<GrdMenuItem[]>(() => [
    {
      label: 'Presence',
      children: PRESENCES.map((choice) => ({
        label: choice.label,
        checked: this.presence() === choice.value,
        run: () => this.presence.set(choice.value),
      })),
    },
  ]);

  /** The last save of the profile (`null` before the first one). */
  protected readonly lastSave = signal<Save | null>(null);

  constructor() {
    // 1. The appearance of each user. auth.userKey(base) is the key of the user who is signed in
    //    (tutorial-194-theme:u-eva), and the base for nobody (tutorial-194-theme). The effect runs
    //    again when the key changes, so when somebody else signs in, each service takes the
    //    choice that was kept under the key of the new user.
    effect(() => {
      const theme = this.auth.userKey('tutorial-194-theme');
      const density = this.auth.userKey('tutorial-194-density');
      const language = this.auth.userKey('tutorial-194-language');
      // Only the keys start the effect, not what the services read while they switch.
      untracked(() => {
        this.theme.setStorageKey(theme);
        this.density.setStorageKey(density);
        this.language.setStorageKey(language);
      });
    });

    // 2. What the page holds belongs to the user: it goes when they sign out (also by "Switch
    //    account", which signs out first), and when somebody else signs in after the session has
    //    ended (then there is no signedOut: `previous` is the user who was there before).
    const forget = () => {
      this.lastSave.set(null);
      this.presence.set('online');
    };
    this.auth.on('signedOut', forget);
    this.auth.on('signedIn', (event) => {
      if (event.previous && event.previous.id !== event.user.id) forget();
    });
  }

  /**
   * Opens the profile of the user in a window (the same window again when it is open). `tab` is the
   * tab to show first: "Settings…" asks for the appearance, the rest for the first tab.
   */
  protected openProfile(tab?: string): void {
    this.profile.open({
      // The topics of the Notifications tab; without them the tab is left out.
      topics: TOPICS,
      selected: tab,
      // Every save that succeeds: the profile as the store answered it.
      saved: (profile) => this.lastSave.set({ at: new Date(), profile }),
    });
  }

  /** The profile as text. The photo is a long `data:` URL, so only its start is shown. */
  protected textOf(profile: GrdProfile): string {
    const photo = profile.avatar;
    const avatar = photo && photo.length > 40 ? `${photo.slice(0, 40)}…` : photo;
    return JSON.stringify({ ...profile, avatar }, null, 2);
  }
}
