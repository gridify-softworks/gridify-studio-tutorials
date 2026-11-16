import { GrdDictionary } from '@gridify/studio';

/** German: on the left the English text exactly as the code or the file writes it, on the right the translation. */
export const DE: GrdDictionary = {
  // the texts of the file (forms/order.form.json): t('Full name')
  'Full name': 'Name',
  'E-mail address': 'E-Mail-Adresse',
  'Company name': 'Firmenname',
  'VAT number': 'USt-IdNr.',
  'Street and number': 'Straße und Nr.',
  City: 'Ort',
  Postcode: 'PLZ',
  Delivery: 'Lieferung',
  'Delivery by': 'Lieferart',
  'Note for the courier': 'Hinweis für den Kurier',
  // the page
  'An order laid out by a file of the Form editor (forms/order.form.json). Make the window narrower or wider: from 560 px the labels stand beside the fields. What you type stays, also when the layout or the language changes.':
    'Eine Bestellung, angeordnet von einer Datei des Formular-Editors (forms/order.form.json). Machen Sie das Fenster schmaler oder breiter: Ab 560 px stehen die Beschriftungen neben den Feldern. Was Sie eingeben, bleibt erhalten, auch wenn sich das Layout oder die Sprache ändert.',
  'A company': 'Firma',
  Courier: 'Kurier',
  'Post office': 'Post',
  'Wrap it as a gift': 'Als Geschenk verpacken',
  Save: 'Speichern',
  'Laid out by the variant from {px} px': 'Angeordnet nach der Variante ab {px} px',
  'Correct the marked fields.': 'Korrigieren Sie die markierten Felder.',
  'Saved.': 'Gespeichert.',
  'The layout could not be loaded.': 'Das Layout konnte nicht geladen werden.',
  'What the code gets': 'Was der Code erhält',
  'Nothing is saved yet.': 'Noch nichts gespeichert.',
};

/** Japanese, the same keys. */
export const JA: GrdDictionary = {
  'Full name': '氏名',
  'E-mail address': 'メールアドレス',
  'Company name': '会社名',
  'VAT number': 'VAT 番号',
  'Street and number': '町名・番地',
  City: '市区町村',
  Postcode: '郵便番号',
  Delivery: '配送',
  'Delivery by': '配送方法',
  'Note for the courier': '配達員へのメモ',
  'An order laid out by a file of the Form editor (forms/order.form.json). Make the window narrower or wider: from 560 px the labels stand beside the fields. What you type stays, also when the layout or the language changes.':
    'フォームエディターのファイル（forms/order.form.json）でレイアウトした注文書です。ウィンドウの幅を狭めたり広げたりしてください。560 px からはラベルが入力欄の横に並びます。入力した内容は、レイアウトや言語が変わってもそのまま残ります。',
  'A company': '会社',
  Courier: '宅配便',
  'Post office': '郵便局',
  'Wrap it as a gift': 'ギフト包装にする',
  Save: '保存',
  'Laid out by the variant from {px} px': '{px} px 以上のバリアントでレイアウトしています',
  'Correct the marked fields.': '印の付いた入力欄を直してください。',
  'Saved.': '保存しました。',
  'The layout could not be loaded.': 'レイアウトを読み込めませんでした。',
  'What the code gets': 'コードが受け取る値',
  'Nothing is saved yet.': 'まだ何も保存されていません。',
};
