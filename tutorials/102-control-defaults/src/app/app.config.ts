import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdControlDefaults } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // How the controls of this application start: every password field shows how strong the
    // password is, and the check boxes are round. A control that sets its own input keeps it.
    provideGrdControlDefaults({ passwordStrength: true, checkboxShape: 'round' }),
  ],
};
