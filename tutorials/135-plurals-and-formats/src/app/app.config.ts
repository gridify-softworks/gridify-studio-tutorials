import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';
import { provideAppTexts } from './texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language chosen in the header is kept under a key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-135-language' }),
    // The texts of the application in English (plural forms), German, Japanese and French.
    provideAppTexts(),
  ],
};
