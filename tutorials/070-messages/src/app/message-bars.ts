import { Component, signal } from '@angular/core';
import {
  GrdButton,
  GrdCheckbox,
  GrdMessageAction,
  GrdMessageBar,
  GrdMessageBarSpec,
  GrdMessageSeverity,
} from '@gridify/studio';

/** A text for each severity. */
const TEXTS: Record<GrdMessageSeverity, string> = {
  info: 'The document is shared with 3 people.',
  success: 'All 120 rows are imported.',
  warning: 'The price list is 40 days old.',
  error: 'The order cannot be sent: the customer has no address.',
};

/** A message bar in the page: the severities, buttons, a long text, a message without the cross, and the inputs of the bar. */
@Component({
  selector: 'app-message-bars',
  imports: [GrdButton, GrdCheckbox, GrdMessageBar],
  host: { class: 'demo' },
  template: `
    <h2>3. A message bar</h2>
    <p>
      A message bar stands in the page, where you put it: above a form, a table or an editor. It
      stays until it is closed or the application takes it away. Its message is a model, so
      [(message)] is all you write: the close cross sets it to null.
    </p>
    <div class="row">
      <span class="row-name">Severity</span>
      <grd-button label="Info" (pressed)="show('info')" />
      <grd-button label="Success" (pressed)="show('success')" />
      <grd-button label="Warning" (pressed)="show('warning')" />
      <grd-button label="Error" (pressed)="show('error')" />
    </div>
    <div class="row">
      <span class="row-name">More</span>
      <grd-button label="With buttons" (pressed)="offline()" />
      <grd-button label="Long text" (pressed)="long()" />
      <grd-button label="Without the cross" (pressed)="notClosable()" />
      <grd-button label="Take it away" (pressed)="message.set(null)" />
    </div>
    <div class="row">
      <span class="row-name">The bar</span>
      <grd-checkbox label="Close cross" [reserveMessageSpace]="false" [(checked)]="closable" />
      <grd-checkbox label="Icon" [reserveMessageSpace]="false" [(checked)]="showIcon" />
    </div>
    <div class="frame">
      <grd-message-bar
        [(message)]="message"
        [closable]="closable()"
        [showIcon]="showIcon()"
        (closed)="closed($event)"
        (actionInvoked)="invoked($event)"
      />
      <div class="content">The form, the table or the editor that the message is about.</div>
    </div>
    <output class="answer">Answer: {{ answer() }}</output>
  `,
  styles: `
    .frame {
      margin-bottom: 8px;
      border: 1px solid var(--grd-border-color);
      background: var(--grd-bg-panel);
    }
    .content {
      padding: 24px 12px;
      opacity: 0.88;
    }
  `,
})
export class MessageBars {
  /** The message of the bar, or null for none. */
  protected readonly message = signal<GrdMessageBarSpec | null>(null);
  /** The inputs of the bar: for the messages that do not say it themselves. */
  protected readonly closable = signal(true);
  protected readonly showIcon = signal(true);
  protected readonly answer = signal('none yet');

  protected show(severity: GrdMessageSeverity): void {
    this.message.set({ text: TEXTS[severity], severity });
  }

  /** Buttons before the cross. A button does not close the bar: its run puts another message in (or null). */
  protected offline(): void {
    this.message.set({
      text: 'You are offline. The changes are kept on this computer until the connection is back.',
      severity: 'warning',
      actions: [
        {
          label: 'Try again',
          variant: 'primary',
          run: () =>
            this.message.set({
              text: 'Connected again. The changes are saved.',
              severity: 'success',
            }),
        },
        { label: 'Work offline', run: () => this.message.set(null) },
      ],
    });
  }

  /** A long text wraps to more lines: the bar grows with it. */
  protected long(): void {
    this.message.set({
      text:
        'The licence for this computer ends on 30 November 2026. After that day the documents can ' +
        'still be opened and printed, but not changed. Ask the administrator of your organization ' +
        'for a new licence key, or enter one in Settings. The text is long on purpose: the bar ' +
        'wraps it to more lines and grows with it.',
      severity: 'info',
    });
  }

  /** closable in the message wins over the input of the bar: this one has no cross whatever the checkbox says. */
  protected notClosable(): void {
    this.message.set({
      text: 'The server restarts at 18:00 for maintenance. Save your work before then.',
      severity: 'warning',
      closable: false,
    });
  }

  /** The cross was pressed: the model is null already, and closed tells which message it was. */
  protected closed(message: GrdMessageBarSpec): void {
    this.answer.set(`closed: "${message.text}"`);
  }

  protected invoked(action: GrdMessageAction): void {
    this.answer.set(`actionInvoked: ${action.label}`);
  }
}
