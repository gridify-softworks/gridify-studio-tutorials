import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in English, under keys of its own (`app.*`). English is the
 * language of the start, so it is a part of the first load; the other languages are not.
 */
export const APP_EN: GrdDictionary = {
  'app.menu.file': '&File',
  'app.menu.addCounter': 'Add a &counter',
  'app.menu.reset': '&Reset layout',
  'app.menu.network': '&Network',
  'app.menu.fast': '&Fast',
  'app.menu.slow': '&Slow (3 seconds)',
  'app.menu.offline': '&Offline',
  'app.menu.check': '&Check',
  'app.menu.checkAll': '&Load every dictionary and check',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Counter',
  'app.notes.html':
    '<p>Choose <b>français</b> or <b>Deutsch</b> in the header: the dictionary of the language is fetched now, the first time it is needed.</p>',
  'app.counter.intro': 'An Angular component with a signal.',
  'app.counter.clicked': { one: 'Clicked {count} time', other: 'Clicked {count} times' },
  'app.status.language': 'Language: {name}',
  'app.status.loading': 'Loading {name}…',
  'app.status.fetched': 'Fetched: {languages}',
  'app.status.nothingFetched': 'No dictionary fetched yet',
  'app.status.network': 'Network: {network}',
  'app.network.fast': 'fast',
  'app.network.slow': 'slow',
  'app.network.offline': 'offline',
  'app.failed': 'The dictionary of {name} could not be loaded. The language stays as it was.',
  'app.check.title': 'The dictionaries',
  'app.check.result': 'Problems: French {fr}, German {de}, Japanese {ja}.',
  'app.check.failed': 'Not every dictionary could be loaded, so nothing was checked.',
};
