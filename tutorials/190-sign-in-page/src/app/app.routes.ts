import { Routes } from '@angular/router';
import { grdAuthGuard } from '@gridify/studio';
import { HomePage } from './home.page';
import { OrdersPage } from './orders.page';
import { SignInPage } from './sign-in.page';

/**
 * The guard of a page that needs a signed-in user. Somebody who is not signed in does not get the
 * page: the guard sends them to `/sign-in?returnUrl=/orders` and remembers `/orders`, so the sign-in
 * page can bring them back there. A signed-in user gets the page at once.
 */
const signedIn = grdAuthGuard({ signIn: '/sign-in' });

export const routes: Routes = [
  // Anybody may see the first page and the sign-in page.
  { path: '', component: HomePage, title: 'Home' },
  { path: 'sign-in', component: SignInPage, title: 'Sign in' },
  // The orders only for somebody who is signed in.
  { path: 'orders', component: OrdersPage, title: 'Orders', canActivate: [signedIn] },
  // An address that does not exist goes to the first page.
  { path: '**', redirectTo: '' },
];
