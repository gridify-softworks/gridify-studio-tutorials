import { Component, inject, signal } from '@angular/core';
import { GrdButton, GrdI18n, GrdInput, t, tx } from '@gridify/studio';

/** A tool that writes lines: a line is a string, written once, in the language of that moment. */
@Component({
  selector: 'app-log',
  imports: [GrdButton, GrdInput],
  template: `
    <grd-input [label]="i18n.text('Your name')" [(value)]="name" />
    <!-- a signal: it follows the language and the name -->
    <p class="greeting">{{ greeting() }}</p>
    <div class="buttons">
      <grd-button [label]="i18n.text('Write a line')" (pressed)="write()" />
      <!-- the same English word as the line below, another meaning: the context tells them apart -->
      <grd-button [label]="i18n.text('Empty', { context: 'command' })" (pressed)="lines.set([])" />
    </div>
    @for (line of lines(); track $index) {
      <p class="line">{{ line }}</p>
    } @empty {
      <p class="line">{{ i18n.text('Empty') }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      font-size: var(--grd-font-size-base);
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
    p {
      margin: 0;
    }
    .line {
      opacity: 0.88;
    }
  `,
})
export class Log {
  protected readonly i18n = inject(GrdI18n);
  protected readonly name = signal('Ana');
  protected readonly lines = signal<string[]>([]);
  /** A signal as the value of {name}: the text changes with the language and with the name. */
  protected readonly greeting = t('Hello, {name}!', { name: this.name });

  /** tx gives a string now: the line keeps the language it was written in. */
  protected write(): void {
    const time = new Date().toLocaleTimeString(this.i18n.language(), { timeStyle: 'short' });
    this.lines.update((lines) => [
      ...lines,
      tx('Greeting for {name} at {time}', { name: this.name(), time }),
    ]);
  }
}
