import { Routes } from '@angular/router';
import { grdAuthGuard } from '@gridify/studio';
import { AdministrationPage } from './administration.page';
import { ForbiddenPage } from './forbidden.page';
import { HomePage } from './home.page';
import { NewOrderPage } from './new-order.page';
import { OrdersPage } from './orders.page';
import { SignInPage } from './sign-in.page';

/**
 * The guards. Each says what a page needs. Somebody who is not signed in goes to the sign-in page
 * (`signIn`, as in 190); somebody who is signed in but may not open the page goes to `/forbidden`.
 */
const mayViewOrders = grdAuthGuard({
  permission: 'orders.view',
  signIn: '/sign-in',
  forbidden: '/forbidden',
});
const mayEditOrders = grdAuthGuard({
  permission: 'orders.edit',
  signIn: '/sign-in',
  forbidden: '/forbidden',
});
// A role instead of a permission: only an administrator.
const isAdmin = grdAuthGuard({ role: 'admin', signIn: '/sign-in', forbidden: '/forbidden' });

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Home' },
  { path: 'sign-in', component: SignInPage, title: 'Sign in' },
  { path: 'forbidden', component: ForbiddenPage, title: 'Not allowed' },
  { path: 'orders', component: OrdersPage, title: 'Orders', canActivate: [mayViewOrders] },
  { path: 'new-order', component: NewOrderPage, title: 'New order', canActivate: [mayEditOrders] },
  {
    path: 'administration',
    component: AdministrationPage,
    title: 'Administration',
    canActivate: [isAdmin],
  },
  { path: '**', redirectTo: '' },
];
