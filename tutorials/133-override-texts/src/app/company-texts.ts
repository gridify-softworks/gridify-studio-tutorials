import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { GrdDictionary, GrdI18n } from '@gridify/studio';

/**
 * The wording of the company in English: a few texts of the library, found by their keys in `GRD_LIB_EN`.
 * Every other text stays the library's.
 */
export const COMPANY_EN: GrdDictionary = {
  // The empty document area of the engine.
  'grd.dock.emptyTitle': 'No reports open',
  'grd.dock.emptyHint': 'Open one with File › New report, or drag a tab here',
  // The cross on a tab: its tooltip and its name for a screen reader.
  'grd.tab.close': 'Close the report',
  // The menu of a tab. The & marks the access key: keep one, and each letter only once in the menu.
  'grd.tabMenu.closeOthers': 'Close &other reports',
  'grd.tabMenu.closeAll': 'Close &all reports',
  'grd.tabMenu.dock': 'Put &back in place',
  // The button in the header of a floating window says the same.
  'grd.dock.dockBack': 'Put back in place',
  // The buttons and the title of a question. The title is only changed in English.
  'grd.messageBox.cancel': 'Go back',
  'grd.messageBox.title.question': 'Please confirm',
  // A text with a parameter: {size} stays, the library fills it in.
  'grd.fileUpload.hintSize': 'Each at most {size}',
  // Plural forms: English has `one` and `other`.
  'grd.fileUpload.hintCount': {
    one: 'One attachment at most',
    other: 'At most {count} attachments',
  },
  'grd.fileUpload.chooseMany': 'Add attachments',
};

/** The same wording in German, without the title of a question: in German that one stays the library's. */
export const COMPANY_DE: GrdDictionary = {
  'grd.dock.emptyTitle': 'Keine Berichte geöffnet',
  'grd.dock.emptyHint':
    'Öffnen Sie einen Bericht mit File › New report oder ziehen Sie einen Tab hierher',
  'grd.tab.close': 'Bericht schließen',
  'grd.tabMenu.closeOthers': '&Andere Berichte schließen',
  'grd.tabMenu.closeAll': 'Alle &Berichte schließen',
  'grd.tabMenu.dock': 'Zurück an seinen &Platz',
  'grd.dock.dockBack': 'Zurück an seinen Platz',
  'grd.messageBox.cancel': 'Zurück',
  'grd.fileUpload.hintSize': 'Jeweils höchstens {size}',
  // German has the same forms as English: `one` (1) and `other` (0, 2 and more).
  'grd.fileUpload.hintCount': {
    one: 'Höchstens ein Anhang',
    other: 'Höchstens {count} Anhänge',
  },
  'grd.fileUpload.chooseMany': 'Anhänge hinzufügen',
};

/** Merges the wording into the dictionaries of the library when the application starts. */
export function provideCompanyTexts(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(GrdI18n);
    i18n.extend('en', COMPANY_EN);
    i18n.extend('de', COMPANY_DE);
  });
}
