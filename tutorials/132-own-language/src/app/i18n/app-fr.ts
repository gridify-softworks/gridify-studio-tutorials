import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in French: the keys of `APP_EN`. One is left out on purpose,
 * `app.menu.about`: in French, Help › About this tutorial stays in English, and the check of the
 * dictionaries reports it.
 */
export const APP_FR: GrdDictionary = {
  'app.menu.file': '&Fichier',
  'app.menu.addCounter': 'Ajouter un &compteur',
  'app.menu.addNotes': 'Ajouter des &notes',
  'app.menu.reset': '&Réinitialiser la disposition…',
  'app.menu.check': '&Vérifier',
  'app.menu.checkFrench': 'Vérifier les dictionnaires &français',
  'app.menu.help': '&Aide',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Compteur',
  'app.tab.check': 'Vérification du français',
  'app.notes.html':
    '<p>Choisissez <b>English</b> dans l’en-tête : les menus, les onglets, les boîtes de dialogue et la zone vide repassent en anglais.</p>',
  'app.counter.intro': 'Un composant Angular avec un signal.',
  'app.counter.clicked': { one: '{count} clic', many: '{count} de clics', other: '{count} clics' },
  'app.reset.title': 'Réinitialiser la disposition',
  'app.reset.message':
    'Les onglets reviennent à leur place de départ. Réinitialiser la disposition ?',
  'app.about.title': 'À propos de ce tutoriel',
  'app.about.message': 'Tutoriel 132 : le français, langue de l’application et de la bibliothèque.',
  'app.status.language': 'Langue : {name} ({code})',
  'app.status.contact': 'E-mail : help@example.com',
  'app.check.intro': 'Textes sans traduction française, affichés en anglais :',
  'app.check.missing': 'Pas de traduction, le texte s’affiche en anglais',
  'app.check.ok': 'Chaque texte a une traduction française.',
  'app.check.again': 'Vérifier à nouveau',
  'app.check.key': 'Clé',
  'app.check.language': 'Langue',
};
