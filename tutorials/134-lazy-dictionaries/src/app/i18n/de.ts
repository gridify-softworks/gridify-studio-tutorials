import type { GrdDictionary } from '@gridify/studio';

/**
 * The texts of the application in German. The library has its German built in; this module adds
 * the application's, and it is loaded by `import()` the first time German is chosen.
 */
const DE: GrdDictionary = {
  'app.menu.file': '&Datei',
  'app.menu.addCounter': '&Zähler hinzufügen',
  'app.menu.reset': '&Layout zurücksetzen',
  'app.menu.network': '&Netzwerk',
  'app.menu.fast': '&Schnell',
  'app.menu.slow': '&Langsam (3 Sekunden)',
  'app.menu.offline': '&Offline',
  'app.menu.check': '&Prüfen',
  'app.menu.checkAll': '&Alle Wörterbücher laden und prüfen',
  'app.tab.notes': 'Notizen',
  'app.tab.counter': 'Zähler',
  'app.notes.html':
    '<p>Wählen Sie in der Kopfzeile <b>English</b> oder <b>français</b>: Das Wörterbuch der Sprache wird erst heruntergeladen, wenn es zum ersten Mal gebraucht wird.</p>',
  'app.counter.intro': 'Eine Angular-Komponente mit einem Signal.',
  'app.counter.clicked': { one: '{count} Klick', other: '{count} Klicks' },
  'app.status.language': 'Sprache: {name}',
  'app.status.loading': '{name} wird geladen…',
  'app.status.fetched': 'Heruntergeladen: {languages}',
  'app.status.nothingFetched': 'Noch kein Wörterbuch heruntergeladen',
  'app.status.network': 'Netzwerk: {network}',
  'app.network.fast': 'schnell',
  'app.network.slow': 'langsam',
  'app.network.offline': 'offline',
  'app.failed':
    'Das Wörterbuch der Sprache {name} konnte nicht geladen werden. Die Sprache bleibt unverändert.',
  'app.check.title': 'Wörterbücher',
  'app.check.result': 'Probleme: Französisch {fr}, Deutsch {de}, Japanisch {ja}.',
  'app.check.failed': 'Nicht alle Wörterbücher konnten geladen werden, daher wurde nichts geprüft.',
};

export default DE;
