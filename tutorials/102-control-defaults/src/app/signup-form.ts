import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GrdCheckbox, GrdInput, GrdPassword, GrdSwitch } from '@gridify/studio';

/**
 * A document: a sign-up form. None of its controls says how its message looks, when it checks,
 * or what shape it has: they all take the defaults of the application.
 */
@Component({
  selector: 'app-signup-form',
  imports: [ReactiveFormsModule, GrdCheckbox, GrdInput, GrdPassword, GrdSwitch],
  template: `
    <form [formGroup]="form">
      <grd-input label="Name" formControlName="name" required />
      <grd-input label="E-mail" type="email" formControlName="email" required />
      <grd-password label="Password" formControlName="password" required />
      <grd-switch label="Send me the newsletter" formControlName="newsletter" />
      <grd-checkbox label="I agree with the terms" formControlName="terms" required />
    </form>
  `,
  styles: `
    :host {
      display: block;
      padding: 12px 20px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 24em;
    }
  `,
})
export class SignupForm {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    newsletter: [false],
    terms: [false, Validators.requiredTrue],
  });
}
