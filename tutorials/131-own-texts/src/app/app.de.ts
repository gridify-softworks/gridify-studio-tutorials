import { GrdDictionary } from '@gridify/studio';

/** German: on the left the English text exactly as the code writes it (or a key), on the right the translation. */
export const DE: GrdDictionary = {
  // the menus: & marks the letter of Alt (Alt+D opens Datei)
  '&File': '&Datei',
  'Add a &counter': '&Zähler hinzufügen',
  'Add a &welcome page': '&Willkommensseite hinzufügen',
  '&View': '&Ansicht',
  // the titles of the tabs
  Welcome: 'Willkommen',
  Counter: 'Zähler',
  Log: 'Protokoll',
  // the welcome page
  'app.welcome':
    'Diese Seite ist HTML in einem Tab. Ihr Inhalt ist ein Signal, daher schreibt die Engine sie in der gewählten Sprache neu. Ein langer Text wie dieser ist unter einem Schlüssel (app.welcome) gespeichert, nicht unter seinem englischen Wortlaut.',
  // the counter
  'An Angular component with a signal.': 'Eine Angular-Komponente mit einem Signal.',
  'Clicks: {clicks}': 'Klicks: {clicks}',
  'Add one': 'Um eins erhöhen',
  // the log
  'Your name': 'Ihr Name',
  'Hello, {name}!': 'Hallo, {name}!',
  'Write a line': 'Zeile schreiben',
  'Greeting for {name} at {time}': 'Gruß an {name} um {time}',
  // "Empty" twice: the button empties the log (a verb), the log says it is empty (an adjective)
  'Empty|command': 'Leeren',
  Empty: 'Leer',
  // the status bar
  'Language: {name}': 'Sprache: {name}',
};
