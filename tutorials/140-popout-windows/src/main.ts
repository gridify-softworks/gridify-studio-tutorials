import { bootstrapApplication } from '@angular/platform-browser';
import { grdPopoutReloadGuard } from '@gridify/studio';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// A popout window that the browser loads again must not start a second application in it.
if (!grdPopoutReloadGuard()) {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}
