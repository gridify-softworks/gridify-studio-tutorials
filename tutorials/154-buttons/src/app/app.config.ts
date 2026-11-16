import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { GrdIcons } from '@gridify/studio';
import { APP_ICONS } from './app-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The icons of the application are in the registry before the first button is drawn (see 060).
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
