import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth, provideGrdProfileStore } from '@gridify/studio';
import { demoServer } from './demo-server';
import { ProfileStore } from './profile-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The sign-in, as in 190.
    provideGrdAuth({ providers: [demoServer.password] }),
    // The store of the profile: the profile of the library loads and saves through it. The
    // function runs where inject() works, so a store may inject what it needs (a real one
    // injects HttpClient).
    provideGrdProfileStore(() => inject(ProfileStore)),
  ],
};
