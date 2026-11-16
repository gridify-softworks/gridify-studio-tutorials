import { GrdDictionary } from '@gridify/studio';

/**
 * Japanese. The text of the counter's first line is left out on purpose: it is shown in English.
 * In Japanese menus the letter of Alt stands after the text, in brackets: ファイル(&F).
 */
export const JA: GrdDictionary = {
  // the menus
  '&File': 'ファイル(&F)',
  'Add a &counter': 'カウンターを追加(&C)',
  'Add a &welcome page': 'ようこそページを追加(&W)',
  '&View': '表示(&V)',
  // the titles of the tabs
  Welcome: 'ようこそ',
  Counter: 'カウンター',
  Log: 'ログ',
  // the welcome page
  'app.welcome':
    'このページはタブの中の HTML です。コンテンツはシグナルなので、選んだ言語でエンジンが書き直します。このような長い文は英語の文章ではなくキー（app.welcome）で保存します。',
  // the counter ('An Angular component with a signal.' is missing on purpose)
  'Clicks: {clicks}': 'クリック数: {clicks}',
  'Add one': '1 つ増やす',
  // the log
  'Your name': 'お名前',
  'Hello, {name}!': 'こんにちは、{name} さん！',
  'Write a line': '1 行書く',
  'Greeting for {name} at {time}': '{time} に {name} さんへのあいさつ',
  'Empty|command': '空にする',
  Empty: '空です',
  // the status bar
  'Language: {name}': '言語: {name}',
};
