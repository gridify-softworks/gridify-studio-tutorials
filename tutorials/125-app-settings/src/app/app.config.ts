import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdDensity, provideGrdLanguage, provideGrdTheme } from '@gridify/studio';

/** The key of the density; the Settings menu turns remembering it off and on. */
export const DENSITY_KEY = 'tutorial-125-density';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The theme, the density and the language that the user chooses are kept in localStorage under these keys.
    provideGrdTheme({ storageKey: 'tutorial-125-theme' }),
    provideGrdDensity({ storageKey: DENSITY_KEY }),
    provideGrdLanguage({ storageKey: 'tutorial-125-language' }),
  ],
};
