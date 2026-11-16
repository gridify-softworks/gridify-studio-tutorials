import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideGrdPopouts } from '@gridify/studio';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // What the popout windows need from the start of the application. Without it no tab can leave the page.
    provideGrdPopouts(),
  ],
};
