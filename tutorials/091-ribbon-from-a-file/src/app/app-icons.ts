// The icons that the files of the ribbon name (`"icon": "app:paste"`): SVG texts, registered under names of their own in app.config.ts.
//
// They are drawn the way the icons of the library are: a 16 x 16 viewBox, no width and height (the button gives the size), an
// outline in currentColor (the ribbon colors its icons with the accent of the theme, so they follow every theme).

const LINE =
  'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';
const PAGE = `<path ${LINE} d="M3.75 1.75h5.5l3 3v9.5h-8.5z"/><path ${LINE} d="M9.25 1.75v3h3"/>`;
const LETTER = (text: string, extra = '') =>
  `<svg viewBox="0 0 16 16" aria-hidden="true"><text x="8" y="12.25" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="currentColor" ${extra}>${text}</text></svg>`;
const LINES = (rows: [number, number][]) =>
  `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="${rows
    .map(([from, to], i) => `M${from} ${3 + i * 3.25}H${to}`)
    .join('')}"/></svg>`;

export const APP_ICONS: Record<string, string> = {
  // Clipboard and zoom
  'app:paste': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M5 3.5h6v2H5zM4 4.5H3v9h6.5M7.5 7.5h5.5v6H7.5z"/></svg>`,
  'app:cut': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M4.5 2.5 10 10M11.5 2.5 6 10"/><circle ${LINE} cx="5" cy="12" r="1.75"/><circle ${LINE} cx="11" cy="12" r="1.75"/></svg>`,
  'app:copy': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3"/></svg>`,
  'app:format-painter': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M3 2.5h8v3.5H3zM11 4h2v4H7.5v2M6 10h3v4H6z"/></svg>`,
  'app:zoom': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M7 2.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM10.25 10.25 13.5 13.5M5 7h4M7 5v4"/></svg>`,
  // Text
  'app:bold': LETTER('B', 'font-weight="700"'),
  'app:italic': LETTER('I', 'font-style="italic"'),
  'app:underline': `<svg viewBox="0 0 16 16" aria-hidden="true"><text x="8" y="10.75" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="currentColor">U</text><path ${LINE} d="M3.5 14h9"/></svg>`,
  'app:highlighter': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M9.75 1.75l4.5 4.5-6 6-4.5-4.5zM3.75 7.75 2 11.5h3.5l.75-.75"/></svg>`,
  'app:eraser': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M9.25 2.25l4.5 4.5-6.5 6.5H4.5l-2.25-2.25zM6.25 5.25l4.5 4.5M7.25 13.25h6.5"/></svg>`,
  'app:align-left': LINES([
    [2, 14],
    [2, 10],
    [2, 14],
    [2, 9],
  ]),
  'app:align-center': LINES([
    [2, 14],
    [4, 12],
    [2, 14],
    [4.5, 11.5],
  ]),
  'app:align-right': LINES([
    [2, 14],
    [6, 14],
    [2, 14],
    [7, 14],
  ]),
  // Insert
  'app:table': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75zM1.75 6.25h12.5M1.75 9.75h12.5M6 2.75v10.5M10 2.75v10.5"/></svg>`,
  'app:picture': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75z"/><circle ${LINE} cx="5.5" cy="6" r="1.25"/><path ${LINE} d="M1.75 11.5l3.75-3.25 2.75 2.25 2.25-2 3.75 3.25"/></svg>`,
  'app:shapes': `<svg viewBox="0 0 16 16" aria-hidden="true"><circle ${LINE} cx="5.25" cy="5.25" r="3.5"/><path ${LINE} d="M8.25 8.25h6v6h-6z"/></svg>`,
  'app:link': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M6.75 9.25a3 3 0 0 0 4.25 0l2.25-2.25a3 3 0 0 0-4.25-4.25l-.75.75M9.25 6.75a3 3 0 0 0-4.25 0L2.75 9a3 3 0 0 0 4.25 4.25l.75-.75"/></svg>`,
  'app:page': `<svg viewBox="0 0 16 16" aria-hidden="true">${PAGE}</svg>`,
  'app:page-break': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M3.75 6V1.75h8.5V6M3.75 10v4.25h8.5V10"/><path ${LINE} d="M1.5 8h2M5.5 8h2M9.5 8h2M13.5 8h1"/></svg>`,
};
