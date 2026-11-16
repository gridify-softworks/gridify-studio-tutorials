import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in English, under keys of its own (`app.*`), the way the library
 * keeps its texts (`grd.*` in `GRD_LIB_EN`). English is the template: every other language has the
 * same keys, and the check of the dictionaries finds the ones that a language lacks.
 */
export const APP_EN: GrdDictionary = {
  'app.menu.file': '&File',
  'app.menu.addCounter': 'Add a &counter',
  'app.menu.addNotes': 'Add &notes',
  'app.menu.reset': '&Reset layout…',
  'app.menu.check': '&Check',
  'app.menu.checkFrench': 'Check the &French dictionaries',
  'app.menu.help': '&Help',
  'app.menu.about': '&About this tutorial',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Counter',
  'app.tab.check': 'French check',
  'app.notes.html':
    '<p>Choose <b>français</b> in the header: the menus, the tabs, the dialogs and the empty area speak French.</p>',
  'app.counter.intro': 'An Angular component with a signal.',
  'app.counter.clicked': { one: 'Clicked {count} time', other: 'Clicked {count} times' },
  'app.reset.title': 'Reset the layout',
  'app.reset.message': 'The tabs go back to where they were at the start. Reset the layout?',
  'app.about.title': 'About this tutorial',
  'app.about.message': 'Tutorial 132: French as a language of the application and of the library.',
  'app.status.language': 'Language: {name} ({code})',
  'app.status.contact': 'E-mail: help@example.com',
  'app.check.intro': 'Texts that have no French translation and are shown in English:',
  'app.check.missing': 'No translation, the text is shown in English',
  'app.check.ok': 'Every text has a French translation.',
  'app.check.again': 'Check again',
  'app.check.key': 'Key',
  'app.check.language': 'Language',
};
