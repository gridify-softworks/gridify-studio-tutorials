# 081 – A wizard

This tutorial shows a wizard (`grd-wizard`): a long task cut into steps that the user does one after another, here a new customer in three steps, in a tab of a docking application. You will learn how to:

- write the steps between the tags of the wizard (`grd-wizard-step`), each with its label, heading and description;
- keep the user on a step until its form is in order (`[valid]`), with a reactive form for each step;
- do what Finish means yourself (`(finishedChange)`): the wizard saves nothing;
- show your own panel at the end (`grdWizardDone`), with buttons that go on, and start again (`reset()`);
- open the wizard as a document of the engine, and go back to the list from it (`GrdTabContext`).

It continues 080 (dialogs): a task with steps fits better in a tab than in a dialog, because the user can leave it, look at something else, and come back to it.

```
npm run tutorial 081
```

In the root of the repository: one `npm i` there is enough for all the tutorials, and every tutorial has an address of its own (see [the tutorials](../README.md)).

Open http://localhost:30081 and press **New customer…**.

## The words first

- **A step** is a part of the task: here _Company_, _Contact_ and _Check_. The row of numbered circles at the top says where the user is; the circles of the steps that are done have a tick.
- **A valid step** lets the user go on. A step that is not valid keeps Continue greyed out.
- **Finish** is the Continue of the last step. The wizard then shows the panel of the end instead of the steps.
- **All the steps are alive all the time**, only the current one is shown: what was typed stays when the user goes back and forth.

## Step by step

### Step 1: the customers

`src/app/customers.ts` has the list of the customers and a small function that shows a tab by its tag (or opens it):

```ts
import { Injectable, signal } from '@angular/core';
import type { GrdDockingEngine } from '@gridify/studio';

/** A customer of the list. */
export interface Customer {
  readonly company: string;
  readonly country: string;
  readonly contact: string;
  readonly email: string;
}

/** The customers. A real application keeps them on its server. */
@Injectable({ providedIn: 'root' })
export class Customers {
  readonly list = signal<readonly Customer[]>([
    {
      company: 'Northwind',
      country: 'United Kingdom',
      contact: 'Chloe Martin',
      email: 'chloe@northwind.example',
    },
    {
      company: 'Contoso',
      country: 'United States',
      contact: 'Ben Carter',
      email: 'ben@contoso.example',
    },
    {
      company: 'Kavárna Slavia',
      country: 'Czech Republic',
      contact: 'Jana Svobodová',
      email: 'jana@slavia.example',
    },
  ]);

  add(customer: Customer): void {
    this.list.update((list) => [...list, customer]);
  }
}

/** Shows a tab by its tag when it is open, or opens it. */
export function showTab(
  engine: GrdDockingEngine,
  tag: string,
  title: string,
  componentKey: string,
): void {
  const [tab] = engine.api.getByTag(tag);
  if (tab) engine.api.activateTab(tab.id);
  else engine.openComponentTab({ tag, title, componentKey });
}
```

### Step 2: the list, and the way to the wizard

`src/app/customer-list.ts` is the first document. Its button opens the wizard in a tab of its own:

```ts
export class CustomerList {
  protected readonly customers = inject(Customers);
  /** The tab of this list: through it the list reaches the engine. */
  private readonly tab = inject(GrdTabContext);

  /** The wizard opens in a tab of its own (or the open one is shown). */
  protected newCustomer(): void {
    showTab(this.tab.engine, 'new-customer', 'New customer', 'new-customer');
  }
}
```

A component in a tab gets a `GrdTabContext` from the engine; its `engine` is the engine the tab is in. The tag `new-customer` keeps the wizard in one tab: pressed again, the button shows the tab that is open.

### Step 3: the steps

`src/app/new-customer.ts` is the wizard. Its template:

<!-- prettier-ignore -->
```html
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
```

- **`grd-wizard-step`** is a step: `label` is the name under its circle, `heading` and `description` stand at the top of the step. Anything goes into a step: here the fields of a form.
- **`[formGroup]` on the step** binds its fields to the form of the step (`formControlName`), and **`[valid]="company.valid"`** says whether the step is in order: Continue is greyed out until it is.
- **The last step** shows what was typed, so the user can check it; its Continue is called **Finish**.
- **`grdWizardDone`** marks the content that the wizard shows when it is finished, instead of its own panel _Done!_ (`doneHeading` and `doneText` would set the texts of that one).

### Step 4: the forms, and Finish

```ts
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
```

```ts
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
```

```ts
/** The wizard and its forms start again, for the next customer. */
protected again(): void {
  this.company.reset();
  this.contact.reset();
  this.welcome.reset();
  this.finished.set(false);
  this.wizard().reset();
}
```

- **One form for each step** (`fb.group`): a step is valid when its form is. `Validators.email` turns `lukas@` away, `Validators.required` an empty field.
- **`(finishedChange)`** says that Finish was pressed (`true`) or the wizard started again (`false`). The wizard does not send or save anything: the page adds the customer itself.
- **`reset()`** takes the wizard back to its first step and forgets how far the user has been; the forms are emptied by `reset()` of their own.

### Step 5: the layout

`src/app/app.ts` registers the two documents. The menu opens the wizard too:

```ts
protected readonly menus: GrdMenu[] = [
  {
    id: 'file',
    label: '&File',
    items: [
      {
        label: '&New customer…',
        run: () => showTab(this.engine(), 'new-customer', 'New customer', 'new-customer'),
      },
      { separator: true },
      { label: '&Reset layout', run: () => this.engine().resetLayout() },
    ],
  },
];
```

### Step 6: run it

```
npm run tutorial 081
```

## Try it

1. **The first step.** Press **New customer…**: a tab _New customer_ opens. **Continue** is grey: the company has no name yet.
2. **Valid.** Type `Fabrikam`, choose _Germany_: Continue works now. Press it.
3. **A wrong e-mail.** Type a name, and `lukas@` as the e-mail: Continue is grey again. Make it `lukas@fabrikam.example`.
4. **Back and forth.** Press **Back**, or the circle _Company_: the company is as you left it. Go on again with Continue, or the circle _Contact_ (a circle of a step that was reached is a button).
5. **Check and Finish.** The last step shows what you typed. Press **Finish**: the circles are all ticked, and the panel of the end says _Fabrikam is a customer now._
6. **Show the list.** The list has Fabrikam at the end, and its tab is shown. The wizard tab stays: **File › New customer…** shows it again.
7. **Add another.** The wizard starts again at the first step, with empty fields.
8. **Leave in the middle.** Fill in a step, switch to the tab _Customers_ and back: the wizard is where you left it.

## More

- **A free wizard**: `[linear]="false"` lets the user go to any step; only Finish waits for every step to be valid.
- **No way back**: `[allowBack]="false"` on the wizard (or on one step, such as a receipt after a payment) takes Back away.
- **The buttons elsewhere**: `[showActions]="false"` takes Back and Continue away, and the page calls `next()`, `back()` and `finish()` (from the footer of a dialog, say).
- **Steps as components**: `[steps]` takes a list of steps that are components, after the ones between the tags.

## Build it yourself

`npm run tutorial:eject 081 path/to/new-folder` writes this tutorial as an Angular project of its own. By hand: start from your application of 015, add `customers.ts`, `customer-list.ts` and `new-customer.ts` to `src/app`, and replace `app.ts` with the one of this tutorial.
