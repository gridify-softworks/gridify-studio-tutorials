import { computed } from '@angular/core';
import type { GrdRibbonChoice, GrdRibbonItem, GrdRibbonTab } from '@gridify/studio';
import { DocFormat, Editor, STYLES } from './editor';

const FONTS: GrdRibbonChoice[] = [
  'Georgia',
  'Arial',
  'Verdana',
  'Trebuchet MS',
  'Times New Roman',
  'Courier New',
].map((font) => ({ label: font }));

// The tiles of the gallery show the font of each style (in the color of the theme, so they are seen in a dark theme too).
const STYLE_CHOICES: GrdRibbonChoice[] = Object.entries(STYLES).map(([value, style]) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
  preview: 'Aa',
  style: {
    'font-family': style.font ?? 'Georgia',
    'font-weight': style.bold ? '700' : '400',
    'font-style': style.italic ? 'italic' : 'normal',
  },
}));

const ALIGNMENTS: { value: DocFormat['align']; label: string }[] = [
  { value: 'left', label: 'Align left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Align right' },
  { value: 'justify', label: 'Justify' },
];

/** The quick access toolbar: at the left of the tab bar, on every tab. */
export const QUICK_ACCESS: GrdRibbonItem[] = [
  {
    type: 'button',
    icon: 'app:doc-new',
    label: 'New document',
    action: 'new',
    inputs: { iconOnly: true },
  },
];

/**
 * The three tabs of the ribbon. The state of every control is read from the active document (`computed`), so the ribbon shows what the
 * document is like; a change comes to `App.onAction`, which writes it into the document. Two controls are two-way instead (`Word count`
 * and `Goal`): they are given a writable signal, and the ribbon sets it itself.
 */
export function ribbonTabs(editor: Editor): GrdRibbonTab[] {
  // A field of the format of the active document, for the controls that show it.
  const field = <K extends keyof DocFormat>(key: K, empty: DocFormat[K]) =>
    computed(() => editor.format()?.[key] ?? empty);
  // The controls that change a document are off while no document is open, and say why.
  const needsDocument = {
    disabled: editor.noDocument,
    disabledReason: 'Open a document first (New document, Alt+N).',
  };
  // A command of the tab Collapsing: it writes its name at the end of the document.
  const insert = (item: GrdRibbonItem): GrdRibbonItem => ({
    action: 'insert',
    ...needsDocument,
    ...item,
  });

  return [
    // ---- 1. Basics: buttons, a split button, toggles, shortcuts and KeyTips ----
    {
      id: 'basics',
      label: 'Basics',
      keytip: 'B',
      sections: [
        {
          id: 'document',
          title: 'Document',
          columns: 2,
          items: [
            {
              type: 'split-button',
              inputs: { size: 'large' },
              col: 1,
              icon: 'app:doc-new',
              label: 'New document',
              action: 'new',
              shortcut: 'Alt+N',
              keytip: 'N',
              description:
                'Opens a new document in the engine below. The arrow chooses what is in it.',
              choices: [
                { label: 'Blank document', value: 'blank', icon: 'app:page' },
                { label: 'Letter', value: 'letter', icon: 'app:note' },
                { label: 'Report', value: 'report', icon: 'app:chart' },
              ],
            },
            {
              type: 'button',
              col: 2,
              row: 1,
              icon: 'app:doc-close',
              label: 'Close',
              action: 'close',
              ...needsDocument,
            },
            {
              type: 'button',
              col: 2,
              row: 2,
              icon: 'app:docs-close',
              label: 'Close all',
              action: 'close-all',
              ...needsDocument,
            },
            {
              type: 'button',
              col: 2,
              row: 3,
              icon: 'app:duplicate',
              label: 'Duplicate',
              action: 'duplicate',
              ...needsDocument,
            },
          ],
        },
        {
          id: 'format',
          title: 'Format',
          columns: 2,
          items: [
            {
              type: 'toggle-button',
              col: 1,
              row: 1,
              icon: 'app:bold',
              label: 'Bold',
              action: 'bold',
              shortcut: 'Ctrl+B',
              checked: field('bold', false),
              ...needsDocument,
            },
            {
              type: 'toggle-button',
              col: 1,
              row: 2,
              icon: 'app:italic',
              label: 'Italic',
              action: 'italic',
              shortcut: 'Ctrl+I',
              checked: field('italic', false),
              ...needsDocument,
            },
            {
              type: 'toggle-button',
              col: 1,
              row: 3,
              icon: 'app:underline',
              label: 'Underline',
              action: 'underline',
              shortcut: 'Ctrl+U',
              checked: field('underline', false),
              ...needsDocument,
            },
            {
              type: 'button',
              col: 2,
              row: 1,
              icon: 'app:eraser',
              label: 'Clear format',
              action: 'clear',
              ...needsDocument,
            },
          ],
        },
        {
          id: 'view',
          title: 'View',
          columns: 2,
          items: [
            {
              type: 'toggle-button',
              inputs: { size: 'large' },
              col: 1,
              icon: 'app:count',
              label: 'Word count',
              checked: editor.showCount,
            },
            {
              type: 'styled-button',
              inputs: { variant: 'primary' },
              col: 2,
              row: 1,
              icon: 'app:layout',
              label: 'Reset layout',
              action: 'reset-layout',
            },
          ],
        },
      ],
    },

    // ---- 2. Controls: a combobox, a spinner, color pickers, a toggle group, a menu button, a gallery, a check box, radios, a select, a table picker, a progress bar ----
    {
      id: 'controls',
      label: 'Controls',
      keytip: 'C',
      sections: [
        {
          id: 'font',
          title: 'Font',
          columns: '84px 84px',
          items: [
            {
              type: 'combobox',
              col: 1,
              row: 1,
              colSpan: 2,
              choices: FONTS,
              value: field('font', ''),
              tooltip: 'Font',
              action: 'font',
              ...needsDocument,
            },
            {
              type: 'spinner',
              col: 1,
              row: 2,
              colSpan: 2,
              label: 'Size',
              value: field('size', 16),
              inputs: { min: 8, max: 72, unit: 'px' },
              action: 'size',
              ...needsDocument,
            },
            {
              type: 'color-picker',
              col: 1,
              row: 3,
              icon: 'app:font',
              label: 'Font color',
              value: field('color', 'auto'),
              inputs: { automatic: '#000000', moreColors: true },
              action: 'color',
              ...needsDocument,
            },
            {
              type: 'color-picker',
              col: 2,
              row: 3,
              icon: 'app:highlighter',
              label: 'Highlight',
              value: field('highlight', 'none'),
              inputs: { allowNone: true },
              action: 'highlight',
              ...needsDocument,
            },
          ],
        },
        {
          id: 'paragraph',
          title: 'Paragraph',
          items: [
            {
              type: 'toggle-group',
              row: 1,
              inputs: { exclusive: true },
              label: 'Alignment',
              action: 'align',
              choices: ALIGNMENTS.map(({ value, label }) => ({
                value,
                label,
                icon: `app:align-${value}`,
                checked: computed(() => editor.format()?.align === value),
              })),
              ...needsDocument,
            },
            {
              type: 'dropdown-button',
              row: 2,
              icon: 'app:spacing',
              label: 'Line spacing',
              action: 'spacing',
              value: field('spacing', '1.5'),
              choices: [
                { label: '1.0', value: '1' },
                { label: '1.15', value: '1.15' },
                { label: '1.5', value: '1.5' },
                { label: '2.0', value: '2' },
              ],
              ...needsDocument,
            },
          ],
        },
        {
          id: 'styles',
          title: 'Styles',
          columns: '240px',
          items: [
            {
              type: 'gallery',
              label: 'Styles',
              choices: STYLE_CHOICES,
              value: field('style', 'normal'),
              inputs: { pageSize: 3 },
              action: 'style',
              ...needsDocument,
            },
          ],
        },
        {
          id: 'page',
          title: 'Page',
          columns: 'auto 110px auto',
          items: [
            {
              type: 'checkbox',
              col: 1,
              row: 1,
              label: 'Frame',
              checked: field('frame', false),
              action: 'frame',
              ...needsDocument,
            },
            {
              type: 'radio',
              col: 1,
              row: 2,
              inputs: { group: 'width' },
              label: 'Wide',
              checked: computed(() => editor.format()?.width === 'wide'),
              action: 'wide',
              ...needsDocument,
            },
            {
              type: 'radio',
              col: 1,
              row: 3,
              inputs: { group: 'width' },
              label: 'Narrow',
              checked: computed(() => editor.format()?.width === 'narrow'),
              action: 'narrow',
              ...needsDocument,
            },
            { type: 'label', col: 2, row: 1, label: 'Paper' },
            {
              type: 'select',
              col: 2,
              row: 2,
              tooltip: 'Paper',
              action: 'paper',
              value: field('paper', 'white'),
              choices: [
                { label: 'White', value: 'white' },
                { label: 'Cream', value: 'cream' },
                { label: 'Mint', value: 'mint' },
              ],
              ...needsDocument,
            },
            {
              type: 'table-picker',
              col: 3,
              icon: 'app:table',
              label: 'Table',
              action: 'table',
              choices: [{ label: 'Remove the table', value: 'remove' }],
              ...needsDocument,
            },
          ],
        },
        {
          id: 'goal',
          title: 'Goal',
          columns: '150px',
          items: [
            {
              type: 'progress-bar',
              row: 1,
              label: 'Words',
              value: computed(() => Math.min(100, (editor.words() / editor.goal()) * 100)),
              inputs: { showValue: true, valueText: () => `${editor.words()} / ${editor.goal()}` },
            },
            {
              type: 'spinner',
              row: 2,
              icon: 'app:goal',
              label: 'Goal',
              value: editor.goal,
              inputs: { min: 10, max: 1000, step: 10 },
            },
          ],
        },
      ],
    },

    // ---- 3. Collapsing: compact forms and the order in which the sections shrink and collapse ----
    {
      id: 'collapsing',
      label: 'Collapsing',
      keytip: 'L',
      sections: [
        {
          // Shrinks last (3), and never collapses into a button.
          id: 'pages',
          title: 'Pages',
          collapsePriority: 3,
          collapsible: false,
          columns: 3,
          compactColumns: 1,
          items: [
            insert({
              type: 'large-button',
              col: 1,
              icon: 'app:cover',
              label: 'Cover page',
              compact: { type: 'button', col: 1, row: 1 },
            }),
            insert({
              type: 'large-button',
              col: 2,
              icon: 'app:page',
              label: 'Blank page',
              compact: { type: 'button', col: 1, row: 2 },
            }),
            insert({
              type: 'large-button',
              col: 3,
              icon: 'app:page-break',
              label: 'Page break',
              compact: { type: 'button', col: 1, row: 3 },
            }),
          ],
        },
        {
          id: 'illustrations',
          title: 'Illustrations',
          collapsePriority: 1,
          columns: 3,
          compactColumns: 1,
          items: [
            insert({
              type: 'large-button',
              col: 1,
              icon: 'app:picture',
              label: 'Picture',
              compact: { type: 'button', col: 1, row: 1 },
            }),
            insert({
              type: 'large-button',
              col: 2,
              icon: 'app:chart',
              label: 'Chart',
              compact: { type: 'button', col: 1, row: 2 },
            }),
            insert({
              type: 'large-button',
              col: 3,
              icon: 'app:shapes',
              label: 'Shapes',
              compact: { type: 'button', col: 1, row: 3 },
            }),
          ],
        },
        {
          // Its compact form (three icons) is narrower than a collapsed section would be, so the ribbon never collapses it: there is no room to gain.
          id: 'links',
          title: 'Links',
          collapsePriority: 1,
          items: [
            insert({
              type: 'button',
              row: 1,
              icon: 'app:link',
              label: 'Link',
              compact: { inputs: { iconOnly: true } },
            }),
            insert({
              type: 'button',
              row: 2,
              icon: 'app:bookmark',
              label: 'Bookmark',
              compact: { inputs: { iconOnly: true } },
            }),
            insert({
              type: 'button',
              row: 3,
              icon: 'app:duplicate',
              label: 'Cross-reference',
              compact: { inputs: { iconOnly: true } },
            }),
          ],
        },
        {
          // No compact form: it cannot shrink, so it collapses at once in the second round.
          id: 'comments',
          title: 'Comments',
          columns: 2,
          items: [
            insert({ type: 'large-button', col: 1, icon: 'app:comment', label: 'New comment' }),
            insert({ type: 'button', col: 2, row: 1, icon: 'app:note', label: 'Note' }),
          ],
        },
        {
          id: 'text',
          title: 'Text',
          columns: 2,
          compactColumns: 1,
          items: [
            insert({
              type: 'large-button',
              col: 1,
              icon: 'app:textbox',
              label: 'Text box',
              compact: { type: 'button', col: 1, row: 1 },
            }),
            insert({
              type: 'button',
              col: 2,
              row: 1,
              icon: 'app:date',
              label: 'Date',
              compact: { col: 1, row: 2 },
            }),
            insert({
              type: 'button',
              col: 2,
              row: 2,
              icon: 'app:bookmark',
              label: 'Signature',
              compact: { col: 1, row: 3 },
            }),
          ],
        },
        {
          // Shrinks first (-1).
          id: 'symbols',
          title: 'Symbols',
          collapsePriority: -1,
          columns: 2,
          compactColumns: 1,
          items: [
            {
              type: 'split-button',
              inputs: { size: 'large' },
              col: 1,
              icon: 'app:symbol',
              label: 'Symbol',
              action: 'symbol',
              choices: ['©', '€', '±', '→', '✓'].map((symbol) => ({ label: symbol })),
              compact: { inputs: { size: 'small' }, col: 1, row: 1 },
              ...needsDocument,
            },
            insert({
              type: 'button',
              col: 2,
              row: 1,
              icon: '🙂',
              label: 'Emoji',
              compact: { col: 1, row: 2 },
            }),
          ],
        },
      ],
    },
  ];
}
