import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  grdAuthInterceptor,
  grdDemoBackend,
  grdRolePermissions,
  provideGrdAuth,
} from '@gridify/studio';
import { routes } from './app.routes';
import { demoApi, demoServer } from './demo-server';
import { ROLE_PERMISSIONS } from './permissions';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideGrdAuth({
      providers: [demoServer.password],
      // The permissions of a user: here from the roles (the table of permissions.ts). A server may
      // also send permissions with the user (`user.permissions`); GrdAuth takes both.
      permissionsOf: grdRolePermissions(ROLE_PERMISSIONS),
    }),
    // The requests of the application. The order counts:
    // 1. grdAuthInterceptor puts the token of the signed-in user on every request of this site
    //    (Authorization: Bearer ...), so the server knows who asks.
    // 2. grdDemoBackend plays the server: it answers /demo-api/... from demo-server.ts. With a real
    //    server, leave it out.
    provideHttpClient(
      withInterceptors([grdAuthInterceptor(), grdDemoBackend(demoServer, demoApi)]),
    ),
  ],
};
