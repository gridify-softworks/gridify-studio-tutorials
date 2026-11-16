import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import {
  GrdButton,
  GrdDatePicker,
  GrdInput,
  type GrdProfileFailure,
  GrdProfileState,
  GrdSelect,
  GrdSwitch,
  GrdTextarea,
} from '@gridify/studio';
import {
  type Away,
  DEPARTMENTS,
  JOB_TITLE_MAX,
  type TeamProfile,
  type TeamProfilePatch,
  today,
} from './team-profile';

/**
 * A page of the application in the profile: the work of the user (the job title, the department)
 * and the out of office. The server keeps these fields with the profile, so the page reads them
 * from the profile and saves them through it: `GrdProfileState`, which `grd-user-profile` gives to
 * all its pages, those of the library and those of the application.
 */
@Component({
  selector: 'app-work-page',
  imports: [GrdButton, GrdDatePicker, GrdInput, GrdSelect, GrdSwitch, GrdTextarea],
  template: `
    <form novalidate (submit)="save($event)">
      <section class="section">
        <h3 class="heading">Your work</h3>
        <div class="columns">
          <grd-input
            label="Job title"
            [maxlength]="max"
            [disabled]="state.busy()"
            [(value)]="jobTitle"
          />
          <grd-select
            label="Department"
            [options]="departments"
            [disabled]="state.busy()"
            [(value)]="department"
          />
        </div>
      </section>

      <section class="section">
        <h3 class="heading">Out of office</h3>
        <grd-switch label="I am away" [disabled]="state.busy()" [(checked)]="away" />
        @if (away()) {
          <div class="columns">
            <grd-date-picker
              label="The last day away"
              required
              [min]="firstDay"
              [disabled]="state.busy()"
              [(value)]="until"
            />
          </div>
          <grd-textarea
            label="What the others read meanwhile"
            required
            [rows]="3"
            [disabled]="state.busy()"
            [(value)]="message"
          />
        }
      </section>

      <div class="actions">
        <grd-button
          type="submit"
          label="Save"
          variant="primary"
          [busy]="saving()"
          [disabled]="!dirty() || state.busy()"
        />
        <grd-button
          label="Revert"
          appearance="flat"
          [disabled]="!dirty() || state.busy()"
          (pressed)="revert()"
        />
        <span class="status" role="status">{{ statusText() }}</span>
      </div>
      @if (error(); as text) {
        <p class="error" role="alert">{{ text }}</p>
      }
    </form>
  `,
  styles: `
    /* The look of the pages of the library: a column of sections, as wide as they are at most. */
    :host {
      display: block;
      max-inline-size: var(--grd-profile-max-width, 38em);
      color: var(--grd-text-active);
    }
    form {
      display: grid;
      gap: 16px;
    }
    .section {
      display: grid;
      gap: 8px;
    }
    .section + .section {
      padding-block-start: 14px;
      border-block-start: 1px solid var(--grd-border-color);
    }
    .heading {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
    }
    .columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(15em, 100%), 1fr));
      column-gap: 16px;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status {
      opacity: 0.88;
    }
    .error {
      margin: 0;
      color: var(--grd-danger-text);
      font-weight: 600;
    }
  `,
})
export class WorkPage {
  /** What the pages of the profile share: the profile, the user and the calls of the store. */
  protected readonly state = inject(GrdProfileState);
  protected readonly departments = DEPARTMENTS;
  protected readonly max = JOB_TITLE_MAX;
  /** The first day that may be the last day away. */
  protected readonly firstDay = today();

  /**
   * The profile as the store gave it. The library types it as its own `GrdProfile`; the store of
   * this application gives a `TeamProfile`, with the fields of the application in it.
   */
  private readonly profile = computed(() => this.state.profile() as TeamProfile | null);

  // What the profile has, field by field. Every save gives a new profile (a save of the Profile tab
  // too), but a computed whose value stays the same does not wake what reads it: the fields of the
  // form below follow a field of the profile only when that field changed.
  private readonly savedJobTitle = computed(() => this.profile()?.jobTitle ?? '');
  private readonly savedDepartment = computed(() => this.profile()?.department ?? null);
  private readonly savedAway = computed(() => this.profile()?.away ?? null, { equal: sameAway });

  // The fields of the form. Each one starts from the profile and keeps what the user types; when
  // its field of the profile changes (a save of this page), it takes the new value.
  protected readonly jobTitle = linkedSignal(() => this.savedJobTitle());
  protected readonly department = linkedSignal(() => this.savedDepartment());
  protected readonly away = linkedSignal(() => this.savedAway() !== null);
  protected readonly until = linkedSignal(() => this.savedAway()?.until ?? today());
  protected readonly message = linkedSignal(() => this.savedAway()?.message ?? '');

  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal('');

  /** What a save sends: the fields that differ from the profile, and nothing else. */
  private readonly patch = computed<TeamProfilePatch>(() => {
    const profile = this.profile();
    if (!profile) return {};
    const jobTitle = this.jobTitle().trim();
    const department = this.department() ?? profile.department;
    const away: Away | null = this.away()
      ? { until: this.until(), message: this.message().trim() }
      : null;
    return {
      ...(jobTitle !== profile.jobTitle ? { jobTitle } : {}),
      ...(department !== profile.department ? { department } : {}),
      ...(!sameAway(away, profile.away) ? { away } : {}),
    };
  });

  protected readonly dirty = computed(() => Object.keys(this.patch()).length > 0);

  protected readonly statusText = computed(() => {
    if (this.saving()) return 'Saving…';
    if (this.dirty()) return 'Not saved yet.';
    return this.saved() ? 'Saved.' : '';
  });

  /**
   * Save: the patch goes to `save` of the store as it is, with the fields of the application. The
   * answer of the store is then the profile of every page (and `saved` of the window gets it).
   * The call never throws: a refusal, or a store that failed, is `{ status: 'error' }`.
   */
  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.dirty() || this.state.busy()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    const result = await this.state.save(this.patch());
    this.saving.set(false);
    if (result.status === 'ok') this.saved.set(true);
    else this.error.set(failureText(result));
  }

  /** Revert: the fields as the profile has them. */
  protected revert(): void {
    const profile = this.profile();
    if (!profile) return;
    this.jobTitle.set(profile.jobTitle);
    this.department.set(profile.department);
    this.away.set(profile.away != null);
    this.until.set(profile.away?.until ?? today());
    this.message.set(profile.away?.message ?? '');
    this.error.set('');
  }
}

/** Are two absences the same? */
function sameAway(a: Away | null, b: Away | null): boolean {
  if (a === null || b === null) return a === b;
  return a.until === b.until && a.message === b.message;
}

/**
 * What a refusal says to the user. The codes of this application come with a message of the
 * server. The library has texts for its own codes, but they are its own: the page says the ones it
 * can get (a store that throws gives `network` or `forbidden`) in its own words.
 */
function failureText(failure: GrdProfileFailure): string {
  if (failure.code === 'network') return 'The server cannot be reached. Try it again.';
  if (failure.code === 'forbidden') return 'The server did not let you. Sign in again.';
  return failure.message ?? 'Something went wrong.';
}
