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
    // The icons that the files of the ribbon name (`app:paste`) are in the registry before the first component is drawn.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
