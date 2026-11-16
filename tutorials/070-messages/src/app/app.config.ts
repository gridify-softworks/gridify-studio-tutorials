import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

// The message boxes, the toasts and the message bars need no provider: the services are provided in root.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners()],
};
