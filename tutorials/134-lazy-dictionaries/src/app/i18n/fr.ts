import type { GrdDictionary } from '@gridify/studio';
import { GRD_LIB_FR } from './fr-library';

/**
 * Everything French in one module: the texts of the library and the texts of the application.
 * Nothing but `app.config.ts` imports it, and only by `import()`, so it is a chunk of its own.
 */
const FR: GrdDictionary = {
  ...GRD_LIB_FR,
  'app.menu.file': '&Fichier',
  'app.menu.addCounter': 'Ajouter un &compteur',
  'app.menu.reset': '&Réinitialiser la disposition',
  'app.menu.network': '&Réseau',
  'app.menu.fast': '&Rapide',
  'app.menu.slow': '&Lent (3 secondes)',
  'app.menu.offline': '&Hors ligne',
  'app.menu.check': '&Vérifier',
  'app.menu.checkAll': '&Charger tous les dictionnaires et vérifier',
  'app.tab.notes': 'Notes',
  'app.tab.counter': 'Compteur',
  'app.notes.html':
    '<p>Choisissez <b>English</b> ou <b>Deutsch</b> dans l’en-tête : le dictionnaire de la langue est chargé la première fois qu’il est nécessaire.</p>',
  'app.counter.intro': 'Un composant Angular avec un signal.',
  'app.counter.clicked': { one: '{count} clic', many: '{count} de clics', other: '{count} clics' },
  'app.status.language': 'Langue : {name}',
  'app.status.loading': 'Chargement de {name}…',
  'app.status.fetched': 'Chargés : {languages}',
  'app.status.nothingFetched': 'Aucun dictionnaire chargé pour l’instant',
  'app.status.network': 'Réseau : {network}',
  'app.network.fast': 'rapide',
  'app.network.slow': 'lent',
  'app.network.offline': 'hors ligne',
  'app.failed':
    'Le dictionnaire de la langue {name} n’a pas pu être chargé. La langue reste inchangée.',
  'app.check.title': 'Les dictionnaires',
  'app.check.result': 'Problèmes : français {fr}, allemand {de}, japonais {ja}.',
  'app.check.failed':
    'Tous les dictionnaires n’ont pas pu être chargés, rien n’a donc été vérifié.',
};

export default FR;
