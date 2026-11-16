import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { APP_EN } from './i18n/app-en';
import { APP_FR } from './i18n/app-fr';
import { APP_FR_CA } from './i18n/app-fr-ca';
import { GRD_LIB_FR } from './i18n/fr-library';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under this key.
    provideGrdLanguage({ storageKey: 'tutorial-132-language' }),
    // The dictionaries, before the first screen: French is then known when a remembered French
    // is applied, and the application starts in it.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('en', APP_EN);
      // French: the texts of the library and the texts of the application (the two merge).
      i18n.register('fr', GRD_LIB_FR);
      i18n.register('fr', APP_FR);
      // Canadian French: the few texts that differ, the rest comes from French.
      i18n.register('fr-CA', APP_FR_CA);
    }),
  ],
};
