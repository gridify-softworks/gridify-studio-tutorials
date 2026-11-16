import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdAuthInterceptor, grdDemoBackend, provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [demoServer.password],
      // The session is refreshed this long before it ends (60 000, a minute, when missing): the
      // provider asks the server for a new end, and the user notices nothing.
      refreshLead: 30_000,
      // The screen locks after this long without a click or a key (0, never, when missing).
      idleLock: 3 * 60_000,
    }),
    // The requests: the token on each of them, and a 401 of the server handled (see the README).
    // grdDemoBackend plays the server with its own API (GET /demo-api/orders and more).
    provideHttpClient(withInterceptors([grdAuthInterceptor(), grdDemoBackend(demoServer)])),
  ],
};
