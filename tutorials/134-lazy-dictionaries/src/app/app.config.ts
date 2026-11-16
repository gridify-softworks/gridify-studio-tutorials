import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { APP_EN } from './i18n/app-en';
import { overNetwork } from './network';

/** The modules of the dictionaries: each `import()` makes the bundler put one in a chunk of its own. */
const french = () => import('./i18n/fr');
const german = () => import('./i18n/de');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under this key.
    provideGrdLanguage({ storageKey: 'tutorial-134-language' }),
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      // English is the language of the start: a ready dictionary.
      i18n.register('en', APP_EN);
      // French and the German of the application: loaders, run when the language is chosen (or at
      // the start, when it is the remembered one).
      i18n.register('fr', overNetwork('fr', french));
      i18n.register('de', overNetwork('de', german));
    }),
  ],
};
