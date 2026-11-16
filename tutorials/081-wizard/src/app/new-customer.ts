import { Component, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GrdButton,
  GrdCheckbox,
  GrdInput,
  type GrdOption,
  GrdSelect,
  GrdTabContext,
  GrdWizard,
  GrdWizardDone,
  GrdWizardStep,
} from '@gridify/studio';
import { type Customer, Customers, showTab } from './customers';

/** A document: the wizard of a new customer, in three steps. */
@Component({
  selector: 'app-new-customer',
  imports: [
    ReactiveFormsModule,
    GrdButton,
    GrdCheckbox,
    GrdInput,
    GrdSelect,
    GrdWizard,
    GrdWizardDone,
    GrdWizardStep,
  ],
  template: `
    <grd-wizard [finished]="finished()" (finishedChange)="onFinished($event)">
      <!-- Step 1. [valid]: Continue is greyed out until the form of the step is in order. -->
      <grd-wizard-step
        label="Company"
        heading="The company"
        description="Who is the new customer?"
        [formGroup]="company"
        [valid]="company.valid"
      >
        <grd-input label="Company name" formControlName="name" required />
        <grd-select
          label="Country"
          placeholder="Choose"
          [options]="countries"
          formControlName="country"
          required
        />
      </grd-wizard-step>

      <!-- Step 2. -->
      <grd-wizard-step
        label="Contact"
        heading="The contact person"
        description="Who do we write to?"
        [formGroup]="contact"
        [valid]="contact.valid"
      >
        <grd-input label="Name" formControlName="name" required />
        <grd-input label="E-mail" type="email" formControlName="email" required />
      </grd-wizard-step>

      <!-- Step 3: what was typed, to check it. On the last step Continue says Finish. -->
      <grd-wizard-step label="Check" heading="Is it all right?">
        <dl>
          <dt>Company</dt>
          <dd>{{ company.value.name }}, {{ company.value.country }}</dd>
          <dt>Contact</dt>
          <dd>{{ contact.value.name }}, {{ contact.value.email }}</dd>
        </dl>
        <grd-checkbox label="Send a welcome e-mail" [formControl]="welcome" />
      </grd-wizard-step>

      <!-- What the wizard shows when it is finished, instead of the steps. -->
      <div grdWizardDone>
        <h3>{{ added()?.company }} is a customer now.</h3>
        <p>{{ welcome.value ? 'A welcome e-mail is on its way.' : 'No e-mail was sent.' }}</p>
        <div class="buttons">
          <grd-button label="Show the list" variant="primary" (pressed)="showList()" />
          <grd-button label="Add another" (pressed)="again()" />
        </div>
      </div>
    </grd-wizard>
  `,
  styles: `
    :host {
      display: block;
      max-width: 40em;
      padding: 12px 20px;
    }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
    }
    dd {
      margin: 0;
    }
    .buttons {
      display: flex;
      gap: 8px;
    }
  `,
})
export class NewCustomer {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly customers = inject(Customers);
  /** The tab of the wizard: through it the wizard reaches the engine. */
  private readonly tab = inject(GrdTabContext);
  private readonly wizard = viewChild.required(GrdWizard);

  /** One form for each step: a step is valid when its form is. */
  protected readonly company = this.fb.group({
    name: ['', Validators.required],
    country: ['', Validators.required],
  });
  protected readonly contact = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly welcome = this.fb.control(true);

  protected readonly countries: GrdOption<string>[] = [
    { value: 'Czech Republic', label: 'Czech Republic' },
    { value: 'Germany', label: 'Germany' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'United States', label: 'United States' },
  ];

  protected readonly finished = signal(false);
  /** The customer that Finish added. */
  protected readonly added = signal<Customer | null>(null);

  /** Finish was pressed: the wizard saves nothing itself, the page does it now. */
  protected onFinished(finished: boolean): void {
    this.finished.set(finished);
    if (!finished) return;
    const customer: Customer = {
      company: this.company.getRawValue().name,
      country: this.company.getRawValue().country,
      contact: this.contact.getRawValue().name,
      email: this.contact.getRawValue().email,
    };
    this.customers.add(customer);
    this.added.set(customer);
  }

  protected showList(): void {
    showTab(this.tab.engine, 'customers', 'Customers', 'customers');
  }

  /** The wizard and its forms start again, for the next customer. */
  protected again(): void {
    this.company.reset();
    this.contact.reset();
    this.welcome.reset();
    this.finished.set(false);
    this.wizard().reset();
  }
}
