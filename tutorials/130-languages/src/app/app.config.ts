import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-130-language' }),
  ],
};
