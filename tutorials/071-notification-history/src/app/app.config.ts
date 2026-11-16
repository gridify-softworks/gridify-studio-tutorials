import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { GrdIcons, provideGrdToastHistory } from '@gridify/studio';
import { APP_ICONS } from './app-icons';

/** How many notifications the history keeps: when there are more, the oldest go first. */
export const HISTORY_MAX = 30;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // The history of the notifications is off in the library, and this line turns it on: from now
    // on every toast goes into it (unless the toast says history: false), and the bell is shown.
    provideGrdToastHistory({ max: HISTORY_MAX }),
    // The icons of the commands are in the registry before the menu bar and the toolbar draw them.
    provideAppInitializer(() => inject(GrdIcons).setMany(APP_ICONS)),
  ],
};
