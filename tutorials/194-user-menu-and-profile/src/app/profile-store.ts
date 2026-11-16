import { Injectable } from '@angular/core';
import {
  type GrdDemoAccount,
  grdProfileOk,
  type GrdPasswordChange,
  type GrdProfile,
  type GrdProfilePatch,
  type GrdProfileResult,
  type GrdProfileSession,
  type GrdProfileStore,
} from '@gridify/studio';
import { demoServer } from './demo-server';

/** The profiles that the pretend server keeps, by the id of the user (in memory: F5 starts again). */
const profiles = new Map<string, GrdProfile>();
/** The other places where each user is signed in, by the id of the user. */
const places = new Map<string, GrdProfileSession[]>();

/** The largest photo this server takes. (The page itself turns back a file over 2 MB.) */
const PHOTO_MAX = 1024 * 1024;

/** A pause as long as a request to a server takes. */
const serverPause = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The store of the profile: the profile of the library (`GrdProfileDialog`, `grd-user-profile`)
 * loads and saves through it. The library does not know the server of the application, so the
 * application writes this one class.
 *
 * A real store calls its server with HttpClient (the request is in the comment of each method).
 * This one plays the server in the browser, so the tutorial runs without one: each method does
 * what the server would do, and answers what the server would answer.
 *
 * The methods after `save` are optional: the profile draws only what the store can do (without
 * `uploadAvatar` no button for a photo, without `changePassword` no form of the password, without
 * `sessions` no list of the places).
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore implements GrdProfileStore {
  /** GET /api/profile: the profile of the signed-in user. */
  async load(): Promise<GrdProfile> {
    await serverPause();
    return this.profileOf(this.whoAsks());
  }

  /**
   * PATCH /api/profile with the fields that changed. The answer is the profile as the server has it
   * now, or a refusal with a code that the profile has a text for.
   */
  async save(patch: GrdProfilePatch): Promise<GrdProfileResult<GrdProfile>> {
    await serverPause();
    const account = this.whoAsks();
    // The server checks what the browser cannot: an e-mail that another account has already.
    if (patch.email !== undefined && this.emailTaken(patch.email, account)) {
      return { status: 'error', code: 'email-taken' };
    }
    // The fields that came replace the ones that were there; the others stay.
    const profile = { ...this.profileOf(account), ...patch };
    profiles.set(account.user.id, profile);
    // The account keeps the name, the e-mail and the photo too, so that the next sign-in brings
    // the user as the server has them now. (The profile of the library puts the change into the
    // session of this window by itself: the user menu shows it at once.)
    demoServer.editProfile({
      displayName: profile.displayName,
      email: profile.email,
      avatar: profile.avatar ?? null,
    });
    // The second factor: from the next sign-in on, the pretend server asks for the code (123456).
    if (patch.twoFactor !== undefined) demoServer.setSecondFactor(patch.twoFactor);
    return grdProfileOk(profile);
  }

  /** POST /api/profile/photo: keeps a photo and answers with its address. */
  async uploadAvatar(file: File): Promise<GrdProfileResult<string>> {
    await serverPause();
    // Only somebody who is signed in may (whoAsks throws for nobody).
    this.whoAsks();
    if (!file.type.startsWith('image/')) return { status: 'error', code: 'file-type' };
    if (file.size > PHOTO_MAX) return { status: 'error', code: 'file-size' };
    // A real server keeps the file and answers with its URL; here the photo is a `data:` URL.
    // The profile then saves itself with it (`save({ avatar })`).
    return grdProfileOk(await readAsDataUrl(file));
  }

  /** POST /api/profile/password: the pretend server checks the current password and the new one. */
  changePassword(change: GrdPasswordChange): Promise<GrdProfileResult> {
    return demoServer.changePassword(change);
  }

  /** GET /api/profile/sessions: this browser, and the other places where the user is signed in. */
  async sessions(): Promise<readonly GrdProfileSession[]> {
    await serverPause();
    const account = this.whoAsks();
    // `current` marks the session that asks: the list has no "Sign out" for it.
    const here: GrdProfileSession = {
      id: 'here',
      name: 'This browser',
      lastSeen: Date.now(),
      current: true,
    };
    return [here, ...this.placesOf(account)];
  }

  /** DELETE /api/profile/sessions/{id}: ends the session of another place. */
  async revokeSession(id: string): Promise<GrdProfileResult> {
    await serverPause();
    const account = this.whoAsks();
    const left = this.placesOf(account).filter((place) => place.id !== id);
    places.set(account.user.id, left);
    return grdProfileOk();
  }

  /**
   * Who asks. A server knows it from its own session (the cookie or the token of the request),
   * never from what the browser says. Nobody: the server answers 401, and the profile says so.
   */
  private whoAsks(): GrdDemoAccount {
    const account = demoServer.signedAccount();
    if (!account) throw { status: 401 };
    return account;
  }

  /** The profile of a user; the first time, made from the account. */
  private profileOf(account: GrdDemoAccount): GrdProfile {
    const kept = profiles.get(account.user.id);
    if (kept) return kept;
    return {
      displayName: account.user.displayName ?? account.user.name,
      email: account.user.email ?? '',
      phone: '',
      avatar: null,
      // A profile that says whether the second factor is on gets its switch (the Security tab).
      twoFactor: demoServer.hasSecondFactor(account),
      // The topics of the notifications that are on (the topics themselves are in app.ts).
      notifications: { orders: true },
    };
  }

  /** The other places of a user; the first time, two made up. */
  private placesOf(account: GrdDemoAccount): GrdProfileSession[] {
    const id = account.user.id;
    if (!places.has(id)) {
      const hour = 60 * 60 * 1000;
      places.set(id, [
        {
          id: 'phone',
          name: 'Safari on iPhone',
          detail: 'Prague',
          lastSeen: Date.now() - 2 * hour,
        },
        { id: 'office', name: 'Edge on Windows', detail: 'Brno', lastSeen: Date.now() - 26 * hour },
      ]);
    }
    return places.get(id)!;
  }

  /** Does another account have this e-mail? */
  private emailTaken(email: string, account: GrdDemoAccount): boolean {
    const wanted = email.trim().toLowerCase();
    return demoServer
      .accountList()
      .filter((other) => other.user.id !== account.user.id)
      .some((other) => this.profileOf(other).email.toLowerCase() === wanted);
  }
}

/** The content of a file as a `data:` URL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
