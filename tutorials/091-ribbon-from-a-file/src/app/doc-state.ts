import { computed, Injectable, signal, type WritableSignal } from '@angular/core';

/**
 * The state of the document the ribbon works on. The ribbon never owns it: the files of the ribbon only name the signals that follow
 * (`{ "$bind": "noSelection" }`, `s.field('fontSize', 11)`), and the application registers them when it loads the file.
 */
@Injectable({ providedIn: 'root' })
export class DocState {
  // What the page says about the document (the switches on the page).
  readonly hasSelection = signal(true);
  readonly noSelection = computed(() => !this.hasSelection());
  readonly pictureSelected = signal(false);
  readonly noPicture = computed(() => !this.pictureSelected());

  // The clipboard is empty until Cut or Copy: Paste is off until then.
  readonly clipboard = signal('');
  readonly noClipboard = computed(() => this.clipboard() === '');

  // Switches of the ribbon: the ribbon sets a writable signal itself when the user clicks.
  readonly bold = signal(false);
  readonly italic = signal(false);
  readonly underline = signal(false);
  readonly ruler = signal(true);
  readonly gridlines = signal(false);
  readonly zoom = signal(100);

  // A choice of one of several: the ribbon only says which one was clicked (the action), and the application sets the signal. The
  // controls read the choices from computed signals.
  readonly align = signal<'left' | 'center' | 'right'>('left');
  readonly alignLeft = computed(() => this.align() === 'left');
  readonly alignCenter = computed(() => this.align() === 'center');
  readonly alignRight = computed(() => this.align() === 'right');
  readonly layout = signal<'print' | 'web' | 'outline'>('print');
  readonly layoutPrint = computed(() => this.layout() === 'print');
  readonly layoutWeb = computed(() => this.layout() === 'web');
  readonly layoutOutline = computed(() => this.layout() === 'outline');

  // The words of the document, and what the status bar of the View tab makes of them.
  readonly words = signal(42);
  readonly goalPercent = computed(() => Math.min(100, Math.round((this.words() / 100) * 100)));
  readonly pagesPercent = computed(() => (this.words() % 50) * 2);

  private readonly fields = new Map<string, WritableSignal<unknown>>();
  private readonly names = signal<readonly string[]>([]);

  /**
   * `s.field('fontSize', 11)` in a file: the signal of the application with that name. The first time it is asked for it starts with the
   * value that the file gives, so the file says where the document starts and the application keeps what changes.
   */
  field<T>(name: string, fallback: T): WritableSignal<T> {
    let found = this.fields.get(name);
    if (!found) {
      this.fields.set(name, (found = signal<unknown>(fallback)));
      this.names.update((names) => [...names, name]);
    }
    return found as WritableSignal<T>;
  }

  /** `s.flag('wrap', true)`: the same for a switch. */
  flag(name: string, fallback: boolean): WritableSignal<boolean> {
    return this.field(name, fallback);
  }

  /** What the page shows of the fields that the files started: `fontSize: 11`. */
  readonly fieldLines = computed(() =>
    this.names().map((name) => `${name}: ${String(this.fields.get(name)?.())}`),
  );
}
