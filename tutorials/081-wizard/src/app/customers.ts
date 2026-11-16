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
