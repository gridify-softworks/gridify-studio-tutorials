import { GrdDictionary } from '@gridify/studio';

/**
 * English needs a dictionary only for the texts under keys: a key has no English text in the code.
 * The other texts of the code are English already.
 */
export const EN: GrdDictionary = {
  'app.welcome':
    'This page is HTML in a tab. Its content is a signal, so the engine writes it again in the language you choose. A long text like this one is kept under a key (app.welcome), not under its English words.',
};
