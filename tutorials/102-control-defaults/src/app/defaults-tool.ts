import { Component, inject } from '@angular/core';
import {
  GrdAccordion,
  GrdButton,
  type GrdCheckboxShape,
  GrdControlDefaults,
  GrdExpander,
  GrdSwitch,
  type GrdSwitchShape,
  GrdToggleGroup,
  type GrdValidateOn,
} from '@gridify/studio';

/**
 * A tool: the settings of the defaults. Every default is a signal: a change here changes every
 * control of the application at once (those that do not set their own input).
 */
@Component({
  selector: 'app-defaults-tool',
  imports: [GrdAccordion, GrdButton, GrdExpander, GrdSwitch, GrdToggleGroup],
  template: `
    <grd-accordion ariaLabel="Defaults" multiple>
      <grd-expander
        heading="Messages"
        description="Where and how a field says what is wrong"
        [expanded]="true"
      >
        <grd-toggle-group
          label="Place and look"
          [options]="messages"
          [value]="defaults.message()"
          (valueChange)="defaults.message.set($event ?? 'bottom right text')"
        />
        <grd-toggle-group
          label="Check a field"
          [options]="checks"
          [value]="defaults.validateOn()"
          (valueChange)="defaults.validateOn.set($event ?? 'touched')"
        />
      </grd-expander>

      <grd-expander heading="Check boxes and switches" description="Their shapes">
        <grd-toggle-group
          label="Check box"
          [options]="checkboxShapes"
          [value]="defaults.checkboxShape()"
          (valueChange)="defaults.checkboxShape.set($event ?? 'rounded')"
        />
        <grd-toggle-group
          label="Switch"
          [options]="switchShapes"
          [value]="defaults.switchShape()"
          (valueChange)="defaults.switchShape.set($event ?? 'round')"
        />
      </grd-expander>

      <grd-expander heading="Passwords" description="What a password field shows">
        <grd-switch
          label="The eye that shows the password"
          [checked]="defaults.passwordEye()"
          (checkedChange)="defaults.passwordEye.set($event)"
        />
        <grd-switch
          label="How strong the password is"
          [checked]="defaults.passwordStrength()"
          (checkedChange)="defaults.passwordStrength.set($event)"
        />
      </grd-expander>
    </grd-accordion>

    <grd-button label="Back to the start" (pressed)="reset()" />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 12px;
    }
  `,
})
export class DefaultsTool {
  /** The defaults of all the controls of the application. */
  protected readonly defaults = inject(GrdControlDefaults);

  protected readonly messages = [
    { value: 'bottom right text', label: 'Under, text' },
    { value: 'bottom left badge', label: 'Under, badge' },
    { value: 'top right badge', label: 'Above, badge' },
  ];
  protected readonly checks: { value: GrdValidateOn; label: string }[] = [
    { value: 'touched', label: 'After leaving it' },
    { value: 'input', label: 'While typing' },
  ];
  protected readonly checkboxShapes: { value: GrdCheckboxShape; label: string }[] = [
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
    { value: 'round', label: 'Round' },
  ];
  protected readonly switchShapes: { value: GrdSwitchShape; label: string }[] = [
    { value: 'round', label: 'Round' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
  ];

  /** Every default goes back to its start: the value of provideGrdControlDefaults, else the library's. */
  protected reset(): void {
    for (const value of [
      this.defaults.message,
      this.defaults.validateOn,
      this.defaults.checkboxShape,
      this.defaults.switchShape,
      this.defaults.passwordEye,
      this.defaults.passwordStrength,
    ]) {
      value.reset();
    }
  }
}
