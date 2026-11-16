import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth, provideGrdProfileStore } from '@gridify/studio';
import { demoServer } from './demo-server';
import { TeamProfileStore } from './profile-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The sign-in, as in 190.
    provideGrdAuth({ providers: [demoServer.password] }),
    // The store of the profile, as in 194: here with the fields of this application.
    provideGrdProfileStore(() => inject(TeamProfileStore)),
  ],
};
