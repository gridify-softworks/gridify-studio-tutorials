import { Injectable } from '@angular/core';
import {
  type GrdDemoAccount,
  grdProfileOk,
  type GrdPasswordChange,
  type GrdProfileFailure,
  type GrdProfileResult,
  type GrdProfileStore,
} from '@gridify/studio';
import { demoServer } from './demo-server';
import { JOB_TITLE_MAX, type TeamProfile, type TeamProfilePatch, today } from './team-profile';

/** The profiles that the pretend server keeps, by the id of the user (in memory: F5 starts again). */
const profiles = new Map<string, TeamProfile>();

/** What the server knows of the work of the accounts at the start. */
const WORK: Record<string, Pick<TeamProfile, 'jobTitle' | 'department'>> = {
  eva: { jobTitle: 'Head of finance', department: 'finance' },
  jan: { jobTitle: 'Support engineer', department: 'support' },
  petra: { jobTitle: 'Sales assistant', department: 'sales' },
};

/** A pause as long as a request to a server takes. */
const serverPause = () => new Promise((resolve) => setTimeout(resolve, 300));

/**
 * The store of the profile (see 194): the profile of the library loads and saves through it. The
 * profile of this application has fields of its own (`TeamProfile`), and the store keeps them with
 * the fields of the library: one profile, one request to load it, one to save it.
 *
 * A real store calls its server with HttpClient (the request is in the comment of each method).
 * This one plays the server in the browser, so the tutorial runs without one.
 */
@Injectable({ providedIn: 'root' })
export class TeamProfileStore implements GrdProfileStore {
  /** GET /api/profile: the profile of the signed-in user, with the fields of the application. */
  async load(): Promise<TeamProfile> {
    await serverPause();
    return this.profileOf(this.whoAsks());
  }

  /**
   * PATCH /api/profile with the fields that changed: the Profile tab of the library sends its own
   * (`displayName`, `email`, `phone`), the page Work of the application its own (`jobTitle`,
   * `department`, `away`). The answer is the whole profile as the server has it now, or a refusal.
   */
  async save(patch: TeamProfilePatch): Promise<GrdProfileResult<TeamProfile>> {
    await serverPause();
    const account = this.whoAsks();
    // The server checks the fields of the application as it checks the others. (The fields of
    // the page say what they can before a save, but the server decides.)
    const refusal = this.check(patch);
    if (refusal) return refusal;
    const profile: TeamProfile = { ...this.profileOf(account), ...patch };
    profiles.set(account.user.id, profile);
    // The account keeps the name and the e-mail too, so that the next sign-in brings them.
    demoServer.editProfile({ displayName: profile.displayName, email: profile.email });
    return grdProfileOk(profile);
  }

  /** POST /api/profile/password: with it the profile has the tab Security (see 194). */
  changePassword(change: GrdPasswordChange): Promise<GrdProfileResult> {
    return demoServer.changePassword(change);
  }

  /**
   * The rules of the server for the fields of the application. A refusal has a code of the
   * application and a message: the library has no text for such a code, the page shows its own.
   */
  private check(patch: TeamProfilePatch): GrdProfileFailure | null {
    if (patch.jobTitle !== undefined && patch.jobTitle.length > JOB_TITLE_MAX) {
      const message = `A job title has at most ${JOB_TITLE_MAX} characters.`;
      return { status: 'error', code: 'job-title-long', message };
    }
    if (patch.away) {
      if (!patch.away.message.trim()) {
        const message = 'Write what the others read while you are away.';
        return { status: 'error', code: 'away-message', message };
      }
      if (patch.away.until < today()) {
        const message = 'The last day away is in the past.';
        return { status: 'error', code: 'away-past', message };
      }
    }
    return null;
  }

  /** Who asks: the server knows it from its own session. Nobody: 401, and the profile says so. */
  private whoAsks(): GrdDemoAccount {
    const account = demoServer.signedAccount();
    if (!account) throw { status: 401 };
    return account;
  }

  /** The profile of a user; the first time, made from the account. */
  private profileOf(account: GrdDemoAccount): TeamProfile {
    const kept = profiles.get(account.user.id);
    if (kept) return kept;
    return {
      displayName: account.user.displayName ?? account.user.name,
      email: account.user.email ?? '',
      phone: '',
      ...(WORK[account.username] ?? { jobTitle: '', department: 'it' }),
      away: null,
    };
  }
}
