import { Routes } from '@angular/router';

export const routes: Routes = [
  // The address of the application alone shows the table.
  { path: '', pathMatch: 'full', redirectTo: 'table' },
  // Each page is a chunk of its own: the router loads it the first time its route is visited.
  { path: 'table', loadComponent: () => import('./table-page').then((m) => m.TablePage) },
  { path: 'form', loadComponent: () => import('./form-page').then((m) => m.FormPage) },
  // An address that names no page leads to the table too.
  { path: '**', redirectTo: 'table' },
];
