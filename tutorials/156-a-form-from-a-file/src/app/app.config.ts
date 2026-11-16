import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { DE, JA } from './texts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses in the header is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-156-language' }),
    // The texts of the application and those of the file (t('Full name')), once at the start. English is the key.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('de', DE);
      i18n.register('ja', JA);
    }),
  ],
};
