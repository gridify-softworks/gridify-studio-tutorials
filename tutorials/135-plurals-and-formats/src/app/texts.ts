import { EnvironmentProviders, inject, provideEnvironmentInitializer } from '@angular/core';
import { GrdDictionary, GrdI18n } from '@gridify/studio';

/**
 * English needs entries only for the plural forms: every other text of the application is written in English in the code,
 * and that text is its own translation.
 */
export const EN: GrdDictionary = {
  '{count} files': { one: '{count} file', other: '{count} files' },
  'Delete {count} files from {folder}?': {
    one: 'Delete {count} file from {folder}?',
    other: 'Delete {count} files from {folder}?',
  },
  '{count} hours': { one: '{count} hour', other: '{count} hours' },
};

/** German: `one` (1), `other` (0, 2 and more, and a number with decimals: 1,5). */
export const DE: GrdDictionary = {
  '&File': '&Datei',
  '&Reset layout': '&Layout zurücksetzen',
  Plurals: 'Pluralformen',
  Formats: 'Formate',
  'Number of files': 'Anzahl der Dateien',
  'Hours worked': 'Gearbeitete Stunden',
  'No files': 'Keine Dateien',
  '{count} files': { one: '{count} Datei', other: '{count} Dateien' },
  'Delete {count} files from {folder}?': {
    one: '{count} Datei aus dem Ordner {folder} löschen?',
    other: '{count} Dateien aus dem Ordner {folder} löschen?',
  },
  '{count} hours': { one: '{count} Stunde', other: '{count} Stunden' },
  'The same texts for other numbers': 'Dieselben Texte für andere Zahlen',
  'A large number': 'Eine große Zahl',
  'Money (euros)': 'Geld (Euro)',
  'A share': 'Ein Anteil',
  Date: 'Datum',
  Time: 'Uhrzeit',
  'A day ago': 'Vor einem Tag',
  'In three hours': 'In drei Stunden',
  'File size': 'Dateigröße',
  'Names by the language': 'Namen nach den Regeln der Sprache',
  'Names by the codes of the letters': 'Namen nach den Zeichencodes',
};

/** Japanese has one form, `other`, for every number. */
export const JA: GrdDictionary = {
  '&File': 'ファイル(&F)',
  '&Reset layout': 'レイアウトをリセット(&R)',
  Plurals: '複数形',
  Formats: '書式',
  'Number of files': 'ファイル数',
  'Hours worked': '作業時間',
  'No files': 'ファイルはありません',
  '{count} files': { other: '{count}個のファイル' },
  'Delete {count} files from {folder}?': {
    other: '{folder}から{count}個のファイルを削除しますか？',
  },
  '{count} hours': { other: '{count}時間' },
  'The same texts for other numbers': 'ほかの数での同じテキスト',
  'A large number': '大きな数',
  'Money (euros)': '金額（ユーロ）',
  'A share': '割合',
  Date: '日付',
  Time: '時刻',
  'A day ago': '1日前',
  'In three hours': '3時間後',
  'File size': 'ファイルサイズ',
  'Names by the language': '名前（言語の規則の順）',
  'Names by the codes of the letters': '名前（文字コードの順）',
};

/** French: `one` (0 and 1, also 1,5), `many` (millions: « 1 000 000 de fichiers »), `other`. */
export const FR: GrdDictionary = {
  '&File': '&Fichier',
  '&Reset layout': '&Réinitialiser la disposition',
  Plurals: 'Pluriels',
  Formats: 'Formats',
  'Number of files': 'Nombre de fichiers',
  'Hours worked': 'Heures travaillées',
  'No files': 'Aucun fichier',
  '{count} files': {
    one: '{count} fichier',
    many: '{count} de fichiers',
    other: '{count} fichiers',
  },
  'Delete {count} files from {folder}?': {
    one: 'Supprimer {count} fichier du dossier {folder} ?',
    many: 'Supprimer {count} de fichiers du dossier {folder} ?',
    other: 'Supprimer {count} fichiers du dossier {folder} ?',
  },
  '{count} hours': { one: '{count} heure', many: '{count} d’heures', other: '{count} heures' },
  'The same texts for other numbers': 'Les mêmes textes pour d’autres nombres',
  'A large number': 'Un grand nombre',
  'Money (euros)': 'Argent (euros)',
  'A share': 'Une part',
  Date: 'Date',
  Time: 'Heure',
  'A day ago': 'Il y a un jour',
  'In three hours': 'Dans trois heures',
  'File size': 'Taille d’un fichier',
  'Names by the language': 'Noms selon la langue',
  'Names by the codes of the letters': 'Noms selon les codes des lettres',
};

/** Registers the texts of the application when it starts: French is a language of this application only. */
export function provideAppTexts(): EnvironmentProviders {
  return provideEnvironmentInitializer(() => {
    const i18n = inject(GrdI18n);
    i18n.register('en', EN);
    i18n.register('de', DE);
    i18n.register('ja', JA);
    i18n.register('fr', FR);
  });
}
