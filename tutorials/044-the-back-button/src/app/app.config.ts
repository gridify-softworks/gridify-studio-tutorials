import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdBackButton } from '@gridify/studio';
import { ASK } from './back-button';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // What Back does when it would leave the application: here it asks (back-button.ts). The
    // provider puts its listeners on the window before the application starts, so the bridge
    // never hears the entry that it puts under the application.
    provideGrdBackButton({ canLeave: ASK }),
  ],
};
