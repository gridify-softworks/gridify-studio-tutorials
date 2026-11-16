import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  GrdButton,
  GrdCheckbox,
  GrdDatePicker,
  GrdInput,
  GrdOption,
  GrdSelect,
  GrdToast,
} from '@gridify/studio';

type CardKind = 'standard' | 'silver' | 'gold';

@Component({
  selector: 'app-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GrdInput,
    GrdDatePicker,
    GrdSelect,
    GrdCheckbox,
    GrdButton,
  ],
  template: `
    <h1>Customer card</h1>
    <p>A form of library fields on the page <code>/form</code>.</p>
    <form [formGroup]="form" (ngSubmit)="clicked('Register')">
      <grd-input
        label="First name"
        formControlName="firstName"
        required
        autocomplete="given-name"
      />
      <grd-input label="Last name" formControlName="lastName" required autocomplete="family-name" />
      <!-- validateOn="input": the e-mail is checked while it is typed, not only after the field is left -->
      <grd-input
        label="E-mail"
        type="email"
        formControlName="email"
        required
        validateOn="input"
        autocomplete="email"
        hint="The card is sent to this address."
      />
      <grd-input label="Phone" type="tel" formControlName="phone" autocomplete="tel" />
      <grd-date-picker label="Date of birth" formControlName="birthDate" />
      <grd-select label="Card" formControlName="card" [options]="cards" />
      <grd-checkbox class="wide" label="Send me news and offers" formControlName="newsletter" />
      <grd-checkbox
        class="wide"
        label="I agree with the terms of the card"
        formControlName="terms"
      />
      <div class="buttons wide">
        <grd-button type="submit" variant="primary" label="Register" />
        <grd-button label="Cancel" (pressed)="clicked('Cancel')" />
      </div>
    </form>
    <a routerLink="/table">← Back to the table</a>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px 20px;
    }
    h1,
    p {
      margin: 0;
    }
    h1 {
      font-size: 1.15rem;
    }
    a {
      align-self: start;
      color: var(--grd-link-color, var(--grd-accent));
    }
    /* Two columns of fields; one on a narrow screen. */
    form {
      display: grid;
      grid-template-columns: repeat(2, minmax(200px, 320px));
      gap: 4px 16px;
      align-items: start;
    }
    .wide {
      grid-column: 1 / -1;
    }
    .buttons {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    @media (max-width: 560px) {
      form {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class FormPage {
  private readonly toast = inject(GrdToast);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    birthDate: new FormControl<string | null>(null),
    card: new FormControl<CardKind>('standard', { nonNullable: true }),
    newsletter: new FormControl(false, { nonNullable: true }),
    terms: new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue }),
  });

  protected readonly cards: GrdOption<CardKind>[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'silver', label: 'Silver' },
    { value: 'gold', label: 'Gold' },
  ];

  /** The buttons only say that they were clicked. */
  protected clicked(button: string): void {
    this.toast.info(`The button ${button} was clicked.`);
  }
}
