import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGrdAuth } from '@gridify/studio';
import { routes } from './app.routes';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The pages of the application, and which of them need a signed-in user (see app.routes.ts).
    provideRouter(routes),
    // The sign-in. `providers` are the ways to sign in; here one: a name and a password, which the
    // pretend server checks. Before the application starts, GrdAuth asks the server whether somebody
    // is still signed in from the last visit (the "silent sign-in"), so F5 does not sign you out.
    provideGrdAuth({ providers: [demoServer.password] }),
  ],
};
