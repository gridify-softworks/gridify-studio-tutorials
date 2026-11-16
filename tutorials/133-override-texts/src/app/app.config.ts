import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdLanguage } from '@gridify/studio';
import { provideCompanyTexts } from './company-texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language chosen in the header is kept under a key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-133-language' }),
    // The wording of the company over the texts of the library.
    provideCompanyTexts(),
  ],
};
