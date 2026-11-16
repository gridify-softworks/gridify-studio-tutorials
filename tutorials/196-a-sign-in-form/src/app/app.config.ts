import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdCredentialsProvider, provideGrdAuth } from '@gridify/studio';
import { server } from './pretend-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [
        // The sign-in form of the application. The provider sends what was typed to the server,
        // which checks it and keeps the session in a cookie.
        grdCredentialsProvider({
          login: '/api/login', // POST the fields: the user (and the cookie), a step, or a refusal
          me: '/api/me', // GET at the start: who is signed in, or 401 for nobody
          refresh: '/api/refresh', // POST: a new end of the session
          logout: '/api/logout', // POST: the end of the session
          // Only for this tutorial: the pretend server answers instead of the network. A real
          // application leaves it out.
          fetch: server.fetch,
        }),
      ],
    }),
  ],
};
