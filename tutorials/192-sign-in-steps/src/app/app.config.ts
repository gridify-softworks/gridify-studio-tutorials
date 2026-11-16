import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Three ways to sign in, in the order the sign-in screen shows them:
    // 1. `password`: a name and a password (the accounts of the application itself);
    // 2. `ldap`: a name and a password in a company directory, with the domain (CORP or LAB);
    // 3. `oidc:demo`: a button that goes to an identity provider and comes back.
    provideGrdAuth({ providers: demoServer.providers() }),
  ],
};
