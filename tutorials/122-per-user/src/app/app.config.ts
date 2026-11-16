import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdAuth } from '@gridify/studio';
import { demoServer } from './demo-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The way to sign in. The user of the last visit comes back (restore) before the app starts.
    provideGrdAuth({ providers: [demoServer.password] }),
  ],
};
