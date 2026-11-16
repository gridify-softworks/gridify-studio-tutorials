import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
} from '@angular/core';
import { GrdI18n, provideGrdLanguage } from '@gridify/studio';
import { DE } from './app.de';
import { EN } from './app.en';
import { JA } from './app.ja';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The language that the user chooses is kept in localStorage under the key of this tutorial.
    provideGrdLanguage({ storageKey: 'tutorial-131-language' }),
    // The dictionaries of the application, once at the start: the texts under keys in English,
    // and every text in German and in Japanese.
    provideEnvironmentInitializer(() => {
      const i18n = inject(GrdI18n);
      i18n.register('en', EN);
      i18n.register('de', DE);
      i18n.register('ja', JA);
    }),
  ],
};
