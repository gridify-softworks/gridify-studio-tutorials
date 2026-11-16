import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { grdSessionProvider, provideGrdAuth } from '@gridify/studio';
import { server } from './pretend-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideGrdAuth({
      providers: [
        // The session is kept by the server, in a cookie. The application only asks who it is.
        grdSessionProvider({
          me: '/api/me', // GET: 200 with the user, or 401 for nobody
          login: '/auth/login', // the sign-in page of the server (it gets ?returnUrl=…)
          label: 'Sign in at Example Corp', // the text of the button of the provider
          refresh: '/api/refresh', // POST: a new end of the session
          logout: '/api/logout', // POST: the end of the session
          // Only for this tutorial: the pretend server answers instead of the network, and shows its
          // sign-in page instead of leaving the application. A real application leaves both out.
          fetch: server.fetch,
          navigate: server.navigate,
        }),
      ],
    }),
  ],
};
