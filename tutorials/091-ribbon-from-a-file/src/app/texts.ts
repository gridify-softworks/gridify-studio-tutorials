/** The texts of the ribbon in the two languages the application has. The key is the English text, which is what `tr('Home')` in the files says. */
const DE: Record<string, string> = {
  Home: 'Start',
  Clipboard: 'Zwischenablage',
  Paste: 'Einfügen',
  Cut: 'Ausschneiden',
  Copy: 'Kopieren',
  'Format Painter': 'Format übertragen',
  Font: 'Schriftart',
  'Font color': 'Schriftfarbe',
  Paragraph: 'Absatz',
  'Wrap text': 'Textumbruch',
  Styles: 'Formatvorlagen',
  Insert: 'Einfügen',
  Tables: 'Tabellen',
  Table: 'Tabelle',
  Illustrations: 'Illustrationen',
  Picture: 'Bild',
  Shapes: 'Formen',
  Links: 'Links',
  Link: 'Link',
  Page: 'Seite',
  'Page break': 'Seitenumbruch',
  View: 'Ansicht',
  Show: 'Anzeigen',
  Ruler: 'Lineal',
  Gridlines: 'Gitternetzlinien',
  'Navigation pane': 'Navigationsbereich',
  Layout: 'Layout',
  'Print layout': 'Drucklayout',
  'Web layout': 'Weblayout',
  Outline: 'Gliederung',
  Zoom: 'Zoom',
  Status: 'Status',
  Goal: 'Ziel',
  'Picture Tools': 'Bildtools',
  Adjust: 'Anpassen',
  'Remove Background': 'Hintergrund entfernen',
  Corrections: 'Korrekturen',
  Size: 'Größe',
};

export type Language = 'en' | 'de';

/** `tr` of the files: the text in the language, or the key itself (English is the key). */
export function translator(language: Language): (key: string) => string {
  return (key) => (language === 'de' ? (DE[key] ?? key) : key);
}
