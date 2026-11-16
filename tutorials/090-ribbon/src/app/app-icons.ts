// The icons of the ribbon: SVG texts, registered under names of their own in app.config.ts.
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
  // Documents
  'app:doc-new': `<svg viewBox="0 0 16 16" aria-hidden="true">${PAGE}<path ${LINE} d="M8 7.5v4.5M5.75 9.75h4.5"/></svg>`,
  'app:doc-close': `<svg viewBox="0 0 16 16" aria-hidden="true">${PAGE}<path ${LINE} d="M6.25 8l3.5 3.5M9.75 8l-3.5 3.5"/></svg>`,
  'app:docs-close': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M5.75 1.75h6.5v9.5"/><path ${LINE} d="M2.75 4.25h7v10h-7z"/><path ${LINE} d="M4.75 7.75l3 3M7.75 7.75l-3 3"/></svg>`,
  'app:duplicate': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M5.75 1.75h6.5v9.5"/><path ${LINE} d="M2.75 4.25h7v10h-7z"/></svg>`,
  'app:layout': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75zM1.75 6h12.5M9.75 6v7.25"/></svg>`,
  'app:count': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M5.5 2.25l-1.5 11.5M11.25 2.25l-1.5 11.5M2.5 5.75h11M2 10.25h11"/></svg>`,
  // Text
  'app:bold': LETTER('B', 'font-weight="700"'),
  'app:italic': LETTER('I', 'font-style="italic"'),
  'app:underline': `<svg viewBox="0 0 16 16" aria-hidden="true"><text x="8" y="10.75" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="currentColor">U</text><path ${LINE} d="M3.5 14h9"/></svg>`,
  'app:font': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M3.75 11.5 8 1.75l4.25 9.75M5.4 7.75h5.2"/></svg>`,
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
  'app:align-justify': LINES([
    [2, 14],
    [2, 14],
    [2, 14],
    [2, 14],
  ]),
  'app:spacing': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M7 3.25h7M7 8h7M7 12.75h7M3.5 2v12M1.75 3.75 3.5 2l1.75 1.75M1.75 12.25 3.5 14l1.75-1.75"/></svg>`,
  'app:goal': `<svg viewBox="0 0 16 16" aria-hidden="true"><circle ${LINE} cx="8" cy="8" r="6.25"/><circle ${LINE} cx="8" cy="8" r="3.25"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>`,
  // Insert
  'app:table': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75zM1.75 6.25h12.5M1.75 9.75h12.5M6 2.75v10.5M10 2.75v10.5"/></svg>`,
  'app:picture': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75z"/><circle ${LINE} cx="5.5" cy="6" r="1.25"/><path ${LINE} d="M1.75 11.5l3.75-3.25 2.75 2.25 2.25-2 3.75 3.25"/></svg>`,
  'app:chart': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 14.25h12.5M3.5 14.25V8.5h2.5v5.75M7 14.25V3.5h2.5v10.75M10.5 14.25V6.5H13v7.75"/></svg>`,
  'app:shapes': `<svg viewBox="0 0 16 16" aria-hidden="true"><circle ${LINE} cx="5.25" cy="5.25" r="3.5"/><path ${LINE} d="M8.25 8.25h6v6h-6z"/></svg>`,
  'app:link': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M6.75 9.25a3 3 0 0 0 4.25 0l2.25-2.25a3 3 0 0 0-4.25-4.25l-.75.75M9.25 6.75a3 3 0 0 0-4.25 0L2.75 9a3 3 0 0 0 4.25 4.25l.75-.75"/></svg>`,
  'app:bookmark': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M4 1.75h8v12.5l-4-3-4 3z"/></svg>`,
  'app:comment': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M2 2.75h12v8.5H7L4 14v-2.75H2z"/></svg>`,
  'app:note': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M2.25 2.25h11.5v7.5l-4 4h-7.5z"/><path ${LINE} d="M9.75 13.75v-4h4"/></svg>`,
  'app:textbox': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M1.75 2.75h12.5v10.5H1.75zM5 5.75h6M8 5.75v4.75"/></svg>`,
  'app:date': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M2.25 3.25h11.5v10.5H2.25zM2.25 6.5h11.5M5.25 1.75v3M10.75 1.75v3"/></svg>`,
  'app:symbol': LETTER('Ω'),
  'app:cover': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M3.25 1.75h9.5v12.5h-9.5zM5.5 5h5M5.5 7.5h3.5"/></svg>`,
  'app:page': `<svg viewBox="0 0 16 16" aria-hidden="true">${PAGE}</svg>`,
  'app:page-break': `<svg viewBox="0 0 16 16" aria-hidden="true"><path ${LINE} d="M3.75 6V1.75h8.5V6M3.75 10v4.25h8.5V10"/><path ${LINE} d="M1.5 8h2M5.5 8h2M9.5 8h2M13.5 8h1"/></svg>`,
};
