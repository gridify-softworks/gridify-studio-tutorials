import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdAskWhenUnsaved, provideGrdBackButton, provideGrdUnsavedWork } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // While an invoice is unsaved, the browser asks before the page is closed or reloaded. With
    // everything saved it asks nothing.
    provideGrdUnsavedWork(),
    // The Back button asks too, and only then: with nothing unsaved it leaves as on any page.
    provideGrdBackButton({ canLeave: grdAskWhenUnsaved() }),
  ],
};
