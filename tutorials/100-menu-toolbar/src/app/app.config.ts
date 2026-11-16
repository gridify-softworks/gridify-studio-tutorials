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
    // The icons of the commands are in the registry before the menu, the toolbar and the status bar draw them.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
